/** Multiple cues per line and global millisecond offsets are supported. */
export function parseLyrics(source){
  if(typeof source!=='string'||source.length>500000)throw new RangeError('歌词文件需小于 500 KB。');
  const raw=source.replace(/^\uFEFF/,'').split(/\r?\n/),offsets=[...source.matchAll(/\[offset:\s*([+-]?\d+)\s*\]/gi)],offset=offsets.length?Number(offsets.at(-1)[1])/1000:0;
  if(raw.length>5000)throw new RangeError('歌词行数过多。');
  const lines=[];
  for(const row of raw){
    const cues=[...row.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)],content=row.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g,'').trim();
    for(const cue of cues){const seconds=Number(cue[2]);if(seconds>=60)continue;const fraction=cue[3]?Number('0.'+cue[3]):0;lines.push({time:Math.max(0,Number(cue[1])*60+seconds+fraction+offset),text:content});}
  }
  if(lines.length)return {synced:true,lines:lines.sort((a,b)=>a.time-b.time)};
  return {synced:false,lines:raw.map(line=>line.trim()).filter(line=>line&&!/^\[(?:ar|ti|al|by|re|ve|length|offset):.*\]$/i.test(line)).map(text=>({time:null,text}))};
}
export function activeLyricIndex(lines,time){
  let low=0,high=lines.length;
  while(low<high){const middle=(low+high)>>1;if(lines[middle].time<=time)low=middle+1;else high=middle;}
  return low-1;
}
