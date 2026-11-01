import test from 'node:test';
import assert from 'node:assert/strict';
import {createCamera,framePoints,perspectiveWeights,dot,orbitAngles,clipPolygon} from '../src/camera.js';
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

test('4–64 machines remain safely framed after free orbit and across both presets',()=>{
  for(const count of [4,8,16,32,64])for(const mode of ['side','top','free']){
    const orientations=mode==='free'?[-Math.PI,-1.2,0,1.2,Math.PI].flatMap(yaw=>[-1.55,0,1.55].map(elevation=>({yaw,elevation,roll:.3}))):[undefined];
    for(const angles of orientations){
      const camera=createCamera(mode,{count,angles}),points=framingCorners(count),framed=framePoints(camera,points,900,500);
      assert.equal(camera.projection,'perspective');
      for(const axis of [camera.forward,camera.right,camera.up])assert.ok(Math.abs(dot(axis,axis)-1)<1e-12);
      for(const point of points){
        const p=camera.project(point),x=(p[0]-framed.centerX)*framed.scale+450,y=(p[1]-framed.centerY)*framed.scale+250;
        assert.ok(p[2]>camera.near&&p[2]<camera.far);
        assert.ok(x>=0&&x<=900&&y>=0&&y<=500);
      }
    }
  }
});

test('orbit wraps azimuth and clamps elevation before the poles',()=>{
  const a=orbitAngles({yaw:0,elevation:0,roll:0},1e8,1e8);
  assert.ok(a.yaw>=-Math.PI&&a.yaw<Math.PI);assert.ok(a.elevation<Math.PI/2);
  assert.throws(()=>orbitAngles({yaw:NaN,elevation:0,roll:0},0,0));
});

test('CPU polygons crossing clipping planes retain finite positions and interpolated UVs',()=>{
  const camera={eye:[0,0,0],forward:[0,0,1],near:1,far:10};
  const vertices=[{point:[-1,0,.5],uv:[0,0]},{point:[1,0,2],uv:[1,0]},{point:[1,1,12],uv:[1,1]},{point:[-1,1,2],uv:[0,1]}];
  const result=clipPolygon(camera,vertices);
  assert.ok(result.length>=4);
  for(const v of result){assert.ok(v.point[2]>=1&&v.point[2]<=10);assert.ok([...v.point,...v.uv].every(Number.isFinite));assert.ok(v.uv.every(x=>x>=0&&x<=1));}
  assert.equal(clipPolygon(camera,vertices.map(v=>({...v,point:[0,0,.1]}))).length,0);
});
