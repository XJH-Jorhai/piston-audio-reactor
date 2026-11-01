import {createBands,measureBands,smoothLevels,smoothStrokes,createStrokeMapper,DEFAULT_MAPPING,normalizeMapping} from './spectrum.js';
import {COUNT,createSceneRenderer,loadTextures} from './scene.js';
import {validateCount} from './machine.js';
import {mountViewDeveloper} from './view-developer.js';
import {LAYOUT,IS_LYING,SHOW_DEVELOPER,sceneDescription} from './layout.js';
import {CAMERA_SHORTCUTS,shortcutCamera} from './camera-shortcuts.js';
export const preload=loadTextures;

export async function mountReactor({session,textures,autostart=true,resumeState}={}){
const lifetime=new AbortController(),signal=lifetime.signal;
const on=(target,type,callback,options={})=>target.addEventListener(type,callback,{...(typeof options==='boolean'?{capture:options}:options),signal});
let animationFrame;const schedule=()=>{animationFrame=requestAnimationFrame(frame);};
const $=id=>document.getElementById(id),audio=session.audio,canvas=$('reactor');
const defaults={gain:1.4,smooth:55,...DEFAULT_MAPPING},settings={...defaults},mappingKey='piston-'+LAYOUT+'-loudness-mapping-v1';
let activeShortcut=null;const shortcutButtons=[];
let storageAvailable=true;
try{const saved=localStorage.getItem(mappingKey);if(saved!==null)Object.assign(settings,normalizeMapping(JSON.parse(saved)));}catch{storageAvailable=false;}
let mapStroke=createStrokeMapper(settings);
let count=COUNT;try{const requested=new URLSearchParams(location.search).get('count');if(requested!==null)count=validateCount(Number(requested));}catch{}
let renderer,context,analyser,wave,bands=createBands(48000,4096,count),bins,autoPending=autostart,panMode=false,previousTime=0,lastMeters=0;
const pointers=new Map();
let energy=new Float32Array(count),strokes=new Float32Array(count).fill(mapStroke(0)),selected=-1,EMPTY=new Float32Array(count);
const bandButtons=[],frequencyLabel=hz=>hz>=1000?(hz/1000).toFixed(hz>=10000?0:1).replace(/\.0$/,'')+'k':Math.round(hz).toString();
function notice(text){if(signal.aborted)return;$('message').textContent=text;$('message').hidden=!text;}
function updateStatus(){
  if(signal.aborted)return;
  const active=!audio.paused&&context?.state==='running';
  if(active)autoPending=false;
  $('status').textContent=active?'频谱联动中':audio.error?'音频加载失败':audio.ended?'播放结束':renderer?'声场就绪':'正在加载开凿机…';
  $('live-dot').classList.toggle('active',active);$('start').hidden=active||!renderer;
  $('start').querySelector('strong').textContent=audio.ended?'重新播放':audio.currentTime>0?'继续播放':'启动声场';
}
function bindAudioGraph(){
  if(context)return;
  const graph=session.graph();context=graph.context;analyser=graph.analyser;
  bins=new Float32Array(analyser.frequencyBinCount);wave=new Float32Array(analyser.fftSize);bands=createBands(context.sampleRate,analyser.fftSize,count);
  on(context,'statechange',updateStatus);renderBands();
}
function ensureAudio(){bindAudioGraph();return context.resume();}
async function startAudio(){
  try{
    notice('');const ready=ensureAudio(),play=audio.play();await Promise.all([ready,play]);autoPending=false;updateStatus();
  }catch(error){
    if(error.name!=='NotAllowedError'&&error.name!=='AbortError')notice(error.message||'无法播放音频，请尝试其他文件。');
    updateStatus();
  }
}
function renderBands(){
  const root=$('spectrum');root.replaceChildren();bandButtons.length=0;
  root.style.setProperty('--band-count',count);root.classList.toggle('dense',count>=16);root.setAttribute('aria-label',count+' 个频段的实时幅度，点击频段查看对应开凿机');
  bands.forEach((band,index)=>{
    const button=document.createElement('button');button.type='button';button.className='band';button.dataset.band=index;button.dataset.tone=index/count<1/3?'low':index/count<2/3?'mid':'high';button.setAttribute('aria-pressed',String(index===selected));
    button.title='查看第 '+(index+1)+' 台 · '+Math.round(band.low)+'–'+Math.round(band.high)+' Hz';
    button.setAttribute('aria-label',button.title);
    button.innerHTML='<div class="band-meter" role="meter" aria-label="频段 '+(index+1)+' 幅度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="band-fill"></div></div><div class="band-meta"><span class="band-frequency">'+frequencyLabel(band.low)+'</span><span class="band-direction" aria-label="中位">·</span></div>';
    on(button,'click',()=>{if(!renderer)return;selected=index;renderer.focus(index);syncView(true);});root.append(button);bandButtons.push(button);
  });
}
function syncCount(){
  $('channel-count').value=count;$('channel-count-value').value=count+' 路';$('machine-count-value').textContent=count;
  $('array-label').textContent='PERSPECTIVE CORRIDOR';
  for(const value of [8,16,32,64])$('count-'+value).setAttribute('aria-pressed',String(count===value));
  canvas.dataset.layout=LAYOUT;canvas.dataset.machines=count;canvas.setAttribute('aria-label',sceneDescription(count)+'方向键旋转，Shift 加方向键平移，Home 适配。');
  document.title='让声谱，推动开凿。';
}
function changeCount(value){
  const next=validateCount(value);if(next===count)return;
  renderer?.setCount(next);count=next;selected=-1;bands=createBands(context?.sampleRate||48000,4096,count);
  energy=new Float32Array(count);strokes=new Float32Array(count).fill(mapStroke(0));EMPTY=new Float32Array(count);
  renderBands();syncCount();if(activeShortcut)applyShortcut(activeShortcut,false);else syncView();const url=new URL(location.href);url.searchParams.set('count',count);history.replaceState(null,'',url);document.dispatchEvent(new CustomEvent('reactor:countchange',{detail:count}));
}
on($('channel-count'),'input',event=>changeCount(Number(event.target.value)));
for(const value of [8,16,32,64])on($('count-'+value),'click',()=>changeCount(value));
function applyShortcut(id,updateUrl=true){
  if(!renderer)return;const record=CAMERA_SHORTCUTS.find(view=>view.id===id);if(!record)return;
  renderer.restoreCamera(shortcutCamera(record,count));activeShortcut=id;selected=-1;syncView();
  if(updateUrl){const url=new URL(location.href);url.searchParams.set('preset',id);history.replaceState(null,'',url);}
}
function syncView(manual=false){
  if(manual&&activeShortcut){activeShortcut=null;const url=new URL(location.href);url.searchParams.delete('preset');history.replaceState(null,'',url);}
  if(!renderer)return;$('zoom-label').value=Math.round(renderer.zoom*100)+'%';
  for(const mode of ['side','top','free'])$('view-'+mode).setAttribute('aria-pressed',String(renderer.viewMode===mode));
  canvas.dataset.view=renderer.viewMode;
  canvas.dataset.shortcut=activeShortcut||'';shortcutButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shortcut===activeShortcut)));
  canvas.dataset.yaw=renderer.angles.yaw.toFixed(4);canvas.dataset.elevation=renderer.angles.elevation.toFixed(4);
  $('view-free').title='方位 '+Math.round(renderer.angles.yaw*180/Math.PI)+'° · 俯角 '+Math.round(renderer.angles.elevation*180/Math.PI)+'°';
  bandButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected)));
}
function syncSettings(){
  mapStroke=createStrokeMapper(settings);
  for(const key of Object.keys(defaults)){
    $(key).value=settings[key];$(key+'-value').value=key==='gain'||key==='response'?settings[key].toFixed(2).replace(/0$/,'')+'×':settings[key]+'%';
  }
  $('mapping-summary').textContent=settings.lowPhase+'% → '+settings.highPhase+'%';
  $('reset-mapping').textContent='恢复 '+DEFAULT_MAPPING.lowPhase+' → '+DEFAULT_MAPPING.highPhase+' ⤾';
  $('mapping-storage').textContent=storageAvailable?'自动保存在此浏览器':'本次页面生效';
  canvas.dataset.lowExtension=mapStroke(0).toFixed(5);canvas.dataset.highExtension=mapStroke(1).toFixed(5);
}
function saveMapping(){try{localStorage.setItem(mappingKey,JSON.stringify(normalizeMapping(settings)));storageAvailable=true;}catch{storageAvailable=false;}}
for(const key of Object.keys(defaults))on($(key),'input',event=>{settings[key]=Number(event.target.value);if(key in DEFAULT_MAPPING)saveMapping();syncSettings();});
on($('reset-mapping'),'click',()=>{Object.assign(settings,DEFAULT_MAPPING);saveMapping();syncSettings();});
on($('reset-settings'),'click',()=>{Object.assign(settings,defaults);saveMapping();syncSettings();});
$('developer-tools').hidden=!SHOW_DEVELOPER;
const developerTools=SHOW_DEVELOPER?mountViewDeveloper({
  signal,
  capture(){if(!renderer)throw Error('请等待模型加载完成。');return {layout:LAYOUT,count,selected:selected<0?null:selected,camera:renderer.captureCamera(),settings:{...settings}};},
  restore(record){if(record.layout!==LAYOUT)throw Error('请选择此阵列版本的视角记录。');Object.assign(settings,record.settings);saveMapping();syncSettings();changeCount(record.count);renderer.restoreCamera(record.camera);selected=record.selected??-1;syncView(true);}
}):null;
on($('start'),'click',startAudio);
on(audio,'play',()=>{try{ensureAudio().then(updateStatus).catch(()=>{});}catch(error){notice(error.message);}updateStatus();});
on(audio,'playing',updateStatus);
for(const event of ['pause','ended','waiting','loadedmetadata','emptied'])on(audio,event,updateStatus);
on(audio,'error',()=>{notice('无法读取这个音频，请更换文件后重试。');updateStatus();});
// One initial interaction can unlock both the media element and AudioContext.
function firstInteraction(event){
  if(!autoPending||!event.isTrusted)return;
  if(event.composedPath().some(node=>node?.dataset?.reactorLayout))return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  autoPending=false;
  if(event.composedPath().includes(audio)){try{ensureAudio().catch(()=>{});}catch{}return;}
  if(event.composedPath().includes($('start')))return;
  startAudio();
}
on(document,'click',firstInteraction,true);on(document,'keydown',firstInteraction,true);
on($('upload'),'click',()=>$('audio-file').click());
on($('audio-file'),'change',event=>{
  const file=event.target.files[0];if(!file)return;
  if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)){notice('请选择 MP3、WAV、M4A、OGG 或 FLAC 音频。');event.target.value='';return;}
  session.replaceFile(file);energy.fill(0);
  $('track-title').textContent=file.name;$('track-artist').textContent='本地音频';$('start').querySelector('small').textContent=file.name;
  notice('');startAudio();event.target.value='';
});
on($('zoom-in'),'click',()=>{renderer?.setZoom(renderer.zoom*1.3);syncView(true);});
on($('zoom-out'),'click',()=>{renderer?.setZoom(renderer.zoom/1.3);syncView(true);});
on($('reset-view'),'click',()=>{renderer?.reset();selected=-1;syncView(true);});
on($('detail-view'),'click',()=>{renderer?.detail();selected=-1;syncView(true);});
for(const mode of ['side','top','free'])on($('view-'+mode),'click',()=>{if(!renderer)return;renderer.setView(mode);if(mode!=='free'){selected=-1;const url=new URL(location.href);url.searchParams.set('view',mode);history.replaceState(null,'',url);}syncView(true);});
on($('pan-mode'),'click',()=>{panMode=!panMode;$('pan-mode').setAttribute('aria-pressed',String(panMode));canvas.dataset.tool=panMode?'pan':'orbit';});
on(canvas,'pointerdown',event=>{if(!renderer||event.button>2)return;event.preventDefault();canvas.focus({preventScroll:true});pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button!==0||event.shiftKey||panMode});canvas.setPointerCapture(event.pointerId);});
on(canvas,'pointermove',event=>{
  const previous=pointers.get(event.pointerId);if(!previous||!renderer)return;
  const next={...previous,x:event.clientX,y:event.clientY},other=[...pointers.entries()].find(([id])=>id!==event.pointerId)?.[1];
  if(other){
    const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
    if(before>2&&after>2)renderer.setZoom(renderer.zoom*after/before);
    renderer.pan((next.x-previous.x)/2,(next.y-previous.y)/2);
  }else if(previous.pan||event.shiftKey)renderer.pan(next.x-previous.x,next.y-previous.y);
  else renderer.orbit(next.x-previous.x,next.y-previous.y);
  pointers.set(event.pointerId,next);syncView(true);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])on(canvas,event,event=>pointers.delete(event.pointerId));
