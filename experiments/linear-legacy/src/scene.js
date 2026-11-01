export const COUNT=16,PITCH=3.9;
const textureNames=['iron_block','carved_pumpkin','pumpkin_side','pumpkin_top','piston_top','piston_side','piston_inner','piston_bottom'];
export const projectPoint=([x,y,z])=>[x-z*70/130,x*28/130-y*145/130+z*58/130,x*70/130+y*(28*70/130+58)/145+z];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));

/** q is the central golem's extension; side blocks use 1-q. Housings stay fixed. */
export function machineParts(q,offset=0){
  const result=[],box=(id,x,y,z,w,h,d,material)=>result.push({id,x:x+offset,y,z,w,h,d,material});
  for(const [name,x,e] of [['left',-1,1-q],['body',0,q],['right',1,1-q]]){
    box(name+'-base',x,1,-1,1,1,.75,'piston');
    if(e>1e-8)box(name+'-rod',x+.375,1.375,-.25,.25,.25,e,'rod');
    box(name+'-head',x,1,e-.25,1,1,.25,'head');
    box(name+'-iron',x,1,e,1,1,1,'iron');
    if(name==='body')box('lower-iron',x,0,e,1,1,1,'iron');
  }
  box('pumpkin',0,2,0,1,1,1,'pumpkin');return result;
}
export async function loadTextures(){
  return Object.fromEntries(await Promise.all(textureNames.map(async name=>{
    const image=new Image();image.src=new URL('../assets/minecraft/'+name+'.png',import.meta.url).href;await image.decode();return [name,image];
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
  for(const [face,shade] of [['front',.12],['right',.28],['top',0]]){
    add('iron-'+face,{source:'iron_block',shade});
    add('pumpkin-'+face,{source:face==='front'?'carved_pumpkin':face==='top'?'pumpkin_top':'pumpkin_side',shade});
    add('piston-'+face,face==='front'?{source:'piston_inner',shade}:{source:'piston_side',shade,rotation:face==='right'?-90:180,crop:[0,4,16,12]});
    add('head-'+face,face==='front'?{source:'piston_top',shade}:{source:'piston_side',shade,rotation:face==='right'?-90:180,crop:[0,0,16,4]});
    add('rod-'+face,{source:'piston_top',shade,rotation:face==='right'?-90:180,crop:[6,6,4,4]});
    add('plate-'+face,{color:face==='top'?'#34414a':face==='front'?'#1b272f':'#233039'});
  }
  for(const [name,color] of [['grid','#26353f'],['rail','#46515a'],['low','#f3b36b'],['mid','#d1dc9c'],['high','#a0c1b9']])add(name,{color});
  add('shadow',{shadow:true});
  return {canvas,entries,pixels};
}
function facesForBox(p,emit){
  const {x,y,z,w,h,d,material}=p;
  emit([x,y+h,z+d],[x+w,y+h,z+d],[x,y,z+d],material+'-front');
  emit([x+w,y+h,z+d],[x+w,y+h,z],[x+w,y,z+d],material+'-right');
  emit([x,y+h,z],[x+w,y+h,z],[x,y+h,z+d],material+'-top');
}
function makeFloor(){
  const faces=[],emit=(a,b,c,tile)=>faces.push({a,b,c,tile});
  for(let x=-4;x<COUNT*PITCH+1;x+=2)emit([x,-.17,-3],[x+.012,-.17,-3],[x,-.17,5],'grid');
  for(let z=-3;z<=5;z+=2)emit([-4,-.17,z],[COUNT*PITCH+1,-.17,z],[-4,-.17,z+.012],'grid');
  for(let i=0;i<COUNT;i++){
    const x=i*PITCH;
    facesForBox({x:x-1.22,y:-.14,z:-1.18,w:3.44,h:.10,d:3.7,material:'plate'},emit);
    emit([x-1.4,-.035,-1],[x+2.4,-.035,-1],[x-1.4,-.035,2.35],'shadow');
    emit([x-1.05,-.025,2.43],[x+2.05,-.025,2.43],[x-1.05,-.025,2.48],'rail');
  }
  return faces;
}
function bounds(){
  const points=[];
  for(const q of [0,1])for(const i of [0,COUNT-1])for(const p of machineParts(q,i*PITCH)){
    for(const x of [p.x,p.x+p.w])for(const y of [p.y,p.y+p.h])for(const z of [p.z,p.z+p.d])points.push(projectPoint([x,y,z]));
  }
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}

export function createSceneRenderer(canvas,labelCanvas,images,{forceCpu=false}={}){
  const atlas=buildAtlas(images),box=bounds(),floor=makeFloor(),labels=labelCanvas.getContext('2d');
  const view={zoom:1,panX:0,panY:0,centerX:(box.minX+box.maxX)/2,centerY:(box.minY+box.maxY)/2,width:1,height:1,scale:1,dpr:1};
  let revision=0,backend,initialView=true,lastDraw=-1;
  const lastStrokes=new Float32Array(COUNT),lastEnergy=new Float32Array(COUNT);
  const worldToScreen=point=>{const p=projectPoint(point),s=view.scale*view.zoom;return [(p[0]-view.centerX)*s+view.width/2+view.panX,(p[1]-view.centerY)*s+view.height/2+view.panY,p[2]];};
  const gl=forceCpu?null:canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true});
  if(gl){
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec3 a_pos;in vec2 a_uv;uniform vec4 u_camera;uniform vec4 u_screen;out vec2 v_uv;void main(){vec2 p=vec2(a_pos.x-a_pos.z*70./130.,a_pos.x*28./130.-a_pos.y*145./130.+a_pos.z*58./130.);p=(p-u_camera.xy)*u_camera.z+u_screen.zw;float depth=a_pos.x*70./130.+a_pos.y*(28.*70./130.+58.)/145.+a_pos.z;gl_Position=vec4(p.x*2./u_screen.x,-p.y*2./u_screen.y,-depth/160.,1.);v_uv=a_uv;}');
    const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;in vec2 v_uv;uniform sampler2D u_atlas;out vec4 color;void main(){color=texture(u_atlas,v_uv);if(color.a<.015)discard;}');
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const buffer=gl.createBuffer(),texture=gl.createTexture(),vertices=new Float32Array(180000);let cursor=0;
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const position=gl.getAttribLocation(program,'a_pos'),uv=gl.getAttribLocation(program,'a_uv');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas.canvas);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
    const camera=gl.getUniformLocation(program,'u_camera'),screen=gl.getUniformLocation(program,'u_screen');
    backend={name:'webgl2',start(){
      cursor=0;gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform4f(camera,view.centerX,view.centerY,view.scale*view.zoom,0);gl.uniform4f(screen,view.width,view.height,view.panX,view.panY);
    },face(a,b,c,name){
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
      const [a,b,c]=[a3,b3,c3].map(worldToScreen),d=[b[0]+c[0]-a[0],b[1]+c[1]-a[1]],dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
      if(Math.abs(det)<1e-8)return;
      const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0],d[0]))),maxX=Math.min(canvas.width-1,Math.ceil(Math.max(a[0],b[0],c[0],d[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1],d[1]))),maxY=Math.min(canvas.height-1,Math.ceil(Math.max(a[1],b[1],c[1],d[1]))),data=atlas.pixels.get(name);
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const px=x+.5-a[0],py=y+.5-a[1],u=(px*ey-py*ex)/det,v=(dx*py-dy*px)/det;if(u<0||u>=1||v<0||v>=1)continue;
        const depth=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]),index=y*canvas.width+x;if(depth<zbuffer[index])continue;
        const source=(Math.min(15,Math.floor(v*16))*16+Math.min(15,Math.floor(u*16)))*4,alpha=data[source+3]/255;if(alpha<.015)continue;
        const destination=index*4,old=output.data[destination+3]/255,combined=alpha+old*(1-alpha);
        for(let k=0;k<3;k++)output.data[destination+k]=(data[source+k]*alpha+output.data[destination+k]*old*(1-alpha))/combined;
        output.data[destination+3]=combined*255;zbuffer[index]=depth;
      }
    },cacheFloor(){cachedPixels=output.data.slice();cachedDepth=zbuffer.slice();lastRevision=revision;},finish(){ctx.putImageData(output,0,0);},dispose(){}};
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();view.width=Math.max(1,rect.width);view.height=Math.max(1,rect.height);view.dpr=backend.name==='cpu'?1:Math.min(devicePixelRatio||1,2);
    if(initialView){view.zoom=view.width<700?2.65:1;initialView=false;}
    canvas.width=Math.round(view.width*view.dpr);canvas.height=Math.round(view.height*view.dpr);labelCanvas.width=canvas.width;labelCanvas.height=canvas.height;
    view.scale=Math.min(view.width*.9/(box.maxX-box.minX),view.height*.78/(box.maxY-box.minY));revision++;
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function draw(strokes,energy){
    if(lastDraw===revision&&!strokes.some((v,i)=>Math.abs(v-lastStrokes[i])>.00008)&&!energy.some((v,i)=>Math.abs(v-lastEnergy[i])>.00008))return;
    const cached=backend.start();if(!cached){for(const f of floor)backend.face(f.a,f.b,f.c,f.tile);backend.cacheFloor?.();}
    for(let i=0;i<COUNT;i++){
      for(const p of machineParts(strokes[i],i*PITCH))facesForBox(p,backend.face);
      if(energy[i]>.001){const x=i*PITCH-1.05;backend.face([x,-.023,2.43],[x+3.1*energy[i],-.023,2.43],[x,-.023,2.48],i<6?'low':i<11?'mid':'high');}
    }
    backend.finish();
    labels.setTransform(view.dpr,0,0,view.dpr,0,0);labels.clearRect(0,0,view.width,view.height);
    labels.textAlign='center';labels.font=(view.scale*view.zoom<7?'7':'10')+'px ui-monospace,Consolas,monospace';
    for(let i=0;i<COUNT;i++){
      const [x,y]=worldToScreen([i*PITCH+.4,-.02,2.9]);
      if(x<0||x>view.width||y<0||y>view.height)continue;
      labels.fillStyle=i<6?'#d2aa7f':i<11?'#b7c29c':'#91b0ad';labels.globalAlpha=.55+.45*energy[i];labels.fillText(String(i+1).padStart(2,'0'),x,y+10);
    }
    labels.globalAlpha=1;
    lastStrokes.set(strokes);lastEnergy.set(energy);lastDraw=revision;
  }
  return {backend:backend.name,draw,worldToScreen,get zoom(){return view.zoom;},
    setZoom(value){view.zoom=clamp(value,.65,8);revision++;},
    pan(dx,dy){view.panX+=dx;view.panY+=dy;revision++;},
    reset(){view.zoom=1;view.panX=view.panY=0;view.centerX=(box.minX+box.maxX)/2;view.centerY=(box.minY+box.maxY)/2;revision++;},
    detail(){view.zoom=view.width<700?2.65:1.8;view.panX=view.panY=0;view.centerX=(box.minX+box.maxX)/2;view.centerY=(box.minY+box.maxY)/2;revision++;},
    focus(index){const p=projectPoint([index*PITCH+.4,1.3,.5]);view.zoom=4;view.panX=view.panY=0;view.centerX=p[0];view.centerY=p[1];revision++;},
    dispose(){observer.disconnect();backend.dispose();}
  };
}
