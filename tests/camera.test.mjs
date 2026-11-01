import test from 'node:test';
import assert from 'node:assert/strict';
import {createCamera,framePoints,dot,VIEW_MODES} from '../src/camera.js';
import {framingCorners,machineCorners,COUNT,PITCH} from '../src/machine.js';
test('both oblique orthographic cameras have safe orthonormal bases',()=>{
  for(const mode of VIEW_MODES)for(const aspect of [.5,1,2.5]){
    const camera=createCamera(mode,{aspect});
    assert.equal(camera.projection,'orthographic');
    for(const axis of [camera.forward,camera.right,camera.up])assert.ok(Math.abs(dot(axis,axis)-1)<1e-12);
    assert.ok(Math.abs(dot(camera.forward,camera.up))<1e-12);assert.ok(Math.abs(dot(camera.right,camera.up))<1e-12);
    for(const point of framingCorners()){const depth=camera.project(point)[2];assert.ok(depth>camera.near&&depth<camera.far);}
  }
});
test('all eight machines stay framed across both views and full strokes',()=>{
  for(const mode of VIEW_MODES)for(const [width,height] of [[1280,500],[478,620],[320,500]]){
    const camera=createCamera(mode,{aspect:width/height}),frame=framePoints(camera,framingCorners(),width,height);
    for(let i=0;i<COUNT;i++)for(const q of [0,.25,.5,.75,1])for(const point of machineCorners(q,i)){
      const p=camera.project(point),x=(p[0]-frame.centerX)*frame.scale+width/2,y=(p[1]-frame.centerY)*frame.scale+height/2;
      assert.ok(x>=0&&x<=width&&y>=0&&y<=height);
    }
  }
});
test('side view makes upward travel visible without perspective size changes',()=>{
  const camera=createCamera('side'),a=camera.project([.5,.5,0]),b=camera.project([.5,1.5,0]);
  assert.ok(b[1]<a[1]);assert.equal(b[0],a[0]);
  const nearA=camera.project([0,0,0]),nearB=camera.project([1,0,0]),farA=camera.project([0,0,7*PITCH]),farB=camera.project([1,0,7*PITCH]);
  assert.ok(Math.abs((nearB[0]-nearA[0])-(farB[0]-farA[0]))<1e-12);
  assert.ok(Math.abs((nearB[1]-nearA[1])-(farB[1]-farA[1]))<1e-12);
});
test('front-oblique view looks squarely across the array, while retaining visible lift',()=>{
  const camera=createCamera('top'),a=camera.project([.5,0,0]),b=camera.project([.5,2,0]);
  assert.equal(camera.forward[2],0);
  assert.ok(camera.forward[0]>0&&camera.forward[1]<0);
  assert.ok(Math.hypot(b[0]-a[0],b[1]-a[1])>1);
  const far=camera.project([.5,0,7*PITCH]);assert.equal(a[2],far[2]);
  assert.throws(()=>createCamera('unknown'),RangeError);
});