on(canvas,'contextmenu',event=>event.preventDefault());
on(canvas,'dblclick',()=>{renderer?.reset();selected=-1;syncView(true);});
on(canvas,'keydown',event=>{
  if(!renderer)return;const direction={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];
  if(direction){event.preventDefault();if(event.shiftKey||panMode)renderer.pan(...direction);else renderer.orbit(...direction);}
  else if(['+','=','-','Home'].includes(event.key)){event.preventDefault();if(event.key==='Home'){renderer.reset();selected=-1;}else renderer.setZoom(renderer.zoom*(event.key==='-'?1/1.15:1.15));}else return;
  syncView(true);
});
on(canvas,'wheel',event=>{if(!renderer)return;event.preventDefault();renderer.setZoom(renderer.zoom*Math.exp(-event.deltaY*.001));syncView(true);},{passive:false});
on($('fullscreen'),'click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('visualizer').requestFullscreen();}catch{notice('此浏览器无法进入全屏，你仍可以旋转、缩放和平移阵列。');}});
on(document,'fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出 ↙':'全屏 ↗';});
on(canvas,'webglcontextlost',event=>{event.preventDefault();$('scene-error').hidden=false;$('scene-error').textContent='3D 绘图已中断，请刷新页面恢复。';});
function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-previousTime)/1000||1/60));previousTime=now;
  const playing=!audio.paused&&context?.state==='running';
  let targets=EMPTY,rms=0;
  if(playing&&analyser){analyser.getFloatFrequencyData(bins);analyser.getFloatTimeDomainData(wave);for(const sample of wave)rms+=sample*sample;rms=Math.sqrt(rms/wave.length);targets=measureBands(bins,bands,{gain:settings.gain});}
  energy=smoothLevels(energy,targets,dt,settings.smooth/100);
  const rest=mapStroke(0),high=mapStroke(1),positions=new Float32Array(count);
  for(let i=0;i<count;i++)positions[i]=mapStroke(targets[i],playing&&rms>.00003);
  strokes=smoothStrokes(strokes,positions,dt,settings.smooth/100);
  for(let i=0;i<count;i++)strokes[i]=Math.max(Math.min(rest,high),Math.min(Math.max(rest,high),Math.abs(strokes[i]-positions[i])<.00001?positions[i]:strokes[i]));
  renderer?.draw(strokes,energy);
  if(now-lastMeters>85){
    lastMeters=now;let peak=0,peakIndex=0;
    $('level-reading').innerHTML=(playing&&rms>.00001?Math.round(20*Math.log10(rms)):'—')+'<small> dBFS</small>';
    for(let i=0;i<count;i++){
      const button=bandButtons[i],value=Math.round(energy[i]*100),delta=strokes[i]-rest;
      button.style.setProperty('--level',energy[i].toFixed(4));button.querySelector('[role=meter]').setAttribute('aria-valuenow',value);
      const arrow=button.querySelector('.band-direction');arrow.textContent=Math.abs(delta)<.002?'·':delta>0?'↑':'↓';arrow.setAttribute('aria-label',Math.abs(delta)<.002?'低电平姿态':delta>0?(IS_LYING?'躯干上升':'躯干伸出'):(IS_LYING?'躯干下降':'躯干收回'));arrow.title='躯干伸出 '+Math.round(strokes[i]*100)+'%（100% 为全伸出）';
      if(energy[i]>peak){peak=energy[i];peakIndex=i;}
    }
    $('peak-reading').textContent=peak>.005?'主频段 '+frequencyLabel(bands[peakIndex].low)+'–'+frequencyLabel(bands[peakIndex].high)+' Hz':'峰值 —';
  }
  schedule();
}
document.querySelector('h1').textContent='让声谱，推动开凿。';
document.querySelector('.eyebrow').textContent=LAYOUT==='corridor'?'PERSPECTIVE CORRIDOR':IS_LYING?'THREE LANES / LYING ARRAY':'LINEAR MACHINE ARRAY';
$('view-side').textContent=LAYOUT==='corridor'?'长廊':'侧俯视';$('view-top').textContent=LAYOUT==='corridor'?'俯视':'正俯视';
$('pan-mode').setAttribute('aria-pressed','false');canvas.dataset.tool='orbit';
$('scene-error').hidden=true;$('scene-error').textContent='';notice('');
$('shortcut-buttons').replaceChildren();
if(resumeState)Object.assign(settings,resumeState.settings);
$('camera-shortcuts').hidden=!CAMERA_SHORTCUTS.length;
for(const record of CAMERA_SHORTCUTS){const button=document.createElement('button');button.type='button';button.textContent=record.name;button.dataset.shortcut=record.id;button.setAttribute('aria-pressed','false');button.disabled=true;on(button,'click',()=>applyShortcut(record.id));$('shortcut-buttons').append(button);shortcutButtons.push(button);}
renderBands();syncCount();syncSettings();if(session.hasGraph)bindAudioGraph();schedule();
try{
  renderer=createSceneRenderer(canvas,textures||await loadTextures(),{count,forceCpu:new URLSearchParams(location.search).get('renderer')==='cpu'});canvas.dataset.renderer=renderer.backend;canvas.dataset.projection='perspective';canvas.dataset.orientation=IS_LYING?'lying':'standing';if(new URLSearchParams(location.search).get('view')==='top')renderer.setView('top');shortcutButtons.forEach(button=>button.disabled=false);applyShortcut(new URLSearchParams(location.search).get('preset'),false);if(resumeState?.count===count&&resumeState.camera){renderer.restoreCamera(resumeState.camera);selected=resumeState.selected;activeShortcut=resumeState.activeShortcut;}
  syncView();developerTools?.setReady();updateStatus();if(autostart)startAudio();
}catch(error){$('scene-error').hidden=false;$('scene-error').textContent='开凿机加载失败：'+error.message;$('status').textContent='可视化暂不可用';}
on(window,'pagehide',()=>{audio.pause();context?.suspend();});
on(window,'pageshow',event=>{if(event.persisted)updateStatus();});

return {
  snapshot(){return {count,selected,activeShortcut,settings:{...settings},camera:renderer?.captureCamera()};},
  dispose(){lifetime.abort();cancelAnimationFrame(animationFrame);pointers.clear();renderer?.dispose();}
};
}
