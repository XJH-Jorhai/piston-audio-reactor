import {COUNT,PITCH} from './machine.js';
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=value=>{const length=Math.hypot(...value);if(length<1e-9)throw Error('Camera basis is degenerate.');return value.map(v=>v/length);};
export const VIEW_MODES=['side','top'];
/** Rotate the long board towards the portrait diagonal on narrow displays. */
export function layoutYaw(aspect=2.5){
  const mix=Math.min(1,Math.max(0,1.8-aspect));return (12+43*mix)*Math.PI/180;
}
export function createCamera(mode='side',{aspect=2.5}={}){
  if(!VIEW_MODES.includes(mode))throw new RangeError('Unknown camera view.');
  const angle=layoutYaw(aspect),yaw=mode==='top'?0:angle,elevation=52*Math.PI/180;
  const forward=[Math.cos(elevation)*Math.cos(yaw),-Math.sin(elevation),Math.cos(elevation)*Math.sin(yaw)];
  let right=[-Math.sin(yaw),0,Math.cos(yaw)],up=unit(cross(right,forward));
  if(mode==='top'){
    // Face the long edge squarely; camera roll keeps the whole board well framed.
    const originalRight=right,originalUp=up;
    right=originalRight.map((v,i)=>v*Math.cos(angle)-originalUp[i]*Math.sin(angle));
    up=originalRight.map((v,i)=>v*Math.sin(angle)+originalUp[i]*Math.cos(angle));
  }
  const target=[.5,.5,((COUNT-1)*PITCH-3)/2],eye=target.map((value,i)=>value-forward[i]*48);
  return {mode,projection:'orthographic',eye,forward,right,up,near:.2,far:180,
    project(point){const relative=subtract(point,eye);return [dot(relative,right),-dot(relative,up),dot(relative,forward)];}
  };
}
export function framePoints(camera,points,width,height){
  const projected=points.map(p=>camera.project(p));
  if(projected.some(p=>p[2]<=camera.near||p[2]>=camera.far))throw Error('Framing points must remain between camera clipping planes.');
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,scale:Math.min(width*.88/(maxX-minX),height*.80/(maxY-minY)),minX,maxX,minY,maxY};
}
