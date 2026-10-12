import { mkdir,copyFile,rename } from 'node:fs/promises';
import path from 'node:path';
import { loadCatalog } from './catalog.js';
import { isUuid } from '../../src/lib/api-query.js';

const directory=process.argv[2];
if(!directory)throw new Error('Usage: db:promote output/snapshots/<uuid>');
const checked=await loadCatalog(directory);
if(!isUuid(checked.metadata.snapshotId??'')||checked.metadata.source!=='DiabloZone PostgreSQL'||!checked.metadata.inputSha256)throw new Error('Only a sealed published PostgreSQL export can become the static catalogue');
const target=path.resolve('data/generated');await mkdir(target,{recursive:true});
const names=['skills','items','aspects','affixes','classes','skill-tree','provenance','sources','links','metadata'];
for(const name of names){
  const temporary=path.join(target,`${name}.next.json`);
  await copyFile(path.join(directory,`${name}.json`),temporary);
  await rename(temporary,path.join(target,`${name}.json`));
}
const promoted=await loadCatalog(target);
if(promoted.inputSha256!==checked.inputSha256)throw new Error('Promotion seal mismatch');
console.log(JSON.stringify({snapshotId:promoted.metadata.snapshotId,inputSha256:promoted.inputSha256,records:promoted.files.reduce((sum,file)=>sum+file.records.length,0),links:promoted.links.length,promoted:true}));
