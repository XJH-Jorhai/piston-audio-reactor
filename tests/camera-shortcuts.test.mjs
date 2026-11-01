import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_SHORTCUTS,shortcutCamera} from '../src/camera-shortcuts.js';
import {RECORDED_VIEWS} from '../src/recorded-views.js';
import {IS_LYING} from '../src/layout.js';
import {arrayCenter} from '../src/machine.js';

test('the page exposes exactly the user views for its own layout',()=>{
  const names=IS_LYING?['默认-64路','默认-8路','默认-16路','默认-32路','方形小视角','开凿者视角']:['默认视角','开凿者'];
  assert.equal(RECORDED_VIEWS.length,names.length);assert.equal(CAMERA_SHORTCUTS.length,names.length);
  assert.deepEqual(RECORDED_VIEWS.map(v=>v.name),names);
});

test('shortcut returns only camera state and reanchors without changing recorded magnification',()=>{
  const source=structuredClone(RECORDED_VIEWS[0]);source.count=8;source.selected=null;source.camera.focused=false;source.camera.target=arrayCenter(8);source.camera.pivot=arrayCenter(8);
  const original=JSON.stringify(source),camera=shortcutCamera(source,64);
  assert.deepEqual(camera.target,arrayCenter(64));assert.deepEqual(camera.pivot,arrayCenter(64));
  assert.equal(camera.zoom,source.camera.zoom);assert.equal(camera.scale,source.camera.scale);
  assert.deepEqual(camera.angles,source.camera.angles);assert.equal('settings' in camera,false);assert.equal('count' in camera,false);
  assert.equal(JSON.stringify(source),original);
});

test('recorded presets retain exact framing at their recorded count and support every selectable count',()=>{
  for(const record of RECORDED_VIEWS){
    assert.deepEqual(shortcutCamera(record,record.count),record.camera);
    for(const count of [4,8,16,32,64]){const state=shortcutCamera(record,count);assert.ok(state.target.every(Number.isFinite));assert.ok(state.pivot.every(Number.isFinite));}
  }
});
