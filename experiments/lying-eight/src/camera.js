import {COUNT,PITCH,arrayCenter,validateCount} from './machine.js';
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=value=>{const length=Math.hypot(...value);if(length<1e-9)throw Error('Camera basis is degenerate.');return value.map(v=>v/length);};
export const VIEW_MODES=['side','top','free'];
const turn=2*Math.PI,limit=89*Math.PI/180;
const wrap=angle=>((angle+Math.PI)%turn+turn)%turn-Math.PI;
export function orbitAngles(angles,dx,dy){
  if(![angles.yaw,angles.elevation,angles.roll,dx,dy].every(Number.isFinite))throw new RangeError('Camera angles must be finite.');
  return {yaw:wrap(angles.yaw+dx*.006),elevation:Math.max(-limit,Math.min(limit,angles.elevation+dy*.006)),roll:wrap(angles.roll)};
}
/** Rotate the long board towards the portrait diagonal on narrow displays. */
export function layoutYaw(aspect=2.5){
  const mix=Math.min(1,Math.max(0,1.8-aspect));return (12+43*mix)*Math.PI/180;
}
export function createCamera(mode='side',{aspect=2.5,angles,count=COUNT,target=arrayCenter(count)}={}){
  validateCount(count);
  if(!VIEW_MODES.includes(mode))throw new RangeError('Unknown camera view.');
  const angle=layoutYaw(aspect),orientation=orbitAngles(angles||{yaw:mode==='top'?0:angle,elevation:52*Math.PI/180,roll:mode==='top'?angle:0},0,0);
  const {yaw,elevation,roll}=orientation;
  const forward=[Math.cos(elevation)*Math.cos(yaw),-Math.sin(elevation),Math.cos(elevation)*Math.sin(yaw)];
  let right=[-Math.sin(yaw),0,Math.cos(yaw)],up=unit(cross(right,forward));
  if(roll){
    // Face the long edge squarely; camera roll keeps the whole board well framed.
    const originalRight=right,originalUp=up;
    right=originalRight.map((v,i)=>v*Math.cos(roll)-originalUp[i]*Math.sin(roll));
    up=originalRight.map((v,i)=>v*Math.sin(roll)+originalUp[i]*Math.cos(roll));
  }
  const distance=Math.max(48,count*PITCH*.7+8),eye=target.map((value,i)=>value-forward[i]*distance);
  return {mode,angles:orientation,target:[...target],projection:'orthographic',eye,forward,right,up,near:.2,far:Math.max(180,distance+count*PITCH+10),
    project(point){const relative=subtract(point,eye);return [dot(relative,right),-dot(relative,up),dot(relative,forward)];}
  };
}
export function framePoints(camera,points,width,height){
  const projected=points.map(p=>camera.project(p));
  if(projected.some(p=>p[2]<=camera.near||p[2]>=camera.far))throw Error('Framing points must remain between camera clipping planes.');
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,scale:Math.min(width*.88/(maxX-minX),height*.80/(maxY-minY)),minX,maxX,minY,maxY};
}
