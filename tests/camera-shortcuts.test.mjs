import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_SHORTCUTS,shortcutCamera} from '../src/camera-shortcuts.js';
import {createCamera} from '../src/camera.js';

test('the user player camera preserves its captured perspective framing at every channel count',()=>{
  assert.equal(CAMERA_SHORTCUTS.length,1);
  const record=CAMERA_SHORTCUTS[0];assert.equal(record.name,'播放器视角');assert.equal(record.id,'player-view');
  const original=JSON.stringify(record);
  for(const count of [4,8,16,32,64]){
    const state=shortcutCamera(record,count);
    assert.deepEqual(state,record.camera);
    const camera=createCamera('free',{count,angles:state.angles,target:state.target,distance:state.distance});
    assert.equal(camera.distance,state.distance);
  }
  assert.equal(JSON.stringify(record),original);
  assert.equal(record.camera.distance,9.559844851319625);
  assert.deepEqual(record.camera.pan,[-493.71435546875,-8.57135009765625]);
  assert.equal('settings' in shortcutCamera(record,16),false);
});
