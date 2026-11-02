import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSceneStyle,composePlayerCamera} from '../../player/scene-styles.js';
import {RECORDED_VIEWS} from '../../player/engine/recorded-views.js';
import * as linear from '../../player/engine/linear/machine.js';
import * as lying from '../../player/engine/lying/machine.js';
import {shortcutCamera,CAMERA_SHORTCUTS} from '../../player/engine/lying/camera-shortcuts.js';
import * as originalLinear from '../../src/machine.js';
import * as originalLying from '../../experiments/lying-eight/src/machine.js';

test('the default corridor composition remains identical and orthographic scenes fit beside the cover',()=>{
  const camera=RECORDED_VIEWS[0].camera;
  assert.equal(normalizeSceneStyle('unknown'),'corridor');assert.equal(normalizeSceneStyle('lying'),'lying');
  assert.deepEqual(composePlayerCamera('corridor',camera,1400,700),camera);
  const mobile=composePlayerCamera('corridor',camera,390,300);
  assert.ok(Math.abs(mobile.scale-camera.scale*390/camera.viewport.width*1.65)<1e-10);
  for(const count of [4,8,16,32,64]){
    const original=shortcutCamera(CAMERA_SHORTCUTS[0],count);
    const framed=composePlayerCamera('lying',original,1400,700);
    assert.equal(framed.projection,'orthographic');assert.deepEqual(framed.viewport,{width:1400,height:700});
    assert.ok(framed.scale>0&&framed.scale<original.scale);assert.ok(framed.pan[0]<0);
    assert.notEqual(framed,original);assert.deepEqual(original.viewport,CAMERA_SHORTCUTS[0].camera.viewport);
  }
});

test('new player styles preserve the frozen machine geometry and piston endpoints at every supported count',()=>{
  for(const [model,original] of [[linear,originalLinear],[lying,originalLying]]){
    for(const count of [4,8,16,32,64])for(const q of [0,.25,.62,1]){
      assert.deepEqual(model.machineCorners(q,0,count),original.machineCorners(q,0,count));
      assert.deepEqual(model.machineCorners(q,count-1,count),original.machineCorners(q,count-1,count));
    }
  }
});
