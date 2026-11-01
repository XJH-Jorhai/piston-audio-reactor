import test from 'node:test';
import assert from 'node:assert/strict';
import {createCamera,framePoints,dot,VIEW_MODES,orbitAngles} from '../src/camera.js';
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

test('free orbit remains orthonormal and safely framed from all sides and near either pole',()=>{
  for(const yaw of [-Math.PI,-1.2,0,1.2,Math.PI])for(const elevation of [-1.55,-.4,0,.8,1.55])for(const roll of [0,.9]){
    const pivot=[.5,.5,12],camera=createCamera('free',{angles:{yaw,elevation,roll},target:pivot});
    for(const axis of [camera.right,camera.up,camera.forward])assert.ok(Math.abs(dot(axis,axis)-1)<1e-12);
    assert.ok(Math.abs(dot(camera.forward,camera.right))<1e-12);
    assert.ok(Math.abs(dot(camera.forward,camera.up))<1e-12);
    const center=camera.project(pivot);assert.ok(Math.hypot(center[0],center[1])<1e-12);assert.ok(Math.abs(center[2]-48)<1e-12);
    const frame=framePoints(camera,framingCorners(),800,500);assert.ok(frame.scale>0&&Number.isFinite(frame.scale));
    for(const point of framingCorners()){
      const projected=camera.project(point),x=(projected[0]-frame.centerX)*frame.scale+400,y=(projected[1]-frame.centerY)*frame.scale+250;
      assert.ok(x>=0&&x<=800&&y>=0&&y<=500);
    }
  }
});

test('orbit handles long drags and clamps before the vertical singularity',()=>{
  const angles={yaw:0,elevation:0,roll:.3},up=orbitAngles(angles,1e7,1e7),down=orbitAngles(angles,-1e7,-1e7);
  for(const value of [up,down]){assert.ok(value.yaw>=-Math.PI&&value.yaw<Math.PI);assert.ok(Math.abs(value.elevation)<Math.PI/2);}
  assert.ok(up.elevation>0&&down.elevation<0);assert.deepEqual(angles,{yaw:0,elevation:0,roll:.3});
  const turn=orbitAngles(angles,2*Math.PI/.006,0),initial=createCamera('free',{angles}),returned=createCamera('free',{angles:turn});
  for(let i=0;i<3;i++)assert.ok(Math.abs(initial.forward[i]-returned.forward[i])<1e-12);
  assert.throws(()=>orbitAngles(angles,Infinity,0),RangeError);
  assert.throws(()=>createCamera('free',{angles:{yaw:NaN,elevation:0,roll:0}}),RangeError);
});

test('4 to 64 machines remain inside framing and clipping planes at end-on and oblique angles',()=>{
  for(const count of [4,8,16,32,64])for(const [yaw,elevation] of [[0,.8],[Math.PI/2,.1],[-Math.PI/2,-.8],[Math.PI,1.55]]){
    const camera=createCamera('free',{count,angles:{yaw,elevation,roll:.25}}),points=framingCorners(count),frame=framePoints(camera,points,900,500);
    for(const p of points){
      const projected=camera.project(p),x=(projected[0]-frame.centerX)*frame.scale+450,y=(projected[1]-frame.centerY)*frame.scale+250;
      assert.ok(projected[2]>camera.near&&projected[2]<camera.far);
      assert.ok(x>=0&&x<=900&&y>=0&&y<=500);
    }
  }
});
