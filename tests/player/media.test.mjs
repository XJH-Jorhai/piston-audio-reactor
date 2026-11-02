import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseID3,readAudioMetadata,formatTime,filenameInfo} from '../../player/media.js';

test('the provided track supplies real title, artist, album and its embedded cover',async()=>{
  const bytes=await fs.readFile(new URL('../../player/assets/audio/sam-gellaitry-assumptions.mp3',import.meta.url));
  const metadata=parseID3(bytes);
  assert.equal(metadata.title,'Assumptions');assert.equal(metadata.artist,'Sam Gellaitry');assert.equal(metadata.album,'IV');
  const cover=await fs.readFile(new URL('../../player/assets/artwork/assumptions.jpg',import.meta.url));
  assert.equal(metadata.picture.mime,'image/jpeg');assert.deepEqual(Buffer.from(metadata.picture.data),cover);
  assert.equal(metadata.lyrics,undefined);
  const fromFile=await readAudioMetadata(new Blob([bytes]));assert.equal(fromFile.title,metadata.title);assert.equal(fromFile.picture.data.length,cover.length);
});

test('malformed or oversized tags fail safely without reading beyond available bytes',()=>{
  for(const bytes of [new Uint8Array(),new Uint8Array([73,68,51]),new Uint8Array(200)])assert.deepEqual(parseID3(bytes),{});
  const bad=new Uint8Array(20);bad.set([73,68,51,3,0,0,127,127,127,127]);assert.deepEqual(parseID3(bad),{});
});

test('local filenames and invalid timeline values produce usable display values',()=>{
  assert.deepEqual(filenameInfo('Sam Gellaitry - Assumptions.mp3'),{title:'Assumptions',artist:'Sam Gellaitry'});
  assert.deepEqual(filenameInfo('My recording.wav'),{title:'My recording',artist:'本地音频'});
  assert.equal(formatTime(NaN),'00:00');assert.equal(formatTime(-10),'00:00');assert.equal(formatTime(220.9),'03:40');assert.equal(formatTime(3661),'1:01:01');
});
