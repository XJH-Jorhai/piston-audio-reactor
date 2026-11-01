import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLyrics,activeLyricIndex} from '../../player/lyrics.js';

test('LRC handles repeated cues, precise fractions, offset and sorting',()=>{
  const result=parseLyrics('[ti:测试]\n[offset:-400]\n[00:20.125]第三行\n[00:01.5][00:10.50]第一行\n[00:00.20]开场');
  assert.equal(result.synced,true);assert.deepEqual(result.lines,[{time:0,text:'开场'},{time:1.1,text:'第一行'},{time:10.1,text:'第一行'},{time:19.725,text:'第三行'}]);
});
test('active cues are stable before the first line, at boundaries and after the final line',()=>{
  const {lines}=parseLyrics('[00:02]甲\n[00:05]乙\n[00:05]丙');
  assert.equal(activeLyricIndex(lines,0),-1);assert.equal(activeLyricIndex(lines,2),0);assert.equal(activeLyricIndex(lines,4.99),0);assert.equal(activeLyricIndex(lines,5),2);assert.equal(activeLyricIndex(lines,200),2);
});
test('plain text remains text and empty inputs produce no invented lyric lines',()=>{
  assert.deepEqual(parseLyrics(''),{synced:false,lines:[]});
  assert.deepEqual(parseLyrics('[ar:本地作者]\n这是文本\n<img src=x onerror=alert(1)>'),{synced:false,lines:[{time:null,text:'这是文本'},{time:null,text:'<img src=x onerror=alert(1)>'}]});
  assert.throws(()=>parseLyrics('x'.repeat(500001)),RangeError);
});
