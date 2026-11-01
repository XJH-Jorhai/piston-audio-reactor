import test from 'node:test';
import assert from 'node:assert/strict';
import {machineParts,COUNT,PITCH} from '../src/machine.js';
import {restFromPhase,strokeFromLoudness,createBands} from '../src/spectrum.js';
test('sixteen default bands drive sixteen stations over the entire audible range',()=>{
  const bands=createBands(48000,4096,COUNT);assert.equal(COUNT,16);assert.equal(bands.length,16);assert.equal(bands[0].low,40);assert.ok(Math.abs(bands.at(-1).high-16000)<1e-8);
});

test('adjustable counts repartition the same frequency range into matching machine bands',()=>{
  for(const count of [4,8,16,32,64]){
    const bands=createBands(48000,4096,count);assert.equal(bands.length,count);assert.equal(bands[0].low,40);assert.ok(Math.abs(bands.at(-1).high-16000)<1e-8);
    for(let i=1;i<count;i++){assert.ok(bands[i].low>bands[i-1].low);assert.ok(Math.abs(bands[i].low-bands[i-1].high)<1e-8);}
  }
});
test('high loudness extends the standing body from the 38 pose and retracts both arms',()=>{
  const sideRest=restFromPhase(.38);
  const get=(level,id)=>machineParts(strokeFromLoudness(level)).find(p=>p.id===id).z;
  assert.ok(get(.85,'body-iron')>get(.2,'body-iron'));assert.ok(get(.85,'left-iron')<get(.2,'left-iron'));assert.ok(get(.85,'right-iron')<get(.2,'right-iron'));
  assert.equal(get(0,'body-iron'),1-sideRest);assert.ok(Math.abs(get(0,'left-iron')-sideRest)<1e-12);
  assert.equal(get(1,'body-iron'),1);assert.equal(get(1,'left-iron'),0);assert.equal(get(1,'right-iron'),0);
});
test('music never extends any vertical piston rod beyond one block',()=>{
  for(let i=0;i<64;i++)for(let step=0;step<=100;step++){
    const q=strokeFromLoudness(step/100,{lowPhase:50,highPhase:0});
    for(const p of machineParts(q,i*PITCH).filter(p=>p.id.endsWith('-rod')))assert.ok(p.h>0&&p.h<=1);
  }
});
