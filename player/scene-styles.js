export const SCENE_STYLES=Object.freeze({corridor:'长廊',linear:'线性',lying:'横卧'});
export const normalizeSceneStyle=value=>Object.hasOwn(SCENE_STYLES,value)?value:'corridor';
const cached=new Map();let textures;
const engines={corridor:()=>import('./engine/scene.js'),linear:()=>import('./engine/linear/scene.js'),lying:()=>import('./engine/lying/scene.js')};
const cameras={
  corridor:async()=>{const {RECORDED_VIEWS}=await import('./engine/recorded-views.js');return ()=>structuredClone(RECORDED_VIEWS[0].camera);},
  linear:async()=>{const {CAMERA_SHORTCUTS,shortcutCamera}=await import('./engine/linear/camera-shortcuts.js');return count=>shortcutCamera(CAMERA_SHORTCUTS[0],count);},
  lying:async()=>{const {CAMERA_SHORTCUTS,shortcutCamera}=await import('./engine/lying/camera-shortcuts.js');return count=>{
    const records=CAMERA_SHORTCUTS.slice(0,4),nearest=records.reduce((a,b)=>Math.abs(b.count-count)<Math.abs(a.count-count)?b:a);
    return shortcutCamera(nearest,count);
  };}
};

export function loadSceneStyle(value){
  const id=normalizeSceneStyle(value);
  if(!cached.has(id))cached.set(id,(async()=>{
    if(!textures)textures=import('./engine/scene.js').then(module=>module.loadTextures()).catch(error=>{textures=null;throw error;});
    const [engine,camera,images]=await Promise.all([engines[id](),cameras[id](),textures]);
    return {id,label:SCENE_STYLES[id],createRenderer:engine.createSceneRenderer,camera,images};
  })().catch(error=>{cached.delete(id);throw error;}));
  return cached.get(id);
}

/** Preserve the original corridor; compose orthographic scenes in the space beside the cover. */
export function composePlayerCamera(style,original,width,height){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new RangeError('Invalid player viewport.');
  const state=structuredClone(original);
  if(style==='corridor'){
    if(width<760){const ratio=width/state.viewport.width;state.scale*=ratio*1.65;state.pan=[-width*.12,-height*.03];state.viewport={width,height};}
    return state;
  }
  const available=width<=800?width:width*.68,ratio=Math.min(available/state.viewport.width,height/state.viewport.height);
  state.scale*=ratio;state.pan=[state.pan[0]*ratio+(available-width)/2,state.pan[1]*ratio];state.viewport={width,height};
  return state;
}
