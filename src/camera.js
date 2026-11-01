const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
export const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=value=>{const length=Math.hypot(...value);if(length<1e-9)throw Error('Camera basis is degenerate.');return value.map(v=>v/length);};
export const CORRIDOR_CAMERA={eye:[-6,5.5,10],target:[14,1.2,0],near:.2,far:180};
export function createCamera({eye=CORRIDOR_CAMERA.eye,target=CORRIDOR_CAMERA.target,near=.2,far=180}={}){
  const forward=unit(subtract(target,eye)),right=unit(cross(forward,[0,1,0])),up=unit(cross(right,forward));
  return {eye:[...eye],forward,right,up,near,far,
    project(point){const relative=subtract(point,eye),z=dot(relative,forward);return [dot(relative,right)/z,-dot(relative,up)/z,z];}
  };
}
export function framePoints(camera,points,width,height){
  const projected=points.map(p=>camera.project(p));
  if(projected.some(p=>p[2]<=camera.near||p[2]>=camera.far))throw Error('Framing points must remain between camera clipping planes.');
  const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,scale:Math.min(width*.86/(maxX-minX),height*.80/(maxY-minY)),minX,maxX,minY,maxY};
}
/** Perspective-correct attributes for CPU rasterization; weights are screen barycentrics. */
export function perspectiveWeights(weights,depths){
  const divided=weights.map((v,i)=>v/depths[i]),reciprocal=divided.reduce((a,b)=>a+b,0);
  return {weights:divided.map(v=>v/reciprocal),depth:1/reciprocal};
}
export function fogAmount(depth){
  const x=Math.min(1,Math.max(0,(depth-18)/80));return x*x*(3-2*x)*.54;
}
