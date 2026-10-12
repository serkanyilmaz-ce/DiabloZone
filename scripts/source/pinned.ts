import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { z } from 'zod';
import type { SourceRefSchema } from '../../schemas/domain.js';

export type SourceRef=z.infer<typeof SourceRefSchema>;
export async function pinnedSource(directory='.tmp/d4data'){
  const root=path.resolve(directory);
  const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
  const git=(args:string[])=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status)throw new Error('Pinned Git read failed');return r.stdout.trim();};
  if(git(['rev-parse','HEAD'])!==manifest.commit||git(['status','--porcelain']))throw new Error('Clean pinned source checkout required');
  if(git(['show',`${manifest.commit}:buildVersion.txt`])!==manifest.version)throw new Error('Pinned build mismatch');
  const inventory=JSON.parse(await readFile(`.tmp/source-evidence/${manifest.commit}-inventory.json`,'utf8'));
  if(inventory.commit!==manifest.commit)throw new Error('Source inventory commit mismatch');
  const entries=new Map<string,{file:string;gitBlob:string}>(inventory.entries.map((e:any)=>[e.file,e]));
  const provenance=new Map<string,SourceRef>();
  const cache=new Map<string,{value:any;ref:SourceRef}>();
  async function source(file:string){
    if(cache.has(file))return cache.get(file)!;
    if(!file.startsWith('json/')||file.includes('..')||file.includes('\\'))throw new Error('Unsafe source file');
    const entry=entries.get(file);if(!entry)throw new Error(`File not in pinned inventory: ${file}`);
    const canonical=(await readFile(path.join(root,file),'utf8')).replaceAll('\r\n','\n');
    const buffer=Buffer.from(canonical);
    const blob=createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
    if(blob!==entry.gitBlob)throw new Error(`Pinned Git blob mismatch: ${file}`);
    const value=JSON.parse(canonical);
    const ref={file,sno:value.__snoID__,gitBlob:blob,sha256:createHash('sha256').update(buffer).digest('hex'),commit:manifest.commit};
    const result={value,ref};provenance.set(file,ref);cache.set(file,result);return result;
  }
  return {root,manifest,entries,provenance,source};
}
export function rawFormulas(value:any,locator='$'):Array<{path:string;expression:string}>{
  if(!value||typeof value!=='object')return [];
  if(typeof value.value==='string'&&typeof value.compiled==='string')return [{path:locator,expression:value.value}];
  return Object.entries(value).flatMap(([key,entry])=>rawFormulas(entry,`${locator}.${key}`));
}
export const sourceSlug=(name:string,id:string)=>`${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${id.replaceAll(':','-')}`;
export const positiveHandle=(value:unknown)=>typeof value==='number'&&Number.isInteger(value)&&value>0?value:undefined;
