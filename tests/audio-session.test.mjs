import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioSession} from '../src/audio-session.js';

test('layout consumers share one media source and analyser without touching transport state',()=>{
  let contexts=0,sources=0,connections=0;
  const audio={currentTime:47.25,paused:false,volume:.42,muted:true,playbackRate:1.25,src:'blob:user-track',pause(){throw Error('Unexpected pause');},load(){throw Error('Unexpected reload');}};
  class FakeContext{
    constructor(){contexts++;this.destination={};}
    createAnalyser(){return {connect(){connections++;}};}
    createMediaElementSource(element){assert.equal(element,audio);sources++;return {connect(){connections++;}};}
  }
  const session=createAudioSession(audio,{AudioContextClass:FakeContext});
  assert.equal(session.hasGraph,false);
  const first=session.graph();
  for(let i=0;i<12;i++)assert.equal(session.graph(),first);
  assert.equal(contexts,1);assert.equal(sources,1);assert.equal(connections,2);
  assert.equal(audio.currentTime,47.25);assert.equal(audio.paused,false);assert.equal(audio.src,'blob:user-track');
  assert.equal(audio.volume,.42);assert.equal(audio.muted,true);assert.equal(audio.playbackRate,1.25);
});

test('only an explicit file replacement pauses/reloads media and releases the prior blob',()=>{
  const revoked=[];let created=0,paused=0,loaded=0;
  const audio={src:'default.mp3',pause(){paused++;},load(){loaded++;}};
  const session=createAudioSession(audio,{urls:{createObjectURL(){return 'blob:track-'+(++created);},revokeObjectURL(url){revoked.push(url);}}});
  session.replaceFile({});assert.equal(audio.src,'blob:track-1');assert.deepEqual(revoked,[]);
  session.replaceFile({});assert.equal(audio.src,'blob:track-2');assert.deepEqual(revoked,['blob:track-1']);
  assert.equal(paused,2);assert.equal(loaded,2);assert.equal(session.hasGraph,false);
});
