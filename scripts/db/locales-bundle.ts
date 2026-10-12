import {readFile} from 'node:fs/promises';
import {z} from 'zod';
import {digest} from './catalog.js';
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const field=z.object({en:z.string(),tr:z.string(),rawEnglishSha256:hash,rawTurkishSha256:hash,sourceLabel:z.string(),tableSno:z.number().int().positive(),compatibility:z.literal('same-english-text')});
const schema=z.object({source:z.literal('local-read-only-CASC'),sourceVersion:z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),dataSourceVersion:z.string(),gameSnapshotId:z.uuid(),systemArchiveId:z.uuid(),buildInfoSha256:hash,extractorCommit:z.string().regex(/^[a-f0-9]{40}$/),rawExportSha256:hash,locale:z.literal('tr'),comparison:z.string(),entries:z.array(z.object({key:z.string().regex(/^(skills|items|affixes|aspects|systems):\d+(:mod:\d+)?$/),fields:z.object({name:field.optional(),description:field.optional(),flavor:field.optional()})})),inputSha256:hash,localeSetId:z.uuid().optional(),storageSource:z.literal('DiabloZone PostgreSQL').optional()});
export async function localeBundle(file:string){
  const bundle=schema.parse(JSON.parse(await readFile(file,'utf8')));
  const {entries,inputSha256}=bundle;
  const context={source:bundle.source,sourceVersion:bundle.sourceVersion,dataSourceVersion:bundle.dataSourceVersion,gameSnapshotId:bundle.gameSnapshotId,systemArchiveId:bundle.systemArchiveId,buildInfoSha256:bundle.buildInfoSha256,extractorCommit:bundle.extractorCommit,rawExportSha256:bundle.rawExportSha256,locale:bundle.locale,comparison:bundle.comparison};
  entries.sort((a,b)=>a.key.localeCompare(b.key));
  if(!entries.length||new Set(entries.map(r=>r.key)).size!==entries.length||entries.some(r=>!Object.keys(r.fields).length))throw new Error('Empty or duplicate locale records');
  if(digest({context,entries})!==inputSha256)throw new Error('Localization seal mismatch');
  return {bundle,context,entries,inputSha256};
}
