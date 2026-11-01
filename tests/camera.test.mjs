import test from 'node:test';
import assert from 'node:assert/strict';
import {createCamera,framePoints,perspectiveWeights,dot} from '../src/camera.js';
import {framingCorners,machineCorners,COUNT} from '../src/scene.js';
test('perspective camera has an orthonormal basis and safe clipping',()=>{
  const camera=createCamera();
  for(const axis of [camera.forward,camera.right,camera.up])assert.ok(Math.abs(dot(axis,axis)-1)<1e-12);
  assert.ok(Math.abs(dot(camera.forward,camera.up))<1e-12);
  assert.ok(Math.abs(dot(camera.right,camera.up))<1e-12);
  for(const point of framingCorners()){const depth=camera.project(point)[2];assert.ok(depth>camera.near&&depth<camera.far);}
});
test('all sixteen machines stay framed across the complete stroke and viewport sizes',()=>{
  const camera=createCamera();
  for(const [width,height] of [[1280,480],[478,400],[320,400]]){
    const framed=framePoints(camera,framingCorners(),width,height);
    for(let i=0;i<COUNT;i++)for(const q of [0,.25,.5,.75,1])for(const point of machineCorners(q,i)){
      const p=camera.project(point),x=(p[0]-framed.centerX)*framed.scale+width/2,y=(p[1]-framed.centerY)*framed.scale+height/2;
      assert.ok(x>=0&&x<=width&&y>=0&&y<=height,'A machine escaped the overview frustum.');
    }
  }
});
test('foreground receives substantially more screen area than the far end',()=>{
  const camera=createCamera(),framed=framePoints(camera,framingCorners(),1280,480);
  const height=index=>{const ys=machineCorners(.5,index).map(p=>camera.project(p)[1]);return (Math.max(...ys)-Math.min(...ys))*framed.scale;};
  assert.ok(height(0)>480*.4);assert.ok(height(0)/height(15)>5);assert.ok(height(15)>25);
});
test('CPU texture attributes use reciprocal depth, not affine interpolation',()=>{
  const result=perspectiveWeights([1/3,1/3,1/3],[2,4,8]);
  assert.ok(Math.abs(result.weights[0]-4/7)<1e-12);assert.ok(Math.abs(result.weights[1]-2/7)<1e-12);assert.ok(Math.abs(result.depth-24/7)<1e-12);
  const flat=perspectiveWeights([.2,.3,.5],[5,5,5]);
  flat.weights.forEach((v,i)=>assert.ok(Math.abs(v-[.2,.3,.5][i])<1e-12));
});
