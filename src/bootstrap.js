import {LAYOUT as ENTRY_LAYOUT} from './layout.js';
import {createAudioSession} from './audio-session.js';
import {ROUTES,CONTINUITY_BUILD,siteRoot,routeMode,routeUrl} from './routes.js';

const root=siteRoot(import.meta.url),audio=document.getElementById('audio');
// Resolve once, before History API navigation changes the document base URL.
audio.src=audio.currentSrc||audio.src;
const session=createAudioSession(audio),states=new Map(),modules=new Map();
const nav=document.querySelector('.site-header nav'),links=new Map();
nav.replaceChildren();
for(const [mode,label] of [['linear','线性版'],['lying','横卧版'],['corridor','长廊版']]){
  const link=document.createElement('a');link.dataset.reactorLayout=mode;link.textContent=label;
  link.href=routeUrl(mode,root).href;nav.append(link);links.set(mode,link);
}
const source=document.createElement('a');source.textContent='源码 ↗';source.href='https://github.com/XJH-Jorhai/piston-audio-reactor';source.target='_blank';source.rel='noopener';nav.append(source);
let active,mode,pending,busy=false;
function syncNavigation(){
  const count=active?.snapshot().count;
  for(const [name,link] of links){
    link.href=routeUrl(name,root,{count,renderer:new URL(location.href).searchParams.get('renderer')}).href;
    if(name===mode)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
}
function loadMode(name){
  if(!modules.has(name))modules.set(name,(async()=>{
    const url=name===ENTRY_LAYOUT?new URL('./app.js',import.meta.url):new URL('src/app.js',new URL(ROUTES[name],root));url.searchParams.set('v',CONTINUITY_BUILD);
    const module=await import(url.href),textures=await module.preload();return {module,textures};
  })().catch(error=>{modules.delete(name);throw error;}));
  return modules.get(name);
}
async function navigate(url,historyMode='push',autostart=false){
  pending={url:new URL(url),historyMode,autostart};
  if(busy)return;busy=true;nav.setAttribute('aria-busy','true');
  try{
    while(pending){
      const next=pending;pending=null;const name=next.historyMode==='initial'?ENTRY_LAYOUT:routeMode(next.url,root);
      if(!name||name===mode)continue;
      const loaded=await loadMode(name);
      if(active){states.set(mode,active.snapshot());active.dispose();}
      if(next.historyMode==='push')history.pushState(null,'',next.url);
      active=await loaded.module.mountReactor({session,textures:loaded.textures,resumeState:states.get(name),autostart:next.autostart});
      mode=name;document.body.dataset.layout=mode;syncNavigation();
    }
  }catch(error){
    const message=document.getElementById('message');message.textContent='版本切换失败：'+error.message;message.hidden=false;
  }finally{busy=false;nav.setAttribute('aria-busy','false');}
}
nav.addEventListener('click',event=>{
  const link=event.target.closest('a[data-reactor-layout]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  navigate(routeUrl(link.dataset.reactorLayout,root,{count:active?.snapshot().count,renderer:new URL(location.href).searchParams.get('renderer')}));
});
document.addEventListener('reactor:countchange',syncNavigation);
window.addEventListener('popstate',()=>navigate(location.href,'pop'));
await navigate(location.href,'initial',true);
