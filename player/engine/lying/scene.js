import {createCamera,framePoints,orbitAngles} from './camera.js';
import {validateCameraState,adaptCameraFraming} from './view-presets.js';
import {COUNT,PITCH,placePoint,machineParts,machineCorners,framingCorners,validateCount,arrayCenter} from './machine.js';
import {IS_LYING,centerForStation} from './layout.js';
export {COUNT,PITCH,machineParts,machineCorners,framingCorners} from './machine.js';
const textureNames=['iron_block','carved_pumpkin','pumpkin_side','pumpkin_top','piston_top','piston_side','piston_inner','piston_bottom'];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export async function loadTextures(){
  return Object.fromEntries(await Promise.all(textureNames.map(async name=>{
    const image=new Image();image.src=new URL('../../assets/minecraft/'+name+'.png',import.meta.url).href;await image.decode();return [name,image];
  })));
}
function buildAtlas(images){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const entries=new Map(),pixels=new Map();let count=0;
  function add(name,{source,shade=0,rotation=0,crop=[0,0,16,16],color,shadow=false}){
    const tile=document.createElement('canvas');tile.width=tile.height=16;const t=tile.getContext('2d');t.imageSmoothingEnabled=false;
    if(color){t.fillStyle=color;t.fillRect(0,0,16,16);}
    else if(shadow){const gradient=t.createRadialGradient(8,8,1,8,8,9);gradient.addColorStop(0,'#000000b0');gradient.addColorStop(1,'#00000000');t.fillStyle=gradient;t.fillRect(0,0,16,16);}
    else{
      const [x,y,w,h]=crop,turned=Math.abs(rotation)%180===90,sourceTile=document.createElement('canvas');
      sourceTile.width=turned?h:w;sourceTile.height=turned?w:h;const s=sourceTile.getContext('2d');
      s.translate(sourceTile.width/2,sourceTile.height/2);s.rotate(rotation*Math.PI/180);s.drawImage(images[source],x,y,w,h,-w/2,-h/2,w,h);
      t.drawImage(sourceTile,0,0,16,16);t.fillStyle='rgba(0,0,0,'+shade+')';t.fillRect(0,0,16,16);
    }
    const column=count%8,row=Math.floor(count/8);ctx.drawImage(tile,column*16,row*16);
    entries.set(name,{u:column/8,v:row/8,w:1/8,h:1/8,index:count});
    pixels.set(name,t.getImageData(0,0,16,16).data);count++;
  }
  for(const [face,shade] of IS_LYING?[['front',0],['right',.28],['top',.24],['left',.16],['back',.42],['bottom',.12]]:[['front',.12],['right',.28],['top',0],['left',.18],['back',.42],['bottom',.5]]){
    add('iron-'+face,{source:'iron_block',shade});
    add('arm-'+face,{source:'iron_block',shade:Math.min(.65,shade+(IS_LYING?.17:.03))});
    add('pumpkin-'+face,{source:face==='front'?'carved_pumpkin':(face==='top'||face==='bottom')?'pumpkin_top':'pumpkin_side',shade});
    add('piston-'+face,face==='front'?{source:'piston_inner',shade}:face==='back'?{source:'piston_bottom',shade}:{source:'piston_side',shade,rotation:face==='right'?-90:face==='left'?90:180,crop:[0,4,16,12]});
    add('head-'+face,(face==='front'||face==='back')?{source:'piston_top',shade}:{source:'piston_side',shade,rotation:face==='right'?-90:face==='left'?90:180,crop:[0,0,16,4]});
    add('rod-'+face,{source:'piston_top',shade,rotation:face==='right'?-90:face==='left'?90:180,crop:[6,6,4,4]});
    add('plate-'+face,{color:face==='top'?'#34414a':face==='front'?'#1b272f':'#233039'});
  }
  for(const [name,color] of [['grid','#31444f'],['rail','#52636c'],['lane','#18252e'],['guide','#937344'],['low','#f3b36b'],['mid','#d1dc9c'],['high','#a0c1b9']])add(name,{color});
  add('shadow',{shadow:true});
  return {canvas,entries,pixels};
}
function facesForBox(p,emit){
  if(p.source){facesForBox(p.source,(a,b,c,name)=>emit(placePoint(a,p.station),placePoint(b,p.station),placePoint(c,p.station),name));return;}
  const {x,y,z,w,h,d,material}=p;
  emit([x,y+h,z+d],[x+w,y+h,z+d],[x,y,z+d],material+'-front');
  emit([x+w,y+h,z+d],[x+w,y+h,z],[x+w,y,z+d],material+'-right');
  emit([x,y+h,z],[x+w,y+h,z],[x,y+h,z+d],material+'-top');
  emit([x,y+h,z],[x,y+h,z+d],[x,y,z],material+'-left');
  emit([x+w,y+h,z],[x,y+h,z],[x+w,y,z],material+'-back');
  emit([x,y,z+d],[x+w,y,z+d],[x,y,z],material+'-bottom');
}
function makeFloor(count){
  if(!IS_LYING){
    const faces=[],emit=(a,b,c,tile)=>faces.push({a,b,c,tile}),end=(count-1)*PITCH+2.5;
    emit([-1.5,-.18,-1.3],[end,-.18,-1.3],[-1.5,-.18,2.6],'lane');
    for(let x=-1.5;x<=end+.5;x+=PITCH)emit([x,-.17,-2],[x+.014,-.17,-2],[x,-.17,3.4],'grid');
    for(let z=-2;z<=3.5;z+=1)emit([-2,-.17,z],[end+.5,-.17,z],[-2,-.17,z+.014],'grid');
    for(let i=0;i<count;i++){const x=i*PITCH;facesForBox({x:x-1.22,y:-.14,z:-1.18,w:3.44,h:.1,d:3.7,material:'plate'},emit);emit([x-1.05,-.025,2.43],[x+2.05,-.025,2.43],[x-1.05,-.025,2.48],'rail');}
    return faces;
  }
  const faces=[],emit=(a,b,c,tile)=>faces.push({a,b,c,tile}),end=(count-1)*PITCH+.4;
  emit([-1.5,-1.18,-3.4],[2.5,-1.18,-3.4],[-1.5,-1.18,end],'lane');
  for(let x=-2.5;x<=3.5;x+=1)emit([x,-1.17,-4],[x+.014,-1.17,-4],[x,-1.17,end+1],'grid');
  for(let z=-3.5;z<=end+1;z+=PITCH)emit([-2.5,-1.17,z],[3.5,-1.17,z],[-2.5,-1.17,z+.014],'grid');
  for(const x of [-1.48,-.025,1.025,2.48])emit([x,-1.025,-3.3],[x+.025,-1.025,-3.3],[x,-1.025,end],'rail');
  for(let i=0;i<count;i++){
    const z=i*PITCH;
    facesForBox({x:-1.22,y:-1.14,z:z-3.14,w:3.44,h:.10,d:3.28,material:'plate'},emit);
    emit([-.1,-1.033,z-2.1],[1.1,-1.033,z-2.1],[-.1,-1.033,z+.05],'shadow');
    emit([2.27,-1.025,z-2.75],[2.37,-1.025,z-2.75],[2.27,-1.025,z-.15],'rail');
  }
  return faces;
}

