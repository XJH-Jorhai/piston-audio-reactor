import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_SHORTCUTS,shortcutCamera} from '../src/camera-shortcuts.js';
import {RECORDED_VIEWS} from '../src/recorded-views.js';
import {IS_LYING} from '../src/layout.js';
import {arrayCenter} from '../src/machine.js';

test('six supplied views are available only for the layout they were recorded in',()=>{
  assert.equal(RECORDED_VIEWS.length,6);assert.equal(CAMERA_SHORTCUTS.length,IS_LYING?6:0);
  assert.deepEqual(RECORDED_VIEWS.map(v=>v.name),['默认-64路','默认-8路','默认-16路','默认-32路','方形小视角','开凿者视角']);
});

test('shortcut returns only camera state and reanchors without changing recorded magnification',()=>{
  const source=structuredClone(RECORDED_VIEWS[0]);source.count=8;source.camera.target=arrayCenter(8);source.camera.pivot=arrayCenter(8);
  const original=JSON.stringify(source),camera=shortcutCamera(source,64);
  assert.deepEqual(camera.target,arrayCenter(64));assert.deepEqual(camera.pivot,arrayCenter(64));
  assert.equal(camera.zoom,source.camera.zoom);assert.equal(camera.scale,source.camera.scale);
  assert.deepEqual(camera.angles,source.camera.angles);assert.equal('settings' in camera,false);assert.equal('count' in camera,false);
  assert.equal(JSON.stringify(source),original);
});

test('lying presets retain exact framing at their recorded count and support every selectable count',()=>{
  if(!IS_LYING)return;
  for(const record of RECORDED_VIEWS){
    assert.deepEqual(shortcutCamera(record,record.count),record.camera);
    for(const count of [4,8,16,32,64]){const state=shortcutCamera(record,count);assert.ok(state.target.every(Number.isFinite));assert.ok(state.pivot.every(Number.isFinite));}
  }
});
