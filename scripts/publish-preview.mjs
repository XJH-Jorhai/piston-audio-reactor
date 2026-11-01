import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const input=option('--source'),slug=option('--slug');
if(!input||!slug||!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug))throw Error('Use --source <experiment-worktree> --slug <route-name>.');
const source=await fs.realpath(path.resolve(root,input));
const git=(cwd,...values)=>execFileSync('git',values,{cwd,encoding:'utf8'}).trim();
const common=async directory=>fs.realpath(path.resolve(directory,git(directory,'rev-parse','--git-common-dir')));
if(await common(root)!==await common(source))throw Error('Source must be a worktree of this repository.');
if(source===root)throw Error('Source must be a separate experiment worktree.');
if(git(root,'branch','--show-current')!=='main')throw Error('Publish previews from the main worktree.');
const branch=git(source,'branch','--show-current');
if(!branch.startsWith('experiment/'))throw Error('Source must be an experiment/* branch.');
if(git(source,'status','--porcelain'))throw Error('Commit source changes before creating a preview snapshot.');
const commit=git(source,'rev-parse','HEAD'),baseTag='v0.1.0-linear';
if(git(root,'status','--porcelain','--','experiments/'+slug))throw Error('Commit or revert the existing preview changes first.');
execFileSync(process.execPath,['scripts/build.mjs'],{cwd:source,stdio:'inherit'});
const previewRoot=path.resolve(root,'experiments'),target=path.resolve(previewRoot,slug);
if(!target.startsWith(previewRoot+path.sep))throw Error('Preview destination must remain inside experiments/.');
await fs.mkdir(previewRoot,{recursive:true});
const existing=await fs.lstat(target).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
if(existing?.isSymbolicLink())throw Error('Preview destination cannot be a symbolic link.');
if(existing)await fs.rm(target,{recursive:true,force:true});
await fs.mkdir(target,{recursive:true});
// Copy only the route itself, never nested preview catalogs from its source.
for(const name of ['index.html','README.md','CREDITS.md','.nojekyll','src','assets','licenses']){
  await fs.cp(path.join(source,'dist',name),path.join(target,name),{recursive:true});
}
await fs.writeFile(path.join(target,'preview.json'),JSON.stringify({branch,commit,baseTag,url:'https://xjh-jorhai.github.io/piston-audio-reactor/experiments/'+slug+'/'},null,2)+'\n');
console.log(JSON.stringify({branch,commit,target}));
