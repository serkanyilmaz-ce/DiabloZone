import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {systemBundle} from '../scripts/db/system-bundle.js';
test('System seals survive JSONB ordering, reject tampering and reject broken links',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'diablozone-systems-'));
  const file=path.join(dir,'systems.json'),commit='a'.repeat(40);
  const row={id:'1',kind:'ParagonNode',slug:'node-1',name:'Node',internalName:'Node',source:{file:'json/base/meta/ParagonNode/Node.pgn.json',sno:1,commit,sha256:'b'.repeat(64),gitBlob:'c'.repeat(40)},iconHandles:[],rawFormulas:[],rawData:{b:2,a:1},references:[]};
  const bundle={sourceVersion:'3.2.1.73552',sourceCommit:commit,season:15,channel:'live',records:[row]};
  try{
    await writeFile(file,JSON.stringify(bundle));const first=await systemBundle(file);
    await writeFile(file,JSON.stringify({...bundle,inputSha256:first.sha256,records:[{...row,rawData:{a:1,b:2}}]}));assert.equal((await systemBundle(file)).sha256,first.sha256);
    await writeFile(file,JSON.stringify({...bundle,inputSha256:first.sha256,records:[{...row,name:'Changed'}]}));await assert.rejects(systemBundle(file),/seal mismatch/);
    await writeFile(file,JSON.stringify({...bundle,records:[{...row,references:[{path:'$.node',sno:2,kind:'ParagonNode',targetSlug:'node-2',resolution:'archive'}]}]}));await assert.rejects(systemBundle(file),/Broken system link/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
