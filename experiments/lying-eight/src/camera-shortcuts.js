import {validateCameraState} from './view-presets.js';
import {validateCount,arrayCenter,PITCH} from './machine.js';
import {IS_LYING,centerForStation} from './layout.js';
import {RECORDED_VIEWS} from './recorded-views.js';

export const CAMERA_SHORTCUTS=IS_LYING?RECORDED_VIEWS:[];
/** Keep captured magnification and pose, but reanchor to the current array. */
export function shortcutCamera(record,count){
  validateCount(count);validateCount(record.count);const camera=validateCameraState(record.camera);
  let shift;
  if(camera.focused){const axis=IS_LYING?2:0,first=centerForStation(0)[axis],index=record.selected??Math.round((camera.pivot[axis]-first)/PITCH),next=Math.max(0,Math.min(count-1,index));shift=centerForStation(next).map((v,i)=>v-centerForStation(index)[i]);}
  else shift=arrayCenter(count).map((v,i)=>v-arrayCenter(record.count)[i]);
  camera.target=camera.target.map((v,i)=>v+shift[i]);camera.pivot=camera.pivot.map((v,i)=>v+shift[i]);
  return camera;
}
