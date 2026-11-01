/** Rigidly rotated original machines, repeated along the head-to-foot axis. */
export const COUNT=8,MIN_COUNT=4,MAX_COUNT=32,PITCH=3.5;
export function validateCount(count){
  if(!Number.isInteger(count)||count<MIN_COUNT||count>MAX_COUNT)throw new RangeError('Channel count must be an integer from 4 to 32.');
  return count;
}
export const arrayCenter=count=>[.5,.5,((validateCount(count)-1)*PITCH-3)/2];

/** -90 degrees about X: the original +Z piston travel becomes upward +Y. */
export function layPoint([x,y,z],offset=0){
  return [x,z,offset-y];
}

/** q is central upward extension; both arm columns move by 1-q. */
export function machineParts(q,offset=0){
  if(!Number.isFinite(q)||!Number.isFinite(offset))throw new TypeError('Machine extension and station offset must be finite.');
  q=Math.min(1,Math.max(0,q));
  const parts=[];
  function box(id,x,y,z,w,h,d,material){
    const source={id,x,y,z,w,h,d,material};
    parts.push({id,x,y:z,z:offset-y-h,w,h:d,d:h,material,source,station:offset});
  }
  for(const [name,x,extension] of [['left',-1,1-q],['body',0,q],['right',1,1-q]]){
    box(name+'-base',x,1,-1,1,1,.75,'piston');
    if(extension>1e-8)box(name+'-rod',x+.375,1.375,-.25,.25,.25,extension,'rod');
    box(name+'-head',x,1,extension-.25,1,1,.25,'head');
    box(name+'-iron',x,1,extension,1,1,1,name==='body'?'iron':'arm');
    if(name==='body')box('lower-iron',x,0,extension,1,1,1,'iron');
  }
  box('pumpkin',0,2,0,1,1,1,'pumpkin');
  return parts;
}

/** World-space AABB corners; a right-angle rigid rotation keeps these exact. */
export function machineCorners(q,index,count=COUNT){
  validateCount(count);
  if(!Number.isInteger(index)||index<0||index>=count)throw new RangeError('Machine index is outside the array.');
  const points=[];
  for(const part of machineParts(q,index*PITCH)){
    for(const x of [part.x,part.x+part.w])for(const y of [part.y,part.y+part.h])for(const z of [part.z,part.z+part.d])points.push([x,y,z]);
  }
  return points;
}

/** Both endpoint poses bound every linear piston trajectory for every station. */
export function framingCorners(count=COUNT){
  validateCount(count);
  return [0,1].flatMap(q=>Array.from({length:count},(_,index)=>machineCorners(q,index,count)).flat());
}
