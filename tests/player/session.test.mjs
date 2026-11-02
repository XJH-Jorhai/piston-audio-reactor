import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createAudioSession} from '../../player/session.js';
import {DEMO_TRACKS} from '../../player/tracks.js';
import {parseID3} from '../../player/media.js';
import {parseLyrics} from '../../player/lyrics.js';

test('switching local files and demo sources releases old Blob URLs without rebuilding the audio graph',()=>{
  const revoked=[],files=[],events=[];
  const audio={pause(){events.push('pause');},load(){events.push('load');}};
  let contexts=0,sources=0;
  class Context{
    constructor(){contexts++;this.destination={};}
    createAnalyser(){return {connect(){}};}
    createMediaElementSource(element){assert.equal(element,audio);sources++;return {connect(){}};}
  }
  const session=createAudioSession(audio,{AudioContextClass:Context,urls:{
    createObjectURL(file){files.push(file);return 'blob:local-'+files.length;},
    revokeObjectURL(url){revoked.push(url);}
  }});
  const graph=session.graph();session.replaceFile({name:'private-a.mp3'});
  assert.equal(audio.src,'blob:local-1');assert.deepEqual(revoked,[]);
  session.replaceFile({name:'private-b.mp3'});assert.deepEqual(revoked,['blob:local-1']);
  session.replaceTrack(DEMO_TRACKS[0].audio);
  assert.equal(audio.src,DEMO_TRACKS[0].audio);assert.deepEqual(revoked,['blob:local-1','blob:local-2']);
  assert.equal(session.graph(),graph);assert.equal(contexts,1);assert.equal(sources,1);
  session.dispose();assert.equal(revoked.length,2);
  assert.deepEqual(events,['pause','load','pause','load','pause','load','pause']);
});

test('disposing a local track releases its object URL once',()=>{
  const revoked=[],session=createAudioSession({pause(){},load(){}},{urls:{createObjectURL(){return 'blob:private';},revokeObjectURL(url){revoked.push(url);}}});
  session.replaceFile({});session.dispose();session.dispose();assert.deepEqual(revoked,['blob:private']);
});

test('all published demo tracks have unique ids and existing assets within the bundled asset directory',async()=>{
  const ids=new Set(),assets=new URL('../../player/assets/',import.meta.url);
  assert.ok(DEMO_TRACKS.length>0);
  for(const track of DEMO_TRACKS){
    assert.ok(track.id&&!ids.has(track.id));ids.add(track.id);
    assert.ok(track.title&&track.artist);
    for(const source of [track.audio,track.cover]){
      assert.ok(source.startsWith(assets.href));assert.ok((await fs.stat(new URL(source))).size>0);
    }
    const metadata=parseID3(await fs.readFile(new URL(track.audio)));
    assert.equal(track.title,metadata.title);assert.equal(track.album,metadata.album);
    assert.equal(track.artist.replace(/\s*\/\s*/g,'/'),metadata.artist.replace(/\s*\/\s*/g,'/'));
    assert.deepEqual(await fs.readFile(new URL(track.cover)),Buffer.from(metadata.picture.data));
    assert.ok(track.lyricsUrl.startsWith(assets.href));
    const lyrics=parseLyrics(await fs.readFile(new URL(track.lyricsUrl),'utf8'));
    assert.equal(lyrics.synced,true);assert.ok(lyrics.lines.length>0);
  }
});
