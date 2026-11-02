import {validateCount} from './machine.js';

export const VIEW_FORMAT='piston-audio-reactor.camera-views';
export const MAX_VIEWS=200;
const fail=message=>{throw new TypeError(message);};
const number=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max?value:fail('视角参数不是有效数值，或超出范围。');
const vector=(value,size,limit=100000)=>Array.isArray(value)&&value.length===size?value.map(v=>number(v,-limit,limit)):fail('视角向量格式错误。');
const text=(value,max)=>typeof value==='string'&&value.trim()&&value.length<=max?value.trim():fail('记录名称或标识格式错误。');

export function validateCameraState(value){
  if(value?.projection!=='orthographic'||value.angleUnit!=='radians')fail('不支持这个相机格式。');
  const angles=value.angles;
  return {
    projection:'orthographic',angleUnit:'radians',
    angles:{yaw:number(angles?.yaw,-Math.PI,Math.PI),elevation:number(angles?.elevation,-89*Math.PI/180,89*Math.PI/180),roll:number(angles?.roll,-Math.PI,Math.PI)},
    target:vector(value.target,3),pivot:vector(value.pivot,3),center:vector(value.center,2),pan:vector(value.pan,2,1000000),
    viewport:{width:number(value.viewport?.width,1,100000),height:number(value.viewport?.height,1,100000)},
    scale:number(value.scale,.000001,1000000),zoom:number(value.zoom,.65,12),focused:value.focused===true
  };
}

/** Fit the captured viewport as a rectangle, preserving its composition. */
export function adaptCameraFraming(state,width,height){
  const camera=validateCameraState(state),ratio=Math.min(number(width,1,100000)/camera.viewport.width,number(height,1,100000)/camera.viewport.height);
  return {scale:camera.scale*ratio,pan:camera.pan.map(value=>value*ratio)};
}

export function validateViewRecord(value){
  const count=validateCount(value?.count),settings=value.settings;
  const selected=value.selected===null?null:number(value.selected,0,count-1);
  if(selected!==null&&!Number.isInteger(selected))fail('频段选择格式错误。');
  const layout=value.layout??'lying';if(!['lying','linear'].includes(layout))fail('不支持这个阵列类型。');
  return {
    layout,
    id:text(value.id,128),name:text(value.name,80),createdAt:text(value.createdAt,64),count,selected,
    camera:validateCameraState(value.camera),
    settings:{gain:number(settings?.gain,.3,3),smooth:number(settings?.smooth,0,95),lowPhase:number(settings?.lowPhase,0,50),highPhase:number(settings?.highPhase,0,50),response:number(settings?.response,.25,4)}
  };
}

export function serializeViewCollection(views){
  if(!Array.isArray(views)||views.length>MAX_VIEWS)fail('最多支持 '+MAX_VIEWS+' 个视角记录。');
  return JSON.stringify({format:VIEW_FORMAT,version:1,views:views.map(validateViewRecord)},null,2)+'\n';
}

export function parseViewCollection(json){
  if(typeof json!=='string'||json.length>2*1024*1024)fail('JSON 文件过大或格式错误。');
  let value;try{value=JSON.parse(json);}catch{fail('无法解析 JSON 文件。');}
  if(value?.format!==VIEW_FORMAT||value.version!==1||!Array.isArray(value.views))fail('请选择本页面导出的视角 JSON（版本 1）。');
  if(value.views.length>MAX_VIEWS)fail('最多支持 '+MAX_VIEWS+' 个视角记录。');
  const records=value.views.map(validateViewRecord);
  if(new Set(records.map(record=>record.id)).size!==records.length)fail('JSON 中存在重复的视角标识。');
  return records;
}