export function createSceneRenderer(canvas,images,{forceCpu=false,count=COUNT}={}){
  validateCount(count);
  const atlas=buildAtlas(images);
  let points=framingCorners(count),floor=makeFloor(count),camera=createCamera('side',{count});
  const view={mode:'side',zoom:1,panX:0,panY:0,centerX:0,centerY:0,width:1,height:1,scale:1,dpr:1,pivot:[...camera.target]};
  let framingReference;
  const rememberFraming=()=>{framingReference={width:view.width,height:view.height,scale:view.scale,panX:view.panX,panY:view.panY};};
  let revision=0,backend,lastDraw=-1;
  let lastStrokes=new Float32Array(count),lastEnergy=new Float32Array(count);
  const worldToScreen=point=>{const p=camera.project(point),s=view.scale*view.zoom;return [(p[0]-view.centerX)*s+view.width/2+view.panX,(p[1]-view.centerY)*s+view.height/2+view.panY,-p[2]];};
  const gl=forceCpu?null:canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true});
  if(gl){
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec3 a_pos;in vec2 a_uv;uniform vec4 u_camera;uniform vec4 u_screen;uniform vec3 u_eye;uniform vec3 u_right;uniform vec3 u_up;uniform vec3 u_forward;uniform vec2 u_clip;out vec2 v_uv;out float v_depth;void main(){vec3 p=a_pos-u_eye;float z=dot(p,u_forward);float x=dot(p,u_right);float y=dot(p,u_up);float sx=(x-u_camera.x)*u_camera.z*2./u_screen.x+u_screen.z*2./u_screen.x;float sy=(y+u_camera.y)*u_camera.z*2./u_screen.y-u_screen.w*2./u_screen.y;gl_Position=vec4(sx,sy,(2.*z-u_clip.x-u_clip.y)/(u_clip.y-u_clip.x),1.);v_uv=a_uv;v_depth=z;}');
    const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;in vec2 v_uv;in float v_depth;uniform sampler2D u_atlas;out vec4 color;void main(){color=texture(u_atlas,v_uv);if(color.a<.015)discard;}');
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const buffer=gl.createBuffer(),texture=gl.createTexture();let vertices=new Float32Array(180000),cursor=0;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const position=gl.getAttribLocation(program,'a_pos'),uv=gl.getAttribLocation(program,'a_uv');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas.canvas);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
    const cameraUniform=gl.getUniformLocation(program,'u_camera'),screen=gl.getUniformLocation(program,'u_screen');
    backend={name:'webgl2',start(){
    for(const [name,value] of [['u_eye',camera.eye],['u_right',camera.right],['u_up',camera.up],['u_forward',camera.forward]])gl.uniform3fv(gl.getUniformLocation(program,name),value);
    gl.uniform2f(gl.getUniformLocation(program,'u_clip'),camera.near,camera.far);
      cursor=0;gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform4f(cameraUniform,view.centerX,view.centerY,view.scale*view.zoom,0);gl.uniform4f(screen,view.width,view.height,view.panX,view.panY);
    },face(a,b,c,name){
      if(cursor+30>vertices.length){const expanded=new Float32Array(vertices.length*2);expanded.set(vertices);vertices=expanded;}
      const t=atlas.entries.get(name),d=[b[0]+c[0]-a[0],b[1]+c[1]-a[1],b[2]+c[2]-a[2]];
      const vertex=(p,u,v)=>{vertices[cursor++]=p[0];vertices[cursor++]=p[1];vertices[cursor++]=p[2];vertices[cursor++]=t.u+u*t.w;vertices[cursor++]=t.v+v*t.h;};
      vertex(a,0,0);vertex(b,1,0);vertex(c,0,1);vertex(c,0,1);vertex(b,1,0);vertex(d,1,1);
    },finish(){gl.bufferData(gl.ARRAY_BUFFER,vertices.subarray(0,cursor),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,cursor/5);},dispose(){gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);}};
  }else{
    const ctx=canvas.getContext('2d');let output,zbuffer,cachedPixels,cachedDepth,lastRevision=-1;
    backend={name:'cpu',start(){
      if(!output||output.width!==canvas.width||output.height!==canvas.height){output=ctx.createImageData(canvas.width,canvas.height);zbuffer=new Float32Array(canvas.width*canvas.height);lastRevision=-1;}
      if(lastRevision===revision){output.data.set(cachedPixels);zbuffer.set(cachedDepth);return true;}
      output.data.fill(0);zbuffer.fill(-Infinity);return false;
    },face(a3,b3,c3,name){
      const d3=b3.map((value,i)=>value+c3[i]-a3[i]),[a,b,c,d]=[a3,b3,c3,d3].map(worldToScreen),data=atlas.pixels.get(name);
      function triangle(a,b,c,ua,va,ub,vb,uc,vc){
        const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(denominator)<1e-8)return;
        const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(canvas.width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(canvas.height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
        for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
          const px=x+.5-c[0],py=y+.5-c[1],w0=((b[1]-c[1])*px+(c[0]-b[0])*py)/denominator,w1=((c[1]-a[1])*px+(a[0]-c[0])*py)/denominator,w2=1-w0-w1;
          if(w0<0||w1<0||w2<0)continue;
          const inverse=w0*a[2]+w1*b[2]+w2*c[2],index=y*canvas.width+x;if(inverse<zbuffer[index])continue;
          const u=w0*ua+w1*ub+w2*uc,v=w0*va+w1*vb+w2*vc;
          const source=(Math.min(15,Math.max(0,Math.floor(v*16)))*16+Math.min(15,Math.max(0,Math.floor(u*16))))*4,alpha=data[source+3]/255;if(alpha<.015)continue;
          const destination=index*4,old=output.data[destination+3]/255,combined=alpha+old*(1-alpha);
          for(let k=0;k<3;k++)output.data[destination+k]=(data[source+k]*alpha+output.data[destination+k]*old*(1-alpha))/combined;
          output.data[destination+3]=combined*255;zbuffer[index]=inverse;
        }
      }
      triangle(a,b,c,0,0,1,0,0,1);triangle(c,b,d,0,1,1,0,1,1);
    },cacheFloor(){cachedPixels=output.data.slice();cachedDepth=zbuffer.slice();lastRevision=revision;},finish(){ctx.putImageData(output,0,0);},dispose(){}};
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();view.width=Math.max(1,rect.width);view.height=Math.max(1,rect.height);view.dpr=backend.name==='cpu'?1:Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(view.width*view.dpr);canvas.height=Math.round(view.height*view.dpr);
    camera=createCamera(view.mode,{count,aspect:view.width/view.height,...(view.mode==='free'?{angles:camera.angles,target:camera.target}:{})});
    if(view.mode==='free'&&framingReference){const ratio=Math.min(view.width/framingReference.width,view.height/framingReference.height);view.scale=framingReference.scale*ratio;view.panX=framingReference.panX*ratio;view.panY=framingReference.panY*ratio;}
    else{const framed=framePoints(camera,points,view.width,view.height);view.scale=framed.scale;if(!view.focused){view.centerX=framed.centerX;view.centerY=framed.centerY;}}
    revision++;
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function draw(strokes,energy){
    if(lastDraw===revision&&!strokes.some((v,i)=>Math.abs(v-lastStrokes[i])>.00008)&&!energy.some((v,i)=>Math.abs(v-lastEnergy[i])>.00008))return;
    const cached=backend.start();if(!cached){for(const f of floor)backend.face(f.a,f.b,f.c,f.tile);backend.cacheFloor?.();}
    for(let i=0;i<count;i++){
      for(const [x,e] of [[-1,1-strokes[i]],[0,strokes[i]],[1,1-strokes[i]]]){if(IS_LYING){const z=i*PITCH,dx=.22*(e+.3),dz=.07*(e+.3);backend.face([x-.10+dx,-1.031,z-2.10+dz],[x+1.10+dx,-1.031,z-2.10+dz],[x-.10+dx,-1.031,z+(x===0?.10:-.90)+dz],'shadow');}else{const xx=i*PITCH+x;backend.face([xx-.1,-.031,e-.1],[xx+1.1,-.031,e-.1],[xx-.1,-.031,e+1.1],'shadow');}}
      for(const p of machineParts(strokes[i],i*PITCH))facesForBox(p,backend.face);
      if(energy[i]>.001){const tone=i/count<1/3?'low':i/count<2/3?'mid':'high';if(IS_LYING){const z=i*PITCH-2.75;backend.face([2.27,-1.023,z],[2.37,-1.023,z],[2.27,-1.023,z+2.6*energy[i]],tone);}else{const x=i*PITCH-1.05;backend.face([x,-.023,2.43],[x+3.1*energy[i],-.023,2.43],[x,-.023,2.48],tone);}}
    }
    backend.finish();
    lastStrokes.set(strokes);lastEnergy.set(energy);lastDraw=revision;
  }
  return {backend:backend.name,draw,worldToScreen,get count(){return count;},get viewMode(){return view.mode;},get angles(){return {...camera.angles};},get zoom(){return view.zoom;},
    captureCamera(){return validateCameraState({projection:'orthographic',angleUnit:'radians',angles:camera.angles,target:camera.target,pivot:view.pivot,center:[view.centerX,view.centerY],pan:[view.panX,view.panY],viewport:{width:view.width,height:view.height},scale:view.scale,zoom:view.zoom,focused:!!view.focused});},
    restoreCamera(value){const state=validateCameraState(value),framed=adaptCameraFraming(state,view.width,view.height);camera=createCamera('free',{count,angles:state.angles,target:state.target});view.mode='free';view.pivot=state.pivot;view.centerX=state.center[0];view.centerY=state.center[1];view.zoom=state.zoom;view.focused=state.focused;view.scale=framed.scale;[view.panX,view.panY]=framed.pan;framingReference={width:state.viewport.width,height:state.viewport.height,scale:state.scale,panX:state.pan[0],panY:state.pan[1]};revision++;},
    setCount(value){validateCount(value);if(value===count)return;count=value;points=framingCorners(count);floor=makeFloor(count);camera=createCamera(view.mode,{count,angles:camera.angles});view.pivot=[...camera.target];lastStrokes=new Float32Array(count);lastEnergy=new Float32Array(count);view.focused=false;view.zoom=1;view.panX=view.panY=0;const framed=framePoints(camera,points,view.width,view.height);view.scale=framed.scale;view.centerX=framed.centerX;view.centerY=framed.centerY;rememberFraming();revision++;},
    setView(mode){if(mode==='free'){this.orbit(0,0);return;}camera=createCamera(mode,{count,aspect:view.width/view.height});view.mode=mode;view.pivot=[...camera.target];view.zoom=1;view.panX=view.panY=0;view.focused=false;const framed=framePoints(camera,points,view.width,view.height);view.scale=framed.scale;view.centerX=framed.centerX;view.centerY=framed.centerY;revision++;},
    orbit(dx,dy){const before=camera.project(view.pivot);camera=createCamera('free',{count,angles:orbitAngles(camera.angles,dx,dy),target:view.pivot});const after=camera.project(view.pivot);view.centerX+=after[0]-before[0];view.centerY+=after[1]-before[1];view.mode='free';rememberFraming();revision++;},
    setZoom(value){view.zoom=clamp(value,.65,12);rememberFraming();revision++;},
    pan(dx,dy){view.panX+=dx;view.panY+=dy;rememberFraming();revision++;},
    reset(){view.zoom=1;view.panX=view.panY=0;const framed=framePoints(camera,points,view.width,view.height);view.scale=framed.scale;view.centerX=framed.centerX;view.centerY=framed.centerY;view.pivot=arrayCenter(count);view.focused=false;rememberFraming();revision++;},
    detail(){this.focus(3);},
    focus(index){const framed=framePoints(camera,[0,1].flatMap(q=>machineCorners(q,index,count)),view.width,view.height);view.zoom=clamp(framed.scale*.83/view.scale,.65,12);view.panX=view.panY=0;view.centerX=framed.centerX;view.centerY=framed.centerY;view.pivot=centerForStation(index);view.focused=true;rememberFraming();revision++;},
    dispose(){observer.disconnect();backend.dispose();}
  };
}
