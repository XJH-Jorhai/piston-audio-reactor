import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCameraState,validateViewRecord,serializeViewCollection,parseViewCollection,adaptCameraFraming} from '../src/view-presets.js';
import {createCamera} from '../src/camera.js';

const sample=()=>({layout:'lying',id:'test-camera',name:'低角度长阵列',createdAt:'2026-11-02T08:00:00.000Z',count:64,selected:7,
  camera:{projection:'orthographic',angleUnit:'radians',angles:{yaw:1.64,elevation:.3,roll:.15},target:[.5,.5,108.75],pivot:[.5,.5,23],center:[-1.3,2.7],pan:[72,-34],viewport:{width:1200,height:500},scale:35,zoom:2.46,focused:true},
  settings:{gain:1.4,smooth:55,lowPhase:38,highPhase:0,response:1}});

test('JSON round trip retains full framing, orbit pivot, channels and response settings',()=>{
  const source=sample(),restored=parseViewCollection(serializeViewCollection([source]))[0];
  assert.deepEqual(restored,source);
  restored.camera.angles.yaw=0;restored.camera.pan[0]=0;assert.equal(source.camera.angles.yaw,1.64);assert.equal(source.camera.pan[0],72);
});

test('restored projection reproduces pan and zoom, and fits the captured viewport on another aspect',()=>{
  const {camera:state,count}=sample(),camera=createCamera('free',{count,angles:state.angles,target:state.target});
  const project=(point,width,height)=>{const p=camera.project(point),framed=adaptCameraFraming(state,width,height);return [(p[0]-state.center[0])*framed.scale*state.zoom+width/2+framed.pan[0],(p[1]-state.center[1])*framed.scale*state.zoom+height/2+framed.pan[1]];};
  for(const point of [[0,0,0],[2,1,20],[-1,2,220]]){
    const a=project(point,1200,500),half=project(point,600,250),portrait=project(point,600,1000);
    assert.ok(Math.abs(half[0]-a[0]/2)<1e-10);assert.ok(Math.abs(half[1]-a[1]/2)<1e-10);
    assert.ok(Math.abs(portrait[0]-a[0]/2)<1e-10);assert.ok(Math.abs(portrait[1]-(a[1]/2+375))<1e-10);
  }
  assert.deepEqual(adaptCameraFraming(state,1200,500),{scale:35,pan:[72,-34]});
});

test('invalid imports reject the entire collection before any records are applied',()=>{
  for(const change of [r=>r.count=65,r=>r.camera.angles.yaw=Infinity,r=>r.camera.scale=0,r=>r.camera.zoom=20,r=>r.camera.pan=[0],r=>r.settings.lowPhase=100,r=>r.selected=64]){
    const value=sample();change(value);assert.throws(()=>validateViewRecord(value));
  }
  const json=JSON.parse(serializeViewCollection([sample()]));json.views.push({...sample(),id:'bad',camera:{}});
  assert.throws(()=>parseViewCollection(JSON.stringify(json)));
  assert.throws(()=>parseViewCollection('{bad json'));
  assert.throws(()=>parseViewCollection(JSON.stringify({format:'other',version:1,views:[]})));
  assert.throws(()=>parseViewCollection(serializeViewCollection([sample(),sample()])));
  assert.throws(()=>validateCameraState({}));
});

test('names remain plain data in exported files and never become code',()=>{
  const value=sample();value.name='<img src=x onerror=alert(1)>';
  assert.equal(parseViewCollection(serializeViewCollection([value]))[0].name,value.name);
});
