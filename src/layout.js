export const LAYOUT='lying';
export const IS_LYING=LAYOUT==='lying';
export const DEFAULT_COUNT=IS_LYING?8:16;
export const STATION_PITCH=IS_LYING?3.5:3.9;
export const SHOW_DEVELOPER=!IS_LYING;
export const placePoint=([x,y,z],offset=0)=>IS_LYING?[x,z,offset-y]:[x+offset,y,z];
export const centerForCount=count=>IS_LYING?[.5,.5,((count-1)*STATION_PITCH-3)/2]:[(count-1)*STATION_PITCH/2+.5,1.5,.5];
export const centerForStation=index=>IS_LYING?[.5,.5,index*STATION_PITCH-1.5]:[index*STATION_PITCH+.5,1.5,.5];
export const sceneDescription=count=>IS_LYING?count+' 台横卧开凿机组成三条平行轨道；中央躯干升降，两侧手臂反向联动。':count+' 台站立开凿机线性排列；躯干前后伸缩，两侧手臂反向联动。';
