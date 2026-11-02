const clean=value=>value.replace(/\0/g,' ').trim();
export function formatTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '00:00';
  const total=Math.floor(seconds),s=String(total%60).padStart(2,'0'),m=String(Math.floor(total/60)%60).padStart(2,'0');
  return total>=3600?Math.floor(total/3600)+':'+m+':'+s:m+':'+s;
}
export function filenameInfo(name){
  const stem=String(name).replace(/\.[^.]+$/,'').trim(),parts=stem.split(/\s+[-–—]\s+/);
  return parts.length>1?{artist:parts.shift(),title:parts.join(' - ')}:{title:stem||'未命名音轨',artist:'本地音频'};
}
const uint32=(b,o)=>b[o]*16777216+b[o+1]*65536+b[o+2]*256+b[o+3];
const sync32=(b,o)=>((b[o]&127)*2097152+(b[o+1]&127)*16384+(b[o+2]&127)*128+(b[o+3]&127));
function text(bytes,encoding){
  const label=encoding===0?'windows-1252':encoding===3?'utf-8':encoding===2||bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-16le';
  return clean(new TextDecoder(label).decode(bytes));
}
function endOfText(bytes,start,encoding){
  if(encoding===1||encoding===2){for(let i=start;i+1<bytes.length;i+=2)if(bytes[i]===0&&bytes[i+1]===0)return i+2;}
  else{const i=bytes.indexOf(0,start);if(i>=0)return i+1;}
  return bytes.length;
}
/** Bounded ID3v2.3/2.4 reader. Metadata is displayed as text, never HTML. */
export function parseID3(bytes){
  const result={};
  if(bytes.length<10||String.fromCharCode(...bytes.slice(0,3))!=='ID3'||![3,4].includes(bytes[3]))return result;
  const version=bytes[3],size=sync32(bytes,6),limit=Math.min(bytes.length,size+10);
  if(size>8*1024*1024||bytes[5]&128)return result;
  let pos=10;
  if(bytes[5]&64){if(pos+4>limit)return result;pos+=version===4?sync32(bytes,pos):4+uint32(bytes,pos);}
  while(pos+10<=limit){
    const id=String.fromCharCode(...bytes.slice(pos,pos+4)),length=version===4?sync32(bytes,pos+4):uint32(bytes,pos+4),flags=bytes[pos+9];
    if(!/^[A-Z0-9]{4}$/.test(id)||!length||pos+10+length>limit)break;
    let data=bytes.slice(pos+10,pos+10+length);pos+=10+length;
    if(flags&(version===4?12:192))continue;
    if(version===4&&flags&2)data=data.filter((v,i)=>!(v===0&&data[i-1]===255));
    const encoding=data[0];if(encoding>3)continue;
    const key={TIT2:'title',TPE1:'artist',TALB:'album'}[id];
    if(key)result[key]=text(data.slice(1),encoding).slice(0,500);
    if(id==='USLT'&&data.length>4)result.lyrics=text(data.slice(endOfText(data,4,encoding)),encoding).slice(0,500000);
    if(id==='APIC'){
      const mimeEnd=data.indexOf(0,1);if(mimeEnd<0)continue;
      const mime=new TextDecoder().decode(data.slice(1,mimeEnd)).toLowerCase().replace('image/jpg','image/jpeg');
      const start=endOfText(data,mimeEnd+2,encoding),picture=data.slice(start);
      if(['image/jpeg','image/png','image/webp','image/avif'].includes(mime)&&picture.length&&picture.length<5*1024*1024&&(!result.picture||data[mimeEnd+1]===3))result.picture={mime,data:picture};
    }
  }
  return result;
}
export async function readAudioMetadata(file){
  const header=new Uint8Array(await file.slice(0,10).arrayBuffer());
  if(header.length<10||String.fromCharCode(...header.slice(0,3))!=='ID3')return {};
  const length=sync32(header,6);if(length>8*1024*1024||length+10>file.size)return {};
  return parseID3(new Uint8Array(await file.slice(0,length+10).arrayBuffer()));
}
