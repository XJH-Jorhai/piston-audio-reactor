/** The media element and Web Audio graph outlive every visualizer mount. */
export function createAudioSession(audio,{AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext,urls=globalThis.URL}={}){
  let graph,objectUrl;
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
      audio.pause();const next=urls.createObjectURL(file),previous=objectUrl;
      objectUrl=next;audio.src=next;audio.load();if(previous)urls.revokeObjectURL(previous);
    }
  };
}
