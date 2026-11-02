import {createSceneRenderer,loadTextures} from './engine/scene.js';
import {createBands,measureBands,smoothLevels,smoothStrokes,createStrokeMapper,normalizeMapping} from './engine/spectrum.js';
import {RECORDED_VIEWS} from './engine/recorded-views.js';
import {createAudioSession} from './session.js';
import {readAudioMetadata,filenameInfo,formatTime} from './media.js';
import {parseLyrics,activeLyricIndex,createLyricsLoader} from './lyrics.js?v=player-3';
import {DEMO_TRACKS} from './tracks.js?v=player-3';

const $=id=>document.getElementById(id),audio=$('audio'),canvas=$('reactor');
const session=createAudioSession(audio),baseCamera=RECORDED_VIEWS[0].camera;
const defaults={count:64,gain:1.4,smooth:55,lowPhase:38,highPhase:0,response:1,volume:.8};
const settings={...defaults};
try{
  const saved=JSON.parse(localStorage.getItem('piston-player-settings-v1'));
  if(saved){Object.assign(settings,normalizeMapping(saved));for(const [key,min,max] of [['count',4,64],['gain',.3,3],['smooth',0,95],['volume',0,1]])if(Number.isFinite(saved[key]))settings[key]=Math.max(min,Math.min(max,saved[key]));settings.count=Math.round(settings.count);}
}catch{}
const persist=()=>{try{localStorage.setItem('piston-player-settings-v1',JSON.stringify(settings));}catch{}};
let renderer,graph,bins,wave,bands=createBands(48000,4096,settings.count),energy,strokes,empty,mapStroke=createStrokeMapper(settings);
let previousTime=0,lastMeter=0,cameraEdited=false,toastTimer,coverObjectUrl,trackToken=0,lyricModel={synced:false,lines:[]},activeLine=-2;
let info={title:DEMO_TRACKS[0].title,artist:DEMO_TRACKS[0].artist,album:DEMO_TRACKS[0].album},activeDemoId=DEMO_TRACKS[0].id;
let lyricImportRevision=0;
const lyricsLoader=createLyricsLoader({apply:setLyrics,onError:()=>toast('同步歌词暂时无法载入，可手动导入 LRC。')});
const pointers=new Map(),lyricButtons=[];
audio.volume=settings.volume;
function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=!message;if(message)toastTimer=setTimeout(()=>{$('toast').hidden=true;},4800);}
function fillRange(input){const amount=(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min));input.style.setProperty('--fill',Math.max(0,Math.min(1,amount))*100+'%');}
function rebuildBands(){
  bands=createBands(graph?.context.sampleRate||48000,4096,settings.count);
  empty=new Float32Array(settings.count);energy=new Float32Array(settings.count);strokes=new Float32Array(settings.count).fill(mapStroke(0));
  $('scene-count').textContent=settings.count+' PISTONS';canvas.setAttribute('aria-label',settings.count+' 台开凿机随真实音频频谱伸缩的透视长廊。拖动旋转，Shift 拖动平移。');canvas.dataset.count=settings.count;
}
function ensureGraph(){
  if(!graph){graph=session.graph();bins=new Float32Array(graph.analyser.frequencyBinCount);wave=new Float32Array(graph.analyser.fftSize);graph.context.addEventListener('statechange',syncPlayback);rebuildBands();}
  return graph.context.resume();
}
async function start(){
  try{if(audio.ended)audio.currentTime=0;await Promise.all([ensureGraph(),audio.play()]);}
  catch(error){if(!['NotAllowedError','AbortError'].includes(error.name))toast('音频暂时无法播放，请更换文件后重试。');}
  syncPlayback();
}
function togglePlayback(){if(audio.paused||audio.ended)start();else audio.pause();}
function syncPlayback(){
  const playing=!audio.paused&&!audio.ended;
  document.body.classList.toggle('is-playing',playing);
  const label=playing?'暂停':audio.ended?'重新播放':'播放';
  $('play').setAttribute('aria-label',label);$('play').querySelector('use').setAttribute('href',playing?'#i-pause':'#i-play');
  $('artwork-button').setAttribute('aria-label',label+' '+info.title);$('artwork-button').querySelector('use').setAttribute('href',playing?'#i-pause':'#i-play');
  $('scene-status').textContent=playing?'频谱联动中':renderer?'声场就绪':'声场准备中';
  if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';
}
function setInfo(next){
  info={...info,...next};for(const key of ['title','artist','album'])info[key]=String(info[key]||'').slice(0,180);
  $('track-title').textContent=info.title;$('track-artist').textContent=info.artist;$('album-label').textContent=info.album||'LOCAL SESSION';
  $('edit-title').value=info.title;$('edit-artist').value=info.artist;
  $('cover-art').alt=info.artist+' · '+(info.album||info.title)+' 封面';
  document.title=info.title+' — '+info.artist+' · 开凿播放器';syncPlayback();syncMediaMetadata();
}
function syncMediaMetadata(){
  if('mediaSession' in navigator&&'MediaMetadata' in window){try{navigator.mediaSession.metadata=new MediaMetadata({title:info.title,artist:info.artist,album:info.album,artwork:[{src:$('cover-art').src}]});}catch{}}
}
function setCover(source,{objectUrl=false}={}){
  const old=coverObjectUrl;coverObjectUrl=objectUrl?source:null;
  $('cover-art').src=source;document.documentElement.style.setProperty('--cover-image','url("'+source+'")');
  if(old&&old!==source)URL.revokeObjectURL(old);syncMediaMetadata();
}
function syncVolume(){
  $('volume').value=audio.volume;fillRange($('volume'));$('volume-value').textContent=audio.muted?'0':Math.round(audio.volume*100);
  $('mute').querySelector('use').setAttribute('href',audio.muted||!audio.volume?'#i-muted':'#i-volume');$('mute').setAttribute('aria-label',audio.muted?'取消静音':'静音');
}
function seekTo(time){if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Math.max(0,Math.min(audio.duration,time));syncTimeline();}}
function syncTimeline(){
  const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0;
  $('seek').disabled=!duration;$('seek').max=duration||1;$('seek').value=audio.currentTime||0;fillRange($('seek'));
  $('seek').setAttribute('aria-valuetext',formatTime(audio.currentTime)+' / '+(duration?formatTime(duration):'未知时长'));
  $('elapsed').textContent=formatTime(audio.currentTime);$('duration').textContent=duration?formatTime(duration):'--:--';
  syncLyrics();
  if(duration&&navigator.mediaSession?.setPositionState){try{navigator.mediaSession.setPositionState({duration,playbackRate:audio.playbackRate,position:Math.min(duration,audio.currentTime)});}catch{}}
}
function setLyrics(source){
  lyricsLoader.cancel();lyricImportRevision++;
  lyricModel=parseLyrics(source);activeLine=-2;lyricButtons.length=0;
  const root=$('lyrics-lines');root.replaceChildren();
  $('lyrics-empty').hidden=!!lyricModel.lines.length;root.hidden=!lyricModel.lines.length;
  $('lyrics-window').classList.toggle('unsynced',!lyricModel.synced);$('lyrics-window').scrollTop=0;
  for(const line of lyricModel.lines){
    const node=document.createElement(lyricModel.synced?'button':'p');node.className='lyric-line';node.textContent=line.text||'···';
    if(lyricModel.synced){node.type='button';node.setAttribute('aria-label',formatTime(line.time)+' '+(line.text||'间奏'));node.addEventListener('click',()=>seekTo(line.time));}
    root.append(node);lyricButtons.push(node);
  }
  syncLyrics();
}
function syncLyrics(){
  if(!lyricModel.synced)return;
  const index=activeLyricIndex(lyricModel.lines,audio.currentTime);if(index===activeLine)return;
  if(activeLine>=0){lyricButtons[activeLine]?.classList.remove('active');lyricButtons[activeLine]?.removeAttribute('aria-current');}
  activeLine=index;const active=lyricButtons[index];
  if(active){
    active.classList.add('active');active.setAttribute('aria-current','true');
    const container=$('lyrics-window'),a=active.getBoundingClientRect(),b=container.getBoundingClientRect();
    container.scrollTo({top:container.scrollTop+a.top-b.top-(container.clientHeight-a.height)/2,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  }
}
function applyPlayerCamera(){
  if(!renderer)return;
  const box=canvas.getBoundingClientRect(),state=structuredClone(baseCamera);
  if(box.width<760){
    const ratio=box.width/state.viewport.width;state.scale*=ratio*1.65;state.pan=[-box.width*.12,-box.height*.03];state.viewport={width:box.width,height:box.height};
  }
  renderer.restoreCamera(state);canvas.dataset.camera='player';
}
function syncSettings(){
  const fields={'band-count':'count',gain:'gain',smooth:'smooth','low-phase':'lowPhase','high-phase':'highPhase',response:'response'};
  for(const [id,key] of Object.entries(fields)){
    $(id).value=settings[key];fillRange($(id));$(id+'-value').value=key==='gain'||key==='response'?settings[key].toFixed(2).replace(/0$/,'')+'×':key==='count'?settings[key]:settings[key]+'%';
  }
  mapStroke=createStrokeMapper(settings);canvas.dataset.lowExtension=mapStroke(0).toFixed(5);canvas.dataset.highExtension=mapStroke(1).toFixed(5);
}
for(const [id,key] of Object.entries({'band-count':'count',gain:'gain',smooth:'smooth','low-phase':'lowPhase','high-phase':'highPhase',response:'response'}))$(id).addEventListener('input',event=>{
  settings[key]=Number(event.target.value);syncSettings();persist();
  if(key==='count'){renderer?.setCount(settings.count);rebuildBands();if(!cameraEdited)applyPlayerCamera();}
});
$('reset-mapping').addEventListener('click',()=>{const volume=settings.volume;Object.assign(settings,defaults,{volume});renderer?.setCount(settings.count);syncSettings();rebuildBands();cameraEdited=false;applyPlayerCamera();persist();});
$('play').addEventListener('click',togglePlayback);$('artwork-button').addEventListener('click',togglePlayback);
$('back-ten').addEventListener('click',()=>seekTo(audio.currentTime-10));$('forward-ten').addEventListener('click',()=>seekTo(audio.currentTime+10));
$('seek').addEventListener('input',event=>seekTo(Number(event.target.value)));
$('volume').addEventListener('input',event=>{audio.volume=Number(event.target.value);audio.muted=false;settings.volume=audio.volume;persist();});
$('mute').addEventListener('click',()=>{audio.muted=!audio.muted;});
$('repeat').addEventListener('click',()=>{audio.loop=!audio.loop;$('repeat').setAttribute('aria-pressed',String(audio.loop));});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('此浏览器暂不支持全屏。');}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'全屏播放');});
$('open-settings').addEventListener('click',()=>$('settings-dialog').showModal());$('close-settings').addEventListener('click',()=>$('settings-dialog').close());
$('settings-dialog').addEventListener('click',event=>{if(event.target===$('settings-dialog')){const b=event.target.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)event.target.close();}});
$('edit-title').addEventListener('input',event=>setInfo({title:event.target.value||'未命名音轨'}));$('edit-artist').addEventListener('input',event=>setInfo({artist:event.target.value||'本地音频'}));
$('import-audio').addEventListener('click',()=>$('audio-file').click());$('import-cover').addEventListener('click',()=>$('cover-file').click());
const demoButtons=[];
function syncLibrary(){
  for(const [track,button] of demoButtons){
    if(track.id===activeDemoId)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  }
  $('local-track-status').hidden=activeDemoId!==null;
  $('local-track-status').textContent=activeDemoId===null?'当前播放：本地导入的歌曲（仅本次页面有效）':'';
}
for(const [index,track] of DEMO_TRACKS.entries()){
  const button=document.createElement('button');button.type='button';button.className='demo-track';
  const cover=document.createElement('img');cover.src=track.cover;cover.alt='';cover.width=44;cover.height=44;
  const details=document.createElement('span'),title=document.createElement('strong'),artist=document.createElement('span');
  title.textContent=track.title;artist.textContent=track.artist;details.append(title,artist);button.append(cover,details);
  button.addEventListener('click',()=>{
    if(activeDemoId!==track.id){
      ++trackToken;activeDemoId=track.id;setInfo({title:track.title,artist:track.artist,album:track.album});
      setCover(track.cover);setLyrics(track.lyrics||'');$('track-number').textContent=String(index+1).padStart(2,'0');
      session.replaceTrack(track.audio);syncLibrary();
      lyricsLoader.load(track.lyricsUrl);
    }
    $('library-dialog').close();start();
  });
  $('demo-tracks').append(button);demoButtons.push([track,button]);
}
syncLibrary();
$('open-library').addEventListener('click',()=>$('library-dialog').showModal());
$('close-library').addEventListener('click',()=>$('library-dialog').close());
$('library-import').addEventListener('click',()=>{$('library-dialog').close();$('audio-file').click();});
for(const id of ['import-lyrics','settings-lyrics'])$(id).addEventListener('click',()=>$('lyrics-file').click());
$('clear-lyrics').addEventListener('click',()=>setLyrics(''));
$('audio-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)){toast('请选择音频文件。');return;}
  const token=++trackToken;activeDemoId=null;syncLibrary();$('track-number').textContent='LOCAL';setInfo({...filenameInfo(file.name),album:''});setLyrics('');setCover(new URL('./assets/artwork/local-cover.svg',import.meta.url).href);
  session.replaceFile(file);start();
  try{
    const metadata=await readAudioMetadata(file);if(token!==trackToken)return;
    setInfo({title:metadata.title||info.title,artist:metadata.artist||info.artist,album:metadata.album||''});
    if(metadata.picture)setCover(URL.createObjectURL(new Blob([metadata.picture.data],{type:metadata.picture.mime})),{objectUrl:true});
    if(metadata.lyrics)setLyrics(metadata.lyrics);
  }catch{if(token===trackToken)toast('音频已载入，可在设置中补充歌曲信息。');}
});
$('cover-file').addEventListener('change',event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)){toast('封面支持 JPG、PNG、WebP 或 AVIF。');return;}
  if(file.size>15*1024*1024){toast('请选择小于 15 MB 的封面。');return;}
  setCover(URL.createObjectURL(file),{objectUrl:true});
});
$('lyrics-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  const token=trackToken;
  const revision=++lyricImportRevision;lyricsLoader.cancel();
  try{
    if(file.size>500000)throw Error('歌词文件需小于 500 KB。');
    const bytes=new Uint8Array(await file.arrayBuffer());let value;
    if(bytes[0]===255&&bytes[1]===254)value=new TextDecoder('utf-16le').decode(bytes);
    else if(bytes[0]===254&&bytes[1]===255)value=new TextDecoder('utf-16be').decode(bytes);
    else{try{value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{value=new TextDecoder('gb18030').decode(bytes);}}
    if(token!==trackToken||revision!==lyricImportRevision)return;setLyrics(value);toast(lyricModel.synced?'已载入同步歌词':'已载入文本歌词');
  }catch(error){if(token===trackToken&&revision===lyricImportRevision)toast(error.message||'无法读取歌词文件。');}
});
for(const event of ['play','playing','pause','ended','waiting','canplay'])audio.addEventListener(event,syncPlayback);
for(const event of ['timeupdate','loadedmetadata','durationchange','seeked','emptied'])audio.addEventListener(event,syncTimeline);
audio.addEventListener('volumechange',syncVolume);
audio.addEventListener('error',()=>{toast('无法播放这个音频，请尝试其他文件。');syncPlayback();});
$('cover-art').addEventListener('error',()=>{const fallback=new URL('./assets/artwork/local-cover.svg',import.meta.url).href;if($('cover-art').src!==fallback)setCover(fallback);});
document.addEventListener('keydown',event=>{
  if($('settings-dialog').open||$('library-dialog').open||event.target.closest('input,textarea,button,a,[contenteditable]')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.code==='Space'){event.preventDefault();togglePlayback();}
  else if(event.key==='ArrowLeft'){event.preventDefault();seekTo(audio.currentTime-5);}
  else if(event.key==='ArrowRight'){event.preventDefault();seekTo(audio.currentTime+5);}
});
$('reset-camera').addEventListener('click',()=>{cameraEdited=false;applyPlayerCamera();});
canvas.addEventListener('pointerdown',event=>{if(!renderer||event.button>2)return;event.preventDefault();canvas.focus({preventScroll:true});pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.shiftKey||event.button!==0});canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{
  const before=pointers.get(event.pointerId);if(!before||!renderer)return;
  const next={...before,x:event.clientX,y:event.clientY},other=[...pointers.entries()].find(([id])=>id!==event.pointerId)?.[1];
  if(other){const a=Math.hypot(before.x-other.x,before.y-other.y),b=Math.hypot(next.x-other.x,next.y-other.y);if(a>2&&b>2)renderer.setZoom(renderer.zoom*b/a);renderer.pan((next.x-before.x)/2,(next.y-before.y)/2);}
  else if(before.pan||event.shiftKey)renderer.pan(next.x-before.x,next.y-before.y);else renderer.orbit(next.x-before.x,next.y-before.y);
  pointers.set(event.pointerId,next);cameraEdited=true;canvas.dataset.camera='free';
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,event=>pointers.delete(event.pointerId));
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('wheel',event=>{if(!renderer)return;event.preventDefault();renderer.setZoom(renderer.zoom*Math.exp(-event.deltaY*.001));cameraEdited=true;canvas.dataset.camera='free';},{passive:false});
canvas.addEventListener('dblclick',()=>{cameraEdited=false;applyPlayerCamera();});
if('mediaSession' in navigator){for(const [action,handler] of Object.entries({play:start,pause:()=>audio.pause(),seekbackward:event=>seekTo(audio.currentTime-(event.seekOffset||10)),seekforward:event=>seekTo(audio.currentTime+(event.seekOffset||10)),seekto:event=>seekTo(event.seekTime)})){try{navigator.mediaSession.setActionHandler(action,handler);}catch{}}}

