/** Bundled demo assets only. Visitor-selected files never enter this catalog. */
export const DEMO_TRACKS=Object.freeze([
  Object.freeze({id:'assumptions',title:'Assumptions',artist:'Sam Gellaitry',album:'IV',
    audio:new URL('./assets/audio/sam-gellaitry-assumptions.mp3',import.meta.url).href,
    cover:new URL('./assets/artwork/assumptions.jpg',import.meta.url).href,lyrics:''})
]);
