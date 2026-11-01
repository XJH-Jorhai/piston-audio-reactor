import test from 'node:test';
import assert from 'node:assert/strict';
import {createBands,measureBands,smoothLevels,restFromPhase,strokeFromLoudness,smoothStrokes,createStrokeMapper,normalizeMapping,DEFAULT_MAPPING} from '../src/spectrum.js';

test('sixteen logarithmic bands cover the requested range and valid FFT bins',()=>{
  const bands=createBands(48000,4096);
  assert.equal(bands.length,16);
  assert.equal(bands[0].low,40);
  assert.ok(Math.abs(bands.at(-1).high-16000)<1e-8);
  for(let i=0;i<bands.length;i++){
    const band=bands[i];
    assert.ok(band.low<band.high);
    assert.ok(Number.isInteger(band.start)&&Number.isInteger(band.end));
    assert.ok(band.start>=0&&band.end<=2048&&band.end>band.start);
    if(i)assert.ok(Math.abs(bands[i-1].high-band.low)<1e-8);
  }
  assert.equal(createBands(22050,4096).at(-1).high,11025);
  assert.throws(()=>createBands(48000,3000),RangeError);
});

test('silence is zero and power averaging separates low and high FFT tones',()=>{
  const bands=createBands(48000,4096),db=new Float32Array(2048).fill(-Infinity);
  assert.deepEqual([...measureBands(db,bands)],Array(16).fill(0));
  const low=2,high=13,peak=-12;
  db[Math.floor((bands[low].start+bands[low].end)/2)]=peak;
  let levels=measureBands(db,bands);
  assert.ok(levels[low]>.3);
  assert.equal(levels[high],0);
  db.fill(-Infinity);
  db[Math.floor((bands[high].start+bands[high].end)/2)]=peak;
  levels=measureBands(db,bands);
  assert.ok(levels[high]>.2);
  assert.equal(levels[low],0);
  db.fill(-22);
  assert.ok([...measureBands(db,bands)].every(value=>value===1));
});

test('gain remains bounded and invalid/silent samples do not create NaN',()=>{
  const bands=createBands(48000,4096),db=new Float32Array(2048).fill(NaN);
  assert.ok([...measureBands(db,bands)].every(value=>value===0));
  db.fill(0);
  assert.ok([...measureBands(db,bands,{gain:10})].every(value=>value===1));
  assert.ok([...measureBands(db,bands,{gain:0})].every(value=>value===0));
});

test('attack is quicker than release and smoothing does not depend on fps',()=>{
  const rise=smoothLevels([0],[1],.05)[0],fall=smoothLevels([1],[0],.05)[0];
  assert.ok(rise>1-fall);
  const after=(fps,from,to)=>{
    let previous=new Float32Array([from]);
    for(let frame=0;frame<fps;frame++)previous=smoothLevels(previous,[to],1/fps);
    return previous[0];
  };
  assert.ok(Math.abs(after(30,0,1)-after(120,0,1))<1e-6);
  assert.ok(Math.abs(after(30,1,0)-after(120,1,0))<1e-6);
  assert.equal(smoothLevels([.4],[1],0)[0],new Float32Array([.4])[0]);
});

test('the 38% reference samples the actual asymmetric generator curve',()=>{
  const rest=restFromPhase(.38);
  assert.ok(rest>.5&&rest<1);
  assert.equal(restFromPhase(0),0);
  assert.equal(restFromPhase(1),0);
  assert.equal(restFromPhase(.1),0);
  assert.ok(Math.abs(restFromPhase(.6)-1)<1e-10);
  assert.ok(Math.abs(restFromPhase(.5)-1)<1e-10);
  assert.equal(restFromPhase(),rest);
});

test('default loudness mapping starts at generator 32 and reaches full body extension at 0',()=>{
  const low=1-restFromPhase(.32),high=1;
  assert.deepEqual(DEFAULT_MAPPING,{lowPhase:32,highPhase:0,response:1});
  assert.equal(strokeFromLoudness(0),low);assert.equal(strokeFromLoudness(1),high);
  assert.equal(strokeFromLoudness(.5),(low+high)/2);
  assert.equal(strokeFromLoudness(1,{active:false}),low);
  assert.ok(strokeFromLoudness(.001)>low);
  assert.ok(strokeFromLoudness(.8)>strokeFromLoudness(.5));
  assert.ok(strokeFromLoudness(.8)<1,'Generator timing plateaus must not saturate the audio mapping early.');
  const source=strokeFromLoudness.toString();
  assert.ok(!/\b(?:time|index|period|sin|cos|Date|performance)\b/.test(source));
});

test('mapping stays between editable endpoint poses, including reversal and constant poses',()=>{
  for(const lowPhase of [0,32,50])for(const highPhase of [0,32,50])for(const response of [.25,1,4]){
    const map=createStrokeMapper({lowPhase,highPhase,response}),a=map(0),b=map(1);let previous=a;
    for(let index=-10;index<=110;index++){
      const value=map(index/100);assert.ok(value>=Math.min(a,b)-1e-12&&value<=Math.max(a,b)+1e-12);
      assert.ok((b-a)*(value-previous)>=-1e-12);previous=value;
    }
    assert.equal(map(1,false),a);
  }
  assert.equal(strokeFromLoudness(0,{lowPhase:0,highPhase:50}),1);
  assert.equal(strokeFromLoudness(1,{lowPhase:0,highPhase:50}),0);
});

test('response curvature changes intermediate positions while keeping both endpoints exact',()=>{
  assert.ok(strokeFromLoudness(.2,{response:.25})>strokeFromLoudness(.2));
  assert.ok(strokeFromLoudness(.2,{response:4})<strokeFromLoudness(.2));
  for(const response of [.25,1,4]){assert.equal(strokeFromLoudness(0,{response}),strokeFromLoudness(0));assert.equal(strokeFromLoudness(1,{response}),1);}
  assert.deepEqual(normalizeMapping({lowPhase:Infinity,highPhase:NaN,response:NaN}),DEFAULT_MAPPING);
  assert.deepEqual(normalizeMapping({lowPhase:-1,highPhase:500,response:99}),{lowPhase:0,highPhase:50,response:4});
  for(const level of [NaN,Infinity,-Infinity])assert.equal(strokeFromLoudness(level),strokeFromLoudness(0));
});

test('position smoothing is symmetric and frame-rate invariant, with a stationary target',()=>{
  const rise=smoothStrokes([0],[1],.04)[0],fall=smoothStrokes([1],[0],.04)[0];
  assert.ok(Math.abs(rise-(1-fall))<1e-7);
  const settled=(fps,initial,target)=>{
    let position=new Float32Array([initial]);
    for(let frame=0;frame<fps;frame++)position=smoothStrokes(position,[target],1/fps);
    return position[0];
  };
  assert.ok(Math.abs(settled(30,.1,.8)-settled(120,.1,.8))<1e-6);
  assert.ok(Math.abs(settled(30,.8,.1)-settled(120,.8,.1))<1e-6);
  const rest=restFromPhase(.38),stationary=new Float32Array([rest]);
  assert.equal(smoothStrokes(stationary,stationary,100)[0],stationary[0]);
  assert.equal(smoothStrokes([.4],[1],0)[0],new Float32Array([.4])[0]);
});
