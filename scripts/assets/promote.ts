import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pinnedSource} from '../source/pinned.js';

const directory=process.argv[2]??'output/assets-local/3.2.2.73764';
const report=JSON.parse(await readFile(path.join(directory,'report.json'),'utf8'));
if(report.source!=='local-read-only-CASC'||!/^\d+\.\d+\.\d+\.\d+$/.test(report.sourceVersion))throw new Error('Original local CASC asset report required');
const {source,manifest}=await pinnedSource();
const frames=new Map<number,any>();
for(const file of await readdir('.tmp/d4data/json/base/meta/Texture')){
  const {value,ref}=await source(`json/base/meta/Texture/${file}`);
  for(const frame of value.ptFrame??[])frames.set(frame.hImageHandle,{textureSno:value.__snoID__,source:ref,frame});
}
const assets=[];
const relative=`assets/game/${report.sourceVersion}`;await mkdir(`public/${relative}`,{recursive:true});
for(const row of report.assets){
  if(row.status!=='extracted'){assets.push(row);continue;}
  if(!/^\d+\.png$/.test(row.file)||! /^[a-f0-9]{64}$/.test(row.sha256))throw new Error('Unsafe original asset locator');
  const bytes=await readFile(path.join(directory,row.file));
  if(createHash('sha256').update(bytes).digest('hex')!==row.sha256||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Original PNG hash/signature mismatch');
  const evidence=frames.get(row.handle);
  const verified=evidence?.textureSno===row.atlasSno;
  const matching=verified&&['u0','v0','u1','v1'].every(k=>Math.abs(row.frame[k]-evidence.frame[`fl${k[0].toUpperCase()}${k[1]}`])<1e-6);
  const filename=`${row.handle}-${row.sha256}.png`;
  await copyFile(path.join(directory,row.file),`public/${relative}/${filename}`);
  assets.push({...row,path:`${relative}/${filename}`,sourceMetadata:evidence?.source,referenceStatus:matching?'same-handle-atlas-and-uv':'local-handle-only'});
}
let combined=assets;
if(process.argv[4]){
  const previous=JSON.parse(await readFile(process.argv[4],'utf8'));
  if(previous.sourceVersion!==report.sourceVersion||previous.buildInfoSha256!==report.buildInfoSha256||previous.dataSourceCommit!==manifest.commit)throw new Error('Cannot merge different original asset builds');
  const merged=new Map<number,any>(previous.assets.map((a:any)=>[a.handle,a]));
  for(const row of assets){const old=merged.get(row.handle);if(old?.status==='extracted'&&old.sha256!==row.sha256)throw new Error('Original frame changed within one build');merged.set(row.handle,row);}
  combined=[...merged.values()];
}
const output={...report,dataSourceVersion:manifest.version,dataSourceCommit:manifest.commit,requested:combined.length,assets:combined.sort((a,b)=>a.handle-b.handle)};
await writeFile(process.argv[3]??'data/research/assets-manifest.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({sourceVersion:report.sourceVersion,dataVersion:manifest.version,extracted:assets.filter(a=>a.status==='extracted').length,matchingSourceFrames:assets.filter(a=>a.referenceStatus==='same-handle-atlas-and-uv').length}));
