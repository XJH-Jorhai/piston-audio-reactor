export const ROUTES=Object.freeze({linear:'',lying:'experiments/lying-eight/',corridor:'experiments/perspective-corridor/'});
export const CONTINUITY_BUILD='continuous-1';
export function siteRoot(moduleUrl){
  const root=new URL('../',moduleUrl);
  root.pathname=root.pathname.replace(/experiments\/(?:lying-eight|perspective-corridor)\/$/,'');
  root.search='';root.hash='';return root;
}
export function routeMode(url,root){
  const page=new URL(url),base=new URL(root);
  if(page.origin!==base.origin)return null;
  return Object.keys(ROUTES).find(mode=>page.pathname===new URL(ROUTES[mode],base).pathname)??null;
}
export function routeUrl(mode,root,{count,renderer}={}){
  if(!Object.hasOwn(ROUTES,mode))throw new RangeError('Unknown visualizer route.');
  const url=new URL(ROUTES[mode],root);
  if(Number.isInteger(count)&&count>=4&&count<=64)url.searchParams.set('count',count);
  if(renderer==='cpu')url.searchParams.set('renderer','cpu');
  url.searchParams.set('v',CONTINUITY_BUILD);return url;
}
