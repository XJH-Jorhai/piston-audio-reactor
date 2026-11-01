import test from 'node:test';
import assert from 'node:assert/strict';
import {machineParts,COUNT,PITCH} from '../src/machine.js';
import {restFromPhase,strokeFromLoudness,createBands} from '../src/spectrum.js';
test('eight logarithmic bands drive eight stations over the entire audible range',()=>{
  const bands=createBands(48000,4096,COUNT);assert.equal(COUNT,8);assert.equal(bands.length,8);assert.equal(bands[0].low,40);assert.ok(Math.abs(bands.at(-1).high-16000)<1e-8);
});
test('high loudness raises the central body and lowers both arm lanes',()=>{
  const sideRest=restFromPhase(.38),rest=1-sideRest;
  const get=(level,id)=>machineParts(strokeFromLoudness(level,{rest})).find(p=>p.id===id).y;
  assert.ok(get(.85,'body-iron')>get(.2,'body-iron'));assert.ok(get(.85,'left-iron')<get(.2,'left-iron'));assert.ok(get(.85,'right-iron')<get(.2,'right-iron'));
  assert.equal(get(0,'body-iron'),1-sideRest);assert.ok(Math.abs(get(0,'left-iron')-sideRest)<1e-12);
});
test('music never extends any vertical piston rod beyond one block',()=>{
  const rest=1-restFromPhase(.38);
  for(let i=0;i<COUNT;i++)for(let step=0;step<=100;step++){
    const q=strokeFromLoudness(step/100,{rest});
    for(const p of machineParts(q,i*PITCH).filter(p=>p.id.endsWith('-rod')))assert.ok(p.h>0&&p.h<=1);
  }
});
