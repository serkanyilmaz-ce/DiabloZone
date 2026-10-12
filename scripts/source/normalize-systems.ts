import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pinnedSource,rawFormulas,sourceSlug,positiveHandle} from './pinned.js';
import {getString} from '../import-d4data/string-list.js';
import {SystemBundleSchema,systemKinds,type SystemRecord} from '../../schemas/systems.js';
import {systemBundle} from '../db/system-bundle.js';
const target=path.resolve(process.argv[3]??'output/system-staging.json');
if(target.startsWith(path.resolve('data/generated')+path.sep))throw new Error('Staging must precede database publication');
const {source,manifest,entries}=await pinnedSource(process.argv[2]);
const lookup=new Map([...entries.keys()].map(file=>[file.toLowerCase(),file]));
const tables=new Set(['AttributeFormulas','DataAttributes','DifficultyTiers','LevelScaling','MonsterLevelCurves','PlayerLevelBands','PowerFormulaTables','QualityClasses','SimpleScalarFormulas','StringFormulas','CharmLevelScaling']);
const records:SystemRecord[]=[];
function references(value:any,locator='$'):SystemRecord['references']{
  if(!value||typeof value!=='object')return [];
  if(typeof value.__raw__==='number'&&value.__raw__>0&&value.groupName){
    const file=typeof value.__targetFileName__==='string'?`json/${value.__targetFileName__}.json`:undefined;
    return [{path:locator,sno:value.__raw__,kind:value.groupName,name:value.name,file,resolution:file&&entries.has(file)?'pinned-reference':'unavailable'}];
  }
  return Object.entries(value).flatMap(([key,v])=>references(v,`${locator}.${key}`));
}
function icons(value:any,key=''):number[]{
  if(!value||typeof value!=='object')return /^hIcon(?:Mask)?$|^legendaryNodeIcon$/.test(key)&&positiveHandle(value)?[value]:[];
  if(key==='arIcons')return (value as unknown[]).filter(v=>positiveHandle(v)) as number[];
  return Object.entries(value).flatMap(([k,v])=>icons(v,k));
}
for(const kind of systemKinds){
  const files=[...entries.keys()].filter(file=>file.startsWith(`json/base/meta/${kind}/`)).sort();
  for(const file of files){
    const token=path.basename(file).replace(/\.[^.]+\.json$/,'');
    if(kind==='GameBalance'&&!tables.has(token))continue;
    const row=await source(file),id=String(row.value.__snoID__);
    const stringFile=lookup.get(`json/enUS_Text/meta/StringList/${kind}_${token}.stl.json`.toLowerCase());
    const localized=stringFile?await source(stringFile):undefined;
    records.push({id,kind,slug:sourceSlug(`${kind}-${token}`,id),name:localized?getString(localized.value,'name')??token:token,internalName:token,
      descriptionTemplate:localized?getString(localized.value,'desc','description'):undefined,source:row.ref,localizationSource:localized?.ref,
      rawData:row.value,rawFormulas:rawFormulas(row.value),iconHandles:[...new Set(icons(row.value))],references:references(row.value)});
  }
}
const indexed=new Map(records.map(r=>[r.kind+':'+r.id,r]));
for(const row of records)for(const ref of row.references){const found=indexed.get(ref.kind+':'+ref.sno);if(found){ref.resolution='archive';ref.targetSlug=found.slug;}}
await mkdir(path.dirname(target),{recursive:true});
await writeFile(target,JSON.stringify(SystemBundleSchema.parse({sourceVersion:manifest.version,sourceCommit:manifest.commit,season:15,channel:'live',records}),null,2)+'\n');
const {sha256}=await systemBundle(target);
console.log(JSON.stringify({file:target,inputSha256:sha256,counts:Object.fromEntries(systemKinds.map(kind=>[kind,records.filter(r=>r.kind===kind).length])),formulas:records.reduce((n,r)=>n+r.rawFormulas.length,0),unavailable:records.flatMap(r=>r.references).filter(r=>r.resolution==='unavailable').length}));
