import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),out=path.join(root,'dist');
await fs.mkdir(out,{recursive:true});
for(const file of ['index.html','README.md','CREDITS.md','.nojekyll'])await fs.copyFile(path.join(root,file),path.join(out,file));
for(const dir of ['src','assets','licenses'])await fs.cp(path.join(root,dir),path.join(out,dir),{recursive:true});
try{await fs.cp(path.join(root,'experiments'),path.join(out,'experiments'),{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}

await fs.cp(path.join(root,'player'),path.join(out,'player'),{recursive:true});

console.log('Built static site with music player: '+out);
