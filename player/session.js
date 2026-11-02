/** The media element and Web Audio graph outlive every visualizer mount. */
export function createAudioSession(audio,{AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext,urls=globalThis.URL}={}){
  let graph,objectUrl;
  function replaceSource(source,nextObjectUrl){
    audio.pause();const previous=objectUrl;
    objectUrl=nextObjectUrl;audio.src=source;audio.load();if(previous)urls.revokeObjectURL(previous);
  }
  return {
    audio,
    get hasGraph(){return !!graph;},
    graph(){
      if(!graph){
        if(!AudioContextClass)throw Error('当前浏览器不支持 Web Audio 音频分析，请使用新版浏览器。');
        const context=new AudioContextClass(),analyser=context.createAnalyser();
        analyser.fftSize=4096;analyser.smoothingTimeConstant=.12;
        const source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);
        graph={context,analyser};
      }
      return graph;
    },
    replaceFile(file){
      const next=urls.createObjectURL(file);replaceSource(next,next);
    },
    replaceTrack(source){replaceSource(source,null);},
    dispose(){audio.pause();if(objectUrl){urls.revokeObjectURL(objectUrl);objectUrl=null;}}
  };
}
