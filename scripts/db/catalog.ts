import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { SkillSchema,ItemSchema,AspectSchema,AffixSchema,ClassSchema,TreeRecordSchema } from '../../schemas/domain.js';

export const catalogSchemas={skills:SkillSchema,items:ItemSchema,aspects:AspectSchema,affixes:AffixSchema,classes:ClassSchema,'skill-tree':TreeRecordSchema};
export type CatalogKind=keyof typeof catalogSchemas;
export interface CatalogLink {sourceKind:CatalogKind;sourceId:string;targetKind:CatalogKind;targetId:string;relation:string}
export function canonical(value:unknown):string {
  if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,entry])=>`${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  return JSON.stringify(value);
}
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');

export async function loadCatalog(directory='data/generated') {
  const metadata=JSON.parse(await readFile(path.join(directory,'metadata.json'),'utf8'));
  if(!/^\d+$/.test(metadata.gameBuild??'') || !metadata.sourceVersion || !['live','ptr'].includes(metadata.channel) || !Number.isInteger(metadata.season)) throw new Error('Exact source/build/season/channel required');
  if(metadata.sourceVersion!==`${metadata.patch}.${metadata.gameBuild}`) throw new Error('Source version and build context mismatch');
  const files=await Promise.all(Object.entries(catalogSchemas).map(async([kind,schema])=>{
    const file=path.join(directory,`${kind}.json`);
    const raw=await readFile(file,'utf8');
    const value=JSON.parse(raw);
    const records=z.array(schema).parse(kind==='skill-tree'?Object.values(value.classes):value).sort((a,b)=>a.id.localeCompare(b.id));
    if(records.some(record=>record.patch!==metadata.sourceVersion || String(record.source.sno)!==record.id.split(':')[0] || !record.source.sha256 || record.source.commit!==metadata.sourceCommit)) throw new Error('Record identity, provenance or build mismatch');
    if(new Set(records.map(record=>record.id)).size!==records.length || new Set(records.map(record=>'slug' in record?record.slug:record.id)).size!==records.length) throw new Error('Duplicate catalogue identity or route');
    return {kind:kind as CatalogKind,records,sha256:digest(records),rawSha256:createHash('sha256').update(raw).digest('hex')};
  }));
  if(!files.some(file=>file.records.length)) throw new Error('Empty game archive cannot be published');
  const records=new Map(files.map(file=>[file.kind,new Map(file.records.map(record=>[record.id,record]))]));
  const links:CatalogLink[]=[];
  function link(sourceKind:CatalogKind,sourceId:string,targetKind:CatalogKind,targetId:string,relation:string){
    if(!records.get(sourceKind)?.has(sourceId)||!records.get(targetKind)?.has(targetId)) throw new Error(`Unresolved catalogue relationship ${sourceKind}:${sourceId} -> ${targetKind}:${targetId}`);
    if(!links.some(value=>value.sourceKind===sourceKind&&value.sourceId===sourceId&&value.targetKind===targetKind&&value.targetId===targetId&&value.relation===relation))links.push({sourceKind,sourceId,targetKind,targetId,relation});
  }
  for(const skill of records.get('skills')!.values()){
    if('classId' in skill&&skill.classId)link('classes',skill.classId,'skills',skill.id,'class_skill');
    if('parentId' in skill&&skill.parentId)link('skills',skill.parentId,'skills',skill.id,'skill_modifier');
  }
  for(const item of records.get('items')!.values())if('affixIds' in item)for(const id of item.affixIds)link('items',item.id,'affixes',id,'item_affix');
  for(const aspect of records.get('aspects')!.values())if('affixId' in aspect&&aspect.affixId)link('aspects',aspect.id,'affixes',aspect.affixId,'aspect_affix');
  for(const tree of records.get('skill-tree')!.values())if('nodes' in tree){
    link('skill-tree',tree.id,'classes',tree.classId,'tree_class');
    for(const node of tree.nodes)if(node.skillId)link('skill-tree',tree.id,'skills',node.skillId,'tree_skill');
  }
  const sources=new Map<string,{file:string;sha256:string;commit:string;sno:string|number|undefined}>();
  for(const file of files)for(const record of file.records){
    for(const field of ['source','localizationSource','affixSource'] as const){
      const ref=(record as Record<string,any>)[field];
      if(!ref)continue;
      if(!ref.sha256||ref.commit!==metadata.sourceCommit)throw new Error('Unsealed source reference');
      const existing=sources.get(ref.file);if(existing&&existing.sha256!==ref.sha256)throw new Error('Conflicting source hashes');
      sources.set(ref.file,{file:ref.file,sha256:ref.sha256,commit:ref.commit,sno:ref.sno});
    }
  }
  const evidence=JSON.parse(await readFile(path.join(directory,'provenance.json'),'utf8'));
  if(evidence.sourceCommit!==metadata.sourceCommit||evidence.sourceVersion!==metadata.sourceVersion||!Array.isArray(evidence.files))throw new Error('Provenance context mismatch');
  for(const source of evidence.files){
    if(!/^json\//.test(source.file)||source.file.includes('..')||! /^[a-f0-9]{64}$/.test(source.sha256)||source.commit!==metadata.sourceCommit)throw new Error('Invalid provenance entry');
    const existing=sources.get(source.file);if(existing&&existing.sha256!==source.sha256)throw new Error('Conflicting provenance entry');
    sources.set(source.file,{file:source.file,sha256:source.sha256,commit:source.commit,sno:source.sno});
  }
  const provenance=[...sources.values()].sort((a,b)=>a.file.localeCompare(b.file));
  const context={gameBuild:metadata.gameBuild,sourceVersion:metadata.sourceVersion,patch:metadata.patch,season:metadata.season,channel:metadata.channel,sourceCommit:metadata.sourceCommit,sample:metadata.sample===true};
  const inputSha256=digest({context,files:files.map(file=>({kind:file.kind,sha256:file.sha256})),provenance});
  if(metadata.inputSha256&&metadata.inputSha256!==inputSha256)throw new Error('Export seal differs from catalogue content');
  return {metadata,files,links,provenance,inputSha256,context};
}
