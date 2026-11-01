import {COUNT,PITCH,arrayCenter,framingCorners,validateCount} from './machine.js';
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=value=>{const length=Math.hypot(...value);if(length<1e-9)throw Error('Camera basis is degenerate.');return value.map(v=>v/length);};
export const VIEW_MODES=['side','top','free'];
export const CORRIDOR_CAMERA={eye:[-6,5.5,10],target:[14,1.2,0],near:.2,far:180};
const turn=2*Math.PI,limit=89*Math.PI/180;
const wrap=angle=>((angle+Math.PI)%turn+turn)%turn-Math.PI;
export function orbitAngles(angles,dx,dy){
  if(![angles.yaw,angles.elevation,angles.roll,dx,dy].every(Number.isFinite))throw new RangeError('Camera angles must be finite.');
  return {yaw:wrap(angles.yaw+dx*.006),elevation:Math.max(-limit,Math.min(limit,angles.elevation+dy*.006)),roll:wrap(angles.roll)};
}
/** Preserve the original close foreground; orbit backs away only to avoid crossing the array. */
export function createCamera(mode='side',{angles,count=COUNT,target,distance}={}){
  validateCount(count);if(!VIEW_MODES.includes(mode))throw new RangeError('Unknown camera view.');
  const original=subtract(CORRIDOR_CAMERA.target,CORRIDOR_CAMERA.eye),originalDistance=Math.hypot(...original);
  const defaults=mode==='top'?{yaw:-Math.PI/2,elevation:65*Math.PI/180,roll:0}:{yaw:Math.atan2(original[2],original[0]),elevation:Math.asin(-original[1]/originalDistance),roll:0};
  const orientation=orbitAngles(angles||defaults,0,0),{yaw,elevation,roll}=orientation;
  target=target|| (mode==='top'?arrayCenter(count):CORRIDOR_CAMERA.target);
  if(!Array.isArray(target)||target.length!==3||!target.every(Number.isFinite))throw new RangeError('Invalid camera target.');
  const forward=[Math.cos(elevation)*Math.cos(yaw),-Math.sin(elevation),Math.cos(elevation)*Math.sin(yaw)];
  let right=[-Math.sin(yaw),0,Math.cos(yaw)],up=unit(cross(right,forward));
  if(roll){const r=right,u=up;right=r.map((v,i)=>v*Math.cos(roll)-u[i]*Math.sin(roll));up=r.map((v,i)=>v*Math.sin(roll)+u[i]*Math.cos(roll));}
  const points=framingCorners(count),depths=points.map(p=>dot(subtract(p,target),forward));
  const requested=distance??(mode==='top'?Math.max(24,count*PITCH*.65):originalDistance);
  if(!Number.isFinite(requested)||requested<=0)throw new RangeError('Invalid camera distance.');
  distance=Math.max(requested,1.5-Math.min(...depths));
  const eye=target.map((v,i)=>v-forward[i]*distance),near=.2,far=Math.max(180,distance+Math.max(...depths)+20);
  return {mode,angles:orientation,target:[...target],distance,projection:'perspective',eye,forward,right,up,near,far,
    project(point){const relative=subtract(point,eye),z=dot(relative,forward);return [dot(relative,right)/z,-dot(relative,up)/z,z];}
  };
}
export function framePoints(camera,points,width,height){
  const projected=points.map(p=>camera.project(p));
  if(projected.some(p=>p[2]<=camera.near||p[2]>=camera.far))throw Error('Framing points must remain between camera clipping planes.');
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,scale:Math.min(width*.86/(maxX-minX),height*.80/(maxY-minY)),minX,maxX,minY,maxY};
}
export function perspectiveWeights(weights,depths){
  const divided=weights.map((v,i)=>v/depths[i]),reciprocal=divided.reduce((a,b)=>a+b,0);
  return {weights:divided.map(v=>v/reciprocal),depth:1/reciprocal};
}
/** Clip world-space polygons before perspective division, interpolating texture coordinates. */
export function clipPolygon(camera,vertices){
  let polygon=vertices.map(v=>({...v,depth:dot(subtract(v.point,camera.eye),camera.forward)}));
  for(const [plane,sign] of [[camera.near,1],[camera.far,-1]]){
    const output=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=sign*(a.depth-plane)>=0,insideB=sign*(b.depth-plane)>=0;
      if(insideA)output.push(a);
      if(insideA!==insideB){const t=(plane-a.depth)/(b.depth-a.depth);output.push({point:a.point.map((v,k)=>v+(b.point[k]-v)*t),uv:a.uv.map((v,k)=>v+(b.uv[k]-v)*t),depth:plane});}
    }
    polygon=output;
  }
  return polygon;
}
export function fogAmount(depth){const x=Math.min(1,Math.max(0,(depth-18)/80));return x*x*(3-2*x)*.54;}
