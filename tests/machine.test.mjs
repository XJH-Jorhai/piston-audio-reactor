import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNT,PITCH,layPoint,machineParts,machineCorners,framingCorners,validateCount,arrayCenter} from '../src/machine.js';
const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,a+' differs from '+b);
const find=(q,id,offset=0)=>machineParts(q,offset).find(part=>part.id===id);
const fixed=parts=>parts.filter(part=>part.id.endsWith('-base')||part.id==='pumpkin');

test('eight stations repeat along world Z without shifting their three X columns',()=>{
  assert.equal(COUNT,8);assert.equal(PITCH,3.5);
  const original=machineParts(.38);
  for(let index=0;index<COUNT;index++){
    const offset=index*PITCH,parts=machineParts(.38,offset);
    assert.equal(parts.filter(part=>part.material==='iron').length,2);
    assert.equal(parts.filter(part=>part.material==='arm').length,2);
    parts.forEach((part,i)=>{
      assert.equal(part.x,original[i].x);assert.equal(part.y,original[i].y);
      almost(part.z-original[i].z,offset);assert.equal(part.station,offset);
      assert.deepEqual(part.source,original[i].source);
    });
    const points=machineCorners(.38,index);
    assert.equal(Math.min(...points.map(p=>p[0])),-1);assert.equal(Math.max(...points.map(p=>p[0])),2);
    almost(Math.min(...points.map(p=>p[2])),offset-3);almost(Math.max(...points.map(p=>p[2])),offset);
  }
});

test('central iron lifts upward while both arm columns descend',()=>{
  for(const q of [0,.1,.5,.9,1]){
    const body=find(q,'body-iron'),lower=find(q,'lower-iron'),left=find(q,'left-iron'),right=find(q,'right-iron');
    assert.equal(body.y,q);assert.equal(lower.y,q);
    assert.equal(left.y,1-q);assert.equal(right.y,1-q);
    assert.equal(body.h,1);assert.equal(left.h,1);
    assert.equal(body.y+left.y,1);assert.equal(left.y,right.y);
    assert.equal(body.x,0);assert.equal(left.x,-1);assert.equal(right.x,1);
  }
  assert.ok(find(.9,'body-iron').y>find(.2,'body-iron').y);
  assert.ok(find(.9,'left-iron').y<find(.2,'left-iron').y);
});

test('piston housings and pumpkin retain identical world and source geometry',()=>{
  for(let index=0;index<COUNT;index++){
    const offset=index*PITCH,reference=fixed(machineParts(0,offset));
    for(const q of [.1,.5,.9,1])assert.deepEqual(fixed(machineParts(q,offset)),reference);
    for(const base of reference.filter(part=>part.id.endsWith('-base'))){assert.equal(base.y,-1);assert.equal(base.h,.75);}
    const head=reference.find(part=>part.id==='pumpkin');
    assert.equal(head.y,0);assert.equal(head.h,1);assert.equal(head.z,offset-3);
  }
});

test('vertical rods fully retract and moving iron touches its piston head',()=>{
  for(const q of [0,.1,.5,.9,1]){
    const parts=machineParts(q);
    for(const name of ['left','body','right']){
      const extension=name==='body'?q:1-q,rod=parts.find(part=>part.id===name+'-rod');
      const head=parts.find(part=>part.id===name+'-head'),iron=parts.find(part=>part.id===name+'-iron');
      almost(head.y+head.h,iron.y);
      if(extension===0)assert.equal(rod,undefined);
      else{assert.equal(rod.h,extension);assert.equal(rod.y,-.25);almost(rod.y+rod.h,head.y);}
    }
  }
});

test('lying transform preserves distances and sends carved-front normal upward',()=>{
  const a=[-1,.4,.75],b=[2,2.3,-.6],aa=layPoint(a,7),bb=layPoint(b,7);
  almost(Math.hypot(...a.map((v,i)=>v-b[i])),Math.hypot(...aa.map((v,i)=>v-bb[i])));
  assert.deepEqual(layPoint([0,0,0]),[0,0,0]);
  assert.deepEqual(layPoint([0,0,1]),[0,1,0]);
  assert.deepEqual(layPoint([0,1,0]),[0,0,-1]);
  const carvedCorners=[[0,3,1],[1,3,1],[0,2,1]].map(p=>layPoint(p));
  assert.ok(carvedCorners.every(p=>p[1]===1),'The original carved +Z face must lie on the world +Y top plane.');
  assert.deepEqual(a,[-1,.4,.75]);assert.deepEqual(b,[2,2.3,-.6]);
});

test('world AABBs exactly contain rotated source corners without source mutation',()=>{
  for(const part of machineParts(.61,2*PITCH)){
    const before=JSON.stringify(part.source),source=part.source;
    const corners=[];
    for(const x of [source.x,source.x+source.w])for(const y of [source.y,source.y+source.h])for(const z of [source.z,source.z+source.d])corners.push(layPoint([x,y,z],part.station));
    for(let axis=0;axis<3;axis++){
      const value=['x','y','z'][axis],size=['w','h','d'][axis];
      almost(Math.min(...corners.map(p=>p[axis])),part[value]);almost(Math.max(...corners.map(p=>p[axis])),part[value]+part[size]);
    }
    assert.equal(JSON.stringify(part.source),before);
  }
});

test('framing endpoints bound all eight machines throughout their travel',()=>{
  const bounds=framingCorners(),mins=[0,1,2].map(axis=>Math.min(...bounds.map(p=>p[axis]))),maxs=[0,1,2].map(axis=>Math.max(...bounds.map(p=>p[axis])));
  for(let index=0;index<COUNT;index++)for(let step=0;step<=20;step++){
    for(const point of machineCorners(step/20,index))point.forEach((value,axis)=>assert.ok(value>=mins[axis]-1e-12&&value<=maxs[axis]+1e-12));
  }
  assert.throws(()=>machineCorners(.5,8),RangeError);assert.throws(()=>machineParts(NaN),TypeError);
});

test('variable channel counts bound exactly the requested stations without changing pitch',()=>{
  for(let count=4;count<=64;count++){
    assert.equal(validateCount(count),count);
    const corners=framingCorners(count),zs=corners.map(p=>p[2]),last=machineCorners(.5,count-1,count);
    assert.equal(Math.min(...zs),-3);almost(Math.max(...zs),(count-1)*PITCH);
    assert.ok(last.every(p=>p[2]>=(count-1)*PITCH-3));
    assert.deepEqual(arrayCenter(count),[.5,.5,((count-1)*PITCH-3)/2]);
    assert.throws(()=>machineCorners(.5,count,count),RangeError);
  }
  for(const value of [0,3,65,8.5,NaN,Infinity,'16'])assert.throws(()=>framingCorners(value),RangeError);
});