function frame(now){
  const dt=Math.min(.1,Math.max(0,(now-previousTime)/1000||1/60));previousTime=now;
  const active=!audio.paused&&graph?.context.state==='running';let targets=empty,rms=0;
  if(active){graph.analyser.getFloatFrequencyData(bins);graph.analyser.getFloatTimeDomainData(wave);for(const sample of wave)rms+=sample*sample;rms=Math.sqrt(rms/wave.length);targets=measureBands(bins,bands,{gain:settings.gain});}
  energy=smoothLevels(energy,targets,dt,settings.smooth/100);const positions=new Float32Array(settings.count),low=mapStroke(0),high=mapStroke(1);
  for(let i=0;i<settings.count;i++)positions[i]=mapStroke(targets[i],active&&rms>.00003);
  strokes=smoothStrokes(strokes,positions,dt,settings.smooth/100);for(let i=0;i<settings.count;i++)strokes[i]=Math.max(Math.min(low,high),Math.min(Math.max(low,high),strokes[i]));
  renderer?.draw(strokes,energy);
  if(now-lastMeter>90){lastMeter=now;document.documentElement.style.setProperty('--loudness',Math.min(1,rms*5).toFixed(3));}
  requestAnimationFrame(frame);
}
syncSettings();rebuildBands();syncVolume();syncTimeline();setInfo(info);requestAnimationFrame(frame);
lyricsLoader.load(DEMO_TRACKS[0].lyricsUrl);
try{
  renderer=createSceneRenderer(canvas,await loadTextures(),{count:settings.count,forceCpu:new URLSearchParams(location.search).get('renderer')==='cpu'});
  canvas.dataset.renderer=renderer.backend;applyPlayerCamera();syncPlayback();
  new ResizeObserver(()=>{if(!cameraEdited)applyPlayerCamera();}).observe(canvas);
}catch(error){$('scene-status').textContent='画面暂不可用';toast('可视化加载失败，仍可使用音乐播放功能。');}
if(new URLSearchParams(location.search).get('autoplay')!=='0')start();
window.addEventListener('pagehide',event=>{audio.pause();graph?.context.suspend();if(!event.persisted){lyricsLoader.cancel();session.dispose();if(coverObjectUrl)URL.revokeObjectURL(coverObjectUrl);}});
