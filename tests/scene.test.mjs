import test from 'node:test';
import assert from 'node:assert/strict';
import {machineParts,projectPoint,COUNT,PITCH} from '../src/scene.js';
import {restFromPhase,strokeFromLoudness} from '../src/spectrum.js';
test('sixteen machines form one equally spaced line with fixed piston housings',()=>{
  assert.equal(COUNT,16);
  const rest=restFromPhase(.38),fixed=machineParts(rest).filter(p=>p.id.endsWith('-base')||p.id==='pumpkin');
  for(let i=0;i<COUNT;i++){
    for(const q of [0,.2,.5,.8,1]){
      const parts=machineParts(q,i*PITCH);
      assert.equal(parts.filter(p=>p.material==='iron').length,4);
      assert.equal(Math.max(...parts.map(p=>p.y+p.h)),3);
      const staticParts=parts.filter(p=>p.id.endsWith('-base')||p.id==='pumpkin');
      assert.deepEqual(staticParts,fixed.map(p=>({...p,x:p.x+i*PITCH})));
      for(const name of ['left','body','right']){
        const head=parts.find(p=>p.id===name+'-head'),iron=parts.find(p=>p.id===name+'-iron'),rod=parts.find(p=>p.id===name+'-rod');
        const e=name==='body'?q:1-q;
        assert.equal(head.z+head.d,iron.z);
        if(e===0)assert.equal(rod,undefined);else{assert.equal(rod.d,e);assert.equal(rod.z+rod.d,head.z);}
      }
      assert.equal(parts.find(p=>p.id==='left-iron').z,parts.find(p=>p.id==='right-iron').z);
      assert.equal(parts.find(p=>p.id==='body-iron').z+parts.find(p=>p.id==='left-iron').z,1);
    }
  }
});
test('view ray changes depth without changing projected position',()=>{
  const origin=projectPoint([0,0,0]),ray=[70/130,(28*70/130+58)/145,1],point=projectPoint(ray);
  assert.ok(Math.abs(origin[0]-point[0])<1e-12);assert.ok(Math.abs(origin[1]-point[1])<1e-12);assert.ok(point[2]>origin[2]);
});
test('high loudness extends the central golem and retracts the side blocks',()=>{
  const sideRest=restFromPhase(.38),rest=1-sideRest;
  const get=(level,id)=>machineParts(strokeFromLoudness(level,{rest})).find(p=>p.id===id).z;
  assert.ok(get(.85,'body-iron')>get(.2,'body-iron'));
  assert.ok(get(.85,'left-iron')<get(.2,'left-iron'));
  assert.ok(get(.85,'right-iron')<get(.2,'right-iron'));
  assert.equal(get(0,'body-iron'),1-sideRest);
  assert.ok(Math.abs(get(0,'left-iron')-sideRest)<1e-12);
});
test('music amplitude never produces more than one block of travel',()=>{
  const rest=restFromPhase(.38);
  for(let i=0;i<COUNT;i++)for(let step=0;step<=100;step++){
    const q=strokeFromLoudness(step/100,{rest});
    for(const p of machineParts(q,i*PITCH).filter(p=>p.id.endsWith('-rod')))assert.ok(p.d>0&&p.d<=1);
  }
});
