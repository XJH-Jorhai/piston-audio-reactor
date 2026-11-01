import {MAX_VIEWS,parseViewCollection,serializeViewCollection,validateViewRecord} from './view-presets.js';
import {LAYOUT} from './layout.js';

export function mountViewDeveloper({capture,restore}){
  const $=id=>document.getElementById(id),key='piston-'+LAYOUT+'-camera-views-v1';
  let records=[],ready=false;
  const status=message=>$('view-status').textContent=message;
  try{const saved=localStorage.getItem(key);if(saved)records=parseViewCollection(saved);}catch{status('未能读取本地视角记录，可重新导入 JSON。');}
  function persist(){try{localStorage.setItem(key,serializeViewCollection(records));return true;}catch{status('记录暂存于本次页面，请导出 JSON 保存。');return false;}}
  function download(views,filename){
    const url=URL.createObjectURL(new Blob([serializeViewCollection(views)],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function render(){
    $('view-record-count').textContent=records.length+' 个';$('record-view').disabled=!ready;$('export-views').disabled=!records.length;
    const list=$('view-records');list.replaceChildren();
    for(const record of records){
      const row=document.createElement('li'),description=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('span'),actions=document.createElement('div');
      name.textContent=record.name;meta.textContent=record.count+' 路 · '+Math.round(record.camera.zoom*100)+'% · '+record.settings.lowPhase+' → '+record.settings.highPhase;
      description.append(name,meta);actions.className='view-record-actions';
      for(const [label,action] of [
        ['载入',()=>{try{restore(validateViewRecord(record));status('已载入「'+record.name+'」。');}catch(error){status(error.message);}}],
        ['导出',()=>download([record],'piston-camera-view.json')],
        ['移除',()=>{records=records.filter(item=>item.id!==record.id);if(persist())status('已移除「'+record.name+'」。');render();}]
      ]){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',label+' '+record.name);button.disabled=label==='载入'&&!ready;button.addEventListener('click',action);actions.append(button);}
      row.append(description,actions);list.append(row);
    }
    $('view-empty').hidden=!!records.length;
  }
  $('record-view').addEventListener('click',()=>{
    try{
      if(!ready)return;if(records.length>=MAX_VIEWS)throw Error('最多记录 '+MAX_VIEWS+' 个视角，请先导出并移除部分记录。');
      const record=validateViewRecord({...capture(),id:crypto.randomUUID(),name:$('view-name').value.trim()||'视角 '+(records.length+1),createdAt:new Date().toISOString()});
      records.push(record);if(persist())status('已记录「'+record.name+'」。');$('view-name').value='';render();
    }catch(error){status(error.message);}
  });
  $('view-name').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('record-view').click();}});
  $('export-views').addEventListener('click',()=>{try{download(records,'piston-camera-views.json');status('已导出 '+records.length+' 个视角。');}catch(error){status(error.message);}});
  $('import-views').addEventListener('click',()=>$('view-file').click());
  $('view-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>2*1024*1024)throw Error('请选择小于 2 MB 的视角 JSON。');
      const imported=parseViewCollection(await file.text()),known=new Set(records.map(record=>record.id)),added=imported.filter(record=>!known.has(record.id));
      if(records.length+added.length>MAX_VIEWS)throw Error('合并后超过 '+MAX_VIEWS+' 个视角，请先整理记录。');
      records=[...records,...added];if(persist())status(added.length?'已导入 '+added.length+' 个视角，可点击“载入”查看。':'这些视角已在记录列表中。');render();
    }catch(error){status(error.message);}finally{event.target.value='';}
  });
  render();
  return {setReady(){ready=true;render();}};
}
