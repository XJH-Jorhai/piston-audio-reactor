import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES,siteRoot,routeMode,routeUrl} from '../src/routes.js';

test('all three entry points resolve a shared deployment root, including nested local previews',()=>{
  for(const base of ['https://example.com/piston-audio-reactor/','http://127.0.0.1:4192/.test-results/continuous-site/']){
    for(const [mode,path] of Object.entries(ROUTES)){
      const moduleUrl=new URL(path+'src/bootstrap.js',base);
      assert.equal(siteRoot(moduleUrl).href,base);
      assert.equal(routeMode(new URL(path+'?count=64',base),base),mode);
    }
    assert.equal(routeMode('https://unrelated.com/',base),null);
    assert.equal(routeMode(new URL('experiments/linear-legacy/',base),base),null);
  }
});

test('mode links preserve channel count and CPU backend without carrying another layouts preset',()=>{
  const root=new URL('https://example.com/project/');
  for(const mode of Object.keys(ROUTES)){
    const url=routeUrl(mode,root,{count:64,renderer:'cpu'});
    assert.equal(routeMode(url,root),mode);assert.equal(url.searchParams.get('count'),'64');assert.equal(url.searchParams.get('renderer'),'cpu');
    assert.equal(url.searchParams.has('preset'),false);assert.equal(url.searchParams.has('view'),false);
  }
  assert.equal(routeUrl('lying',root,{count:65}).searchParams.has('count'),false);
  assert.throws(()=>routeUrl('other',root));
});
