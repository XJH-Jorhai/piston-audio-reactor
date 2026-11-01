import test from 'node:test';
import assert from 'node:assert/strict';
import {COUNT,PITCH,machineParts,machineCorners,framingCorners,validateCount,placePoint,arrayCenter} from '../src/machine.js';
const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-10);

test('standing machines form a horizontal X array at the original pitch for 4 to 64 channels',()=>{
  assert.equal(COUNT,16);assert.equal(PITCH,3.9);
  for(const count of [4,8,16,32,64]){
    const points=framingCorners(count);almost(Math.min(...points.map(p=>p[0])),-1);almost(Math.max(...points.map(p=>p[0])),(count-1)*PITCH+2);
    assert.equal(Math.min(...points.map(p=>p[1])),0);assert.equal(Math.max(...points.map(p=>p[1])),3);
    assert.equal(Math.min(...points.map(p=>p[2])),-1);assert.equal(Math.max(...points.map(p=>p[2])),2);
    assert.deepEqual(arrayCenter(count),[(count-1)*PITCH/2+.5,1.5,.5]);
  }
});

test('standing central body travels forward while arm blocks travel in opposition',()=>{
  for(const q of [0,.1,.5,.9,1]){
    const parts=machineParts(q),find=id=>parts.find(p=>p.id===id);
    assert.equal(find('body-iron').z,q);assert.equal(find('lower-iron').z,q);
    assert.equal(find('left-iron').z,1-q);assert.equal(find('right-iron').z,1-q);
    assert.equal(find('body-iron').y,1);assert.equal(find('lower-iron').y,0);
  }
});

test('standing piston housings and pumpkin stay fixed, rods fully retract and touch their heads',()=>{
  const fixed=parts=>parts.filter(p=>p.id.endsWith('-base')||p.id==='pumpkin');
  const reference=fixed(machineParts(0));
  for(const q of [0,.2,.5,1]){
    const parts=machineParts(q);assert.deepEqual(fixed(parts),reference);
    for(const name of ['left','body','right']){
      const e=name==='body'?q:1-q,rod=parts.find(p=>p.id===name+'-rod'),head=parts.find(p=>p.id===name+'-head'),iron=parts.find(p=>p.id===name+'-iron');
      almost(head.z+head.d,iron.z);if(e===0)assert.equal(rod,undefined);else{assert.equal(rod.d,e);almost(rod.z+rod.d,head.z);}
    }
  }
});

test('standing source textures retain their original face placement and dimensions',()=>{
  assert.deepEqual(placePoint([1,2,3],10),[11,2,3]);
  for(const part of machineParts(.4,3*PITCH)){
    almost(part.x,part.source.x+3*PITCH);assert.equal(part.y,part.source.y);assert.equal(part.z,part.source.z);
    assert.equal(part.w,part.source.w);assert.equal(part.h,part.source.h);assert.equal(part.d,part.source.d);
  }
});

test('standing endpoint framing bounds all moving boxes and rejects invalid counts',()=>{
  for(const count of [4,16,64]){
    const points=framingCorners(count),mins=[0,1,2].map(a=>Math.min(...points.map(p=>p[a]))),maxs=[0,1,2].map(a=>Math.max(...points.map(p=>p[a])));
    for(let index=0;index<count;index++)for(const q of [0,.25,.75,1])for(const p of machineCorners(q,index,count))p.forEach((v,a)=>assert.ok(v>=mins[a]-1e-10&&v<=maxs[a]+1e-10));
  }
  for(const value of [3,65,4.5,NaN])assert.throws(()=>validateCount(value),RangeError);
  assert.throws(()=>machineParts(NaN),TypeError);
});
