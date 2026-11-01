import {DEFAULT_CONFIG} from './reference-config.js';

const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;

/** Logarithmic bands; start/end select FFT bin centres in [low, high). */
export function createBands(sampleRate,fftSize,count=16,minHz=40,maxHz=16000){
  if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new RangeError('sampleRate must be positive.');
  if(!Number.isInteger(fftSize)||fftSize<32||(fftSize&(fftSize-1)))throw new RangeError('fftSize must be a power of two, at least 32.');
  if(!Number.isInteger(count)||count<1||count>256)throw new RangeError('count must be between 1 and 256.');
  const nyquist=sampleRate/2,upper=Math.min(maxHz,nyquist),bins=fftSize/2,binHz=sampleRate/fftSize;
  if(!Number.isFinite(minHz)||!Number.isFinite(upper)||minHz<=0||upper<=minHz)throw new RangeError('Frequency limits must be positive and increasing.');
  const ratio=upper/minHz;
  return Array.from({length:count},(_,index)=>{
    const low=minHz*Math.pow(ratio,index/count),high=minHz*Math.pow(ratio,(index+1)/count);
    const start=clamp(Math.ceil(low/binHz),0,bins-1);
    const end=clamp(Math.max(start+1,Math.ceil(high/binHz)),start+1,bins);
    return {low,high,start,end};
  });
}

/** Average power within each band, then map its RMS dB level to visible energy. */
export function measureBands(db,bands,{floorDb=-78,ceilingDb=-22,gain=1}={}){
  if(!Number.isFinite(floorDb)||!Number.isFinite(ceilingDb)||ceilingDb<=floorDb)throw new RangeError('ceilingDb must exceed floorDb.');
  const output=new Float32Array(bands.length),sensitivity=Math.max(0,finite(gain,1));
  for(let band=0;band<bands.length;band++){
    const start=clamp(Math.floor(bands[band].start),0,db.length),end=clamp(Math.floor(bands[band].end),start,db.length);
    let power=0;
    for(let bin=start;bin<end;bin++)if(Number.isFinite(db[bin]))power+=Math.pow(10,Math.min(120,db[bin])/10);
    if(!power||end===start)continue;
    const rmsDb=10*Math.log10(power/(end-start));
    const normalized=clamp((rmsDb-floorDb)/(ceilingDb-floorDb));
    output[band]=clamp(Math.pow(normalized,1.4)*sensitivity);
  }
  return output;
}

/** Exponential envelope: fast attack, slower release, independent of frame rate. */
export function smoothLevels(previous,next,dt=1/60,smoothing=.55){
  const output=new Float32Array(next.length),elapsed=Math.max(0,finite(dt)),amount=clamp(finite(smoothing,.55));
  for(let index=0;index<next.length;index++){
    const before=clamp(finite(previous?.[index])),target=clamp(finite(next[index]));
    const tau=target>before ? .012+.065*amount : .065+.33*amount;
    const value=before+(target-before)*(-Math.expm1(-elapsed/tau));
    output[index]=value<1e-6?0:value;
  }
  return output;
}

const cubic=(a,b,c,d,u)=>{const inverse=1-u;return inverse*inverse*inverse*a+3*inverse*inverse*u*b+3*inverse*u*u*c+u*u*u*d;};

/** Convert the generator's progress position into its actual mechanical extension. */
export function restFromPhase(phase01=.38){
  const phase=clamp(finite(phase01,.38)),points=DEFAULT_CONFIG.curve;
  if(phase===0||phase===1)return points[phase===0?0:points.length-1].v;
  let index=0;
  while(index<points.length-2&&phase>points[index+1].t)index++;
  const a=points[index],b=points[index+1];
  let low=0,high=1;
  for(let iteration=0;iteration<48;iteration++){
    const middle=(low+high)/2;
    if(cubic(a.t,a.out.t,b.in.t,b.t,middle)<phase)low=middle;else high=middle;
  }
  return clamp(cubic(a.v,a.out.v,b.in.v,b.v,(low+high)/2));
}

export const DEFAULT_MAPPING=Object.freeze({lowPhase:38,highPhase:0,response:1});
export function normalizeMapping(value={}){
  return {lowPhase:clamp(finite(value?.lowPhase,DEFAULT_MAPPING.lowPhase),0,50),highPhase:clamp(finite(value?.highPhase,0),0,50),response:clamp(finite(value?.response,1),.25,4)};
}
/** Generator progress specifies endpoint poses. Interpolate their physical
 * extensions directly, so the generator's timing plateaus don't clip loudness. */
export function createStrokeMapper(options={}){
  const mapping=normalizeMapping(options);
  const low=1-restFromPhase(mapping.lowPhase/100),high=1-restFromPhase(mapping.highPhase/100);
  return (level,active=true)=>{
    const loudness=active?clamp(finite(level)):0;
    return clamp(low+(high-low)*Math.pow(loudness,mapping.response));
  };
}
export function strokeFromLoudness(level,options={}){
  return createStrokeMapper(options)(level,options?.active??true);
}

/** Symmetric position interpolation: dt affects settling only, never the target. */
export function smoothStrokes(previous,target,dt=1/60,smoothing=.55){
  const output=new Float32Array(target.length),elapsed=Math.max(0,finite(dt));
  const tau=.018+.085*clamp(finite(smoothing,.55)),alpha=-Math.expm1(-elapsed/tau);
  for(let index=0;index<target.length;index++){
    const before=clamp(finite(previous?.[index],finite(target[index],.5)));
    const next=clamp(finite(target[index],before));
    output[index]=before+(next-before)*alpha;
  }
  return output;
}
