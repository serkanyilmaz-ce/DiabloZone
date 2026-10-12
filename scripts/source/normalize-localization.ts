import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readableTooltip} from '../../src/lib/tooltip.js';
import {canonical} from '../db/catalog.js';
const input=process.argv[2]??'output/localization/original/strings.json';
const original=JSON.parse(await readFile(input,'utf8'));
if(original.source!=='local-read-only-CASC'||!/^\d+\.\d+\.\d+\.\d+$/.test(original.sourceVersion))throw new Error('Exact original locale source required');
const metadata=JSON.parse(await readFile('data/generated/metadata.json','utf8'));
const systems=JSON.parse(await readFile('data/generated/systems.json','utf8'));
const lookup=new Map<string,any[]>();
for(const row of original.translations){const rows=lookup.get(row.key)??[];rows.push(row);lookup.set(row.key,rows);}
const entries:any[]=[],excluded:any[]=[];
const normal=(s:string)=>s.replaceAll('\r\n','\n').trim();
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
for(const kind of ['skills','items','affixes','aspects','systems']){
  const json=JSON.parse(await readFile(`data/generated/${kind}.json`,'utf8'));
  for(const record of json.records??json){
    const key=`${kind}:${record.id}`,translations=lookup.get(key)??[],fields:Record<string,any>={};
    const mod=String(record.id).match(/:mod:(\d+)/);
    const labels={name:mod?[`mod${mod[1]}_name`]:['name'],description:mod?[`mod${mod[1]}_description`]:['desc','description','codexdesc'],flavor:['flavor']};
    for(const field of ['name','description','flavor'] as const){
      const baseline=field==='description'?record.descriptionTemplate:record[field];if(!baseline)continue;
      const translation=translations.find(row=>labels[field].includes(row.label.toLowerCase()));if(!translation)continue;
      const baselineText=field==='description'?normal(baseline):readableTooltip(baseline);
      const originalText=field==='description'?normal(translation.en):readableTooltip(translation.en);
      if(baselineText!==originalText){excluded.push({key,field,reason:'English text differs across data and locale builds'});continue;}
      fields[field]={en:readableTooltip(translation.en),tr:readableTooltip(translation.tr),rawEnglishSha256:sha(normal(translation.en)),rawTurkishSha256:sha(normal(translation.tr)),sourceLabel:translation.label,tableSno:translation.tableSno,compatibility:'same-english-text'};
    }
    if(Object.keys(fields).length)entries.push({key,fields});
  }
}
entries.sort((a,b)=>a.key.localeCompare(b.key));
const context={source:'local-read-only-CASC',sourceVersion:original.sourceVersion,dataSourceVersion:metadata.sourceVersion,gameSnapshotId:metadata.snapshotId,systemArchiveId:systems.archiveId,buildInfoSha256:original.buildInfoSha256,extractorCommit:original.extractorCommit,rawExportSha256:sha(await readFile(input,'utf8')),locale:'tr',comparison:'Exact normalized English baseline match; no mathematical evaluation'};
const bundle={...context,entries,inputSha256:sha(canonical({context,entries}))};
await mkdir('output/localization',{recursive:true});await writeFile('output/localization/staging.json',JSON.stringify(bundle,null,2)+'\n');
const coverage={...context,inputSha256:bundle.inputSha256,records:entries.length,fields:entries.reduce((n,r)=>n+Object.keys(r.fields).length,0),skills:entries.filter(r=>r.key.startsWith('skills:')).length,skillDescriptions:entries.filter(r=>r.key.startsWith('skills:')&&r.fields.description).length,excludedFields:excluded.length,excluded};
await writeFile('data/research/localization-coverage.json',JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({...coverage,excluded:undefined}));
