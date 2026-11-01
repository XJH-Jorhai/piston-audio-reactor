import {createBands,measureBands,smoothLevels,smoothStrokes,restFromPhase,strokeFromLoudness} from './spectrum.js';
import {COUNT,createSceneRenderer,loadTextures} from './scene.js';
const $=id=>document.getElementById(id),audio=$('audio'),canvas=$('reactor');
const defaults={gain:1.4,smooth:55,rest:38},settings={...defaults};
let renderer,context,analyser,source,wave,bands=createBands(48000,4096,COUNT),bins,objectUrl,autoPending=true,panMode=false,previousTime=0,lastMeters=0;
const pointers=new Map();
let energy=new Float32Array(COUNT),strokes=new Float32Array(COUNT).fill(1-restFromPhase(.38)),selected=-1;
const EMPTY=new Float32Array(COUNT),bandButtons=[],frequencyLabel=hz=>hz>=1000?(hz/1000).toFixed(hz>=10000?0:1).replace(/\.0$/,'')+'k':Math.round(hz).toString();
function notice(text){$('message').textContent=text;$('message').hidden=!text;}
function updateStatus(){
  const active=!audio.paused&&context?.state==='running';
  if(active)autoPending=false;
  $('status').textContent=active?'频谱联动中':audio.error?'音频加载失败':audio.ended?'播放结束':renderer?'声场就绪':'正在加载开凿机…';
  $('live-dot').classList.toggle('active',active);$('start').hidden=active||!renderer;
  $('start').querySelector('strong').textContent=audio.ended?'重新播放':audio.currentTime>0?'继续播放':'启动声场';
}
function ensureAudio(){
  if(!context){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)throw Error('当前浏览器不支持 Web Audio 音频分析，请使用新版浏览器。');
    context=new Audio();analyser=context.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=.12;
    bins=new Float32Array(analyser.frequencyBinCount);wave=new Float32Array(analyser.fftSize);bands=createBands(context.sampleRate,analyser.fftSize,COUNT);
    source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);
    context.addEventListener('statechange',updateStatus);renderBands();
  }
  return context.resume();
}
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
  bands.forEach((band,index)=>{
    const button=document.createElement('button');button.type='button';button.className='band';button.dataset.band=index;button.setAttribute('aria-pressed',String(index===selected));
    button.title='查看第 '+(index+1)+' 台 · '+Math.round(band.low)+'–'+Math.round(band.high)+' Hz';
    button.setAttribute('aria-label',button.title);
    button.innerHTML='<div class="band-meter" role="meter" aria-label="频段 '+(index+1)+' 幅度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="band-fill"></div></div><div class="band-meta"><span class="band-frequency">'+frequencyLabel(band.low)+'</span><span class="band-code">'+String(index+1).padStart(2,'0')+'</span><span class="band-direction" aria-label="中位">·</span></div>';
    button.addEventListener('click',()=>{if(!renderer)return;selected=index;renderer.focus(index);syncView();});root.append(button);bandButtons.push(button);
  });
}
function syncView(){
  if(!renderer)return;$('zoom-label').value=Math.round(renderer.zoom*100)+'%';
  for(const mode of ['side','top','free'])$('view-'+mode).setAttribute('aria-pressed',String(renderer.viewMode===mode));
  canvas.dataset.view=renderer.viewMode;
  canvas.dataset.yaw=renderer.angles.yaw.toFixed(4);canvas.dataset.elevation=renderer.angles.elevation.toFixed(4);
  $('view-free').title='方位 '+Math.round(renderer.angles.yaw*180/Math.PI)+'° · 俯角 '+Math.round(renderer.angles.elevation*180/Math.PI)+'°';
  bandButtons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===selected)));
}
function syncSettings(){
  for(const key of Object.keys(defaults)){
    $(key).value=settings[key];$(key+'-value').value=key==='gain'?settings[key].toFixed(1)+'×':settings[key]+'%';
  }
}
for(const key of Object.keys(defaults))$(key).addEventListener('input',event=>{settings[key]=Number(event.target.value);syncSettings();});
$('reset-settings').addEventListener('click',()=>{Object.assign(settings,defaults);syncSettings();});
$('start').addEventListener('click',startAudio);
audio.addEventListener('play',()=>{try{ensureAudio().then(updateStatus).catch(()=>{});}catch(error){notice(error.message);}updateStatus();});
audio.addEventListener('playing',updateStatus);
for(const event of ['pause','ended','waiting','loadedmetadata','emptied'])audio.addEventListener(event,updateStatus);
audio.addEventListener('error',()=>{notice('无法读取这个音频，请更换文件后重试。');updateStatus();});
// One initial interaction can unlock both the media element and AudioContext.
function firstInteraction(event){
  if(!autoPending||!event.isTrusted)return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  autoPending=false;
  if(event.composedPath().includes(audio)){try{ensureAudio().catch(()=>{});}catch{}return;}
  if(event.composedPath().includes($('start')))return;
  startAudio();
}
document.addEventListener('click',firstInteraction,true);document.addEventListener('keydown',firstInteraction,true);
$('upload').addEventListener('click',()=>$('audio-file').click());
$('audio-file').addEventListener('change',event=>{
  const file=event.target.files[0];if(!file)return;
  if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)){notice('请选择 MP3、WAV、M4A、OGG 或 FLAC 音频。');event.target.value='';return;}
  audio.pause();if(objectUrl)URL.revokeObjectURL(objectUrl);
  objectUrl=URL.createObjectURL(file);audio.src=objectUrl;audio.load();energy.fill(0);
  $('track-title').textContent=file.name;$('track-artist').textContent='本地音频';$('start').querySelector('small').textContent=file.name;
  notice('');startAudio();event.target.value='';
});
$('zoom-in').addEventListener('click',()=>{renderer?.setZoom(renderer.zoom*1.3);syncView();});
$('zoom-out').addEventListener('click',()=>{renderer?.setZoom(renderer.zoom/1.3);syncView();});
$('reset-view').addEventListener('click',()=>{renderer?.reset();selected=-1;syncView();});
$('detail-view').addEventListener('click',()=>{renderer?.detail();selected=-1;syncView();});
for(const mode of ['side','top','free'])$('view-'+mode).addEventListener('click',()=>{if(!renderer)return;renderer.setView(mode);if(mode!=='free'){selected=-1;const url=new URL(location.href);url.searchParams.set('view',mode);history.replaceState(null,'',url);}syncView();});
$('pan-mode').addEventListener('click',()=>{panMode=!panMode;$('pan-mode').setAttribute('aria-pressed',String(panMode));canvas.dataset.tool=panMode?'pan':'orbit';});
canvas.addEventListener('pointerdown',event=>{if(!renderer||event.button>2)return;event.preventDefault();canvas.focus({preventScroll:true});pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button!==0||event.shiftKey||panMode});canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{
  const previous=pointers.get(event.pointerId);if(!previous||!renderer)return;
  const next={...previous,x:event.clientX,y:event.clientY},other=[...pointers.entries()].find(([id])=>id!==event.pointerId)?.[1];
  if(other){
    const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);
    if(before>2&&after>2)renderer.setZoom(renderer.zoom*after/before);
    renderer.pan((next.x-previous.x)/2,(next.y-previous.y)/2);
  }else if(previous.pan||event.shiftKey)renderer.pan(next.x-previous.x,next.y-previous.y);
  else renderer.orbit(next.x-previous.x,next.y-previous.y);
  pointers.set(event.pointerId,next);syncView();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,event=>pointers.delete(event.pointerId));
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('dblclick',()=>{renderer?.reset();selected=-1;syncView();});
canvas.addEventListener('keydown',event=>{
  if(!renderer)return;const direction={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];
  if(direction){event.preventDefault();if(event.shiftKey||panMode)renderer.pan(...direction);else renderer.orbit(...direction);}
  else if(['+','=','-','Home'].includes(event.key)){event.preventDefault();if(event.key==='Home'){renderer.reset();selected=-1;}else renderer.setZoom(renderer.zoom*(event.key==='-'?1/1.15:1.15));}else return;
  syncView();
});
canvas.addEventListener('wheel',event=>{if(!renderer)return;event.preventDefault();renderer.setZoom(renderer.zoom*Math.exp(-event.deltaY*.001));syncView();},{passive:false});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('visualizer').requestFullscreen();}catch{notice('此浏览器无法进入全屏，你仍可以旋转、缩放和平移阵列。');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出 ↙':'全屏 ↗';});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();$('scene-error').hidden=false;$('scene-error').textContent='3D 绘图已中断，请刷新页面恢复。';});
function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-previousTime)/1000||1/60));previousTime=now;
  const playing=!audio.paused&&context?.state==='running';
  let targets=EMPTY,rms=0;
  if(playing&&analyser){analyser.getFloatFrequencyData(bins);analyser.getFloatTimeDomainData(wave);for(const sample of wave)rms+=sample*sample;rms=Math.sqrt(rms/wave.length);targets=measureBands(bins,bands,{gain:settings.gain});}
  energy=smoothLevels(energy,targets,dt,settings.smooth/100);
  const rest=1-restFromPhase(settings.rest/100),positions=new Float32Array(COUNT);
  for(let i=0;i<COUNT;i++)positions[i]=strokeFromLoudness(targets[i],{rest,active:playing&&rms>.00003});
  strokes=smoothStrokes(strokes,positions,dt,settings.smooth/100);
  renderer?.draw(strokes,energy);
  if(now-lastMeters>85){
    lastMeters=now;let peak=0,peakIndex=0;
    $('level-reading').innerHTML=(playing&&rms>.00001?Math.round(20*Math.log10(rms)):'—')+'<small> dBFS</small>';
    for(let i=0;i<COUNT;i++){
      const button=bandButtons[i],value=Math.round(energy[i]*100),delta=strokes[i]-rest;
      button.style.setProperty('--level',energy[i].toFixed(4));button.querySelector('[role=meter]').setAttribute('aria-valuenow',value);
      const arrow=button.querySelector('.band-direction');arrow.textContent=Math.abs(delta)<.002?'·':delta>0?'↑':'↓';arrow.setAttribute('aria-label',Math.abs(delta)<.002?'中位':delta>0?'躯干上升':'躯干下降');arrow.title='躯干升降行程 '+Math.round(strokes[i]*100)+'%';
      if(energy[i]>peak){peak=energy[i];peakIndex=i;}
    }
    $('peak-reading').textContent=peak>.005?'主频段 '+frequencyLabel(bands[peakIndex].low)+'–'+frequencyLabel(bands[peakIndex].high)+' Hz':'峰值 —';
  }
  requestAnimationFrame(frame);
}
renderBands();syncSettings();requestAnimationFrame(frame);
try{
  renderer=createSceneRenderer(canvas,$('labels'),await loadTextures(),{forceCpu:new URLSearchParams(location.search).get('renderer')==='cpu'});canvas.dataset.machines=COUNT;canvas.dataset.renderer=renderer.backend;canvas.dataset.projection='orthographic';canvas.dataset.orientation='lying';if(new URLSearchParams(location.search).get('view')==='top')renderer.setView('top');syncView();updateStatus();startAudio();
}catch(error){$('scene-error').hidden=false;$('scene-error').textContent='开凿机加载失败：'+error.message;$('status').textContent='可视化暂不可用';}
window.addEventListener('pagehide',()=>{audio.pause();context?.suspend();});
window.addEventListener('pageshow',event=>{if(event.persisted)updateStatus();});
