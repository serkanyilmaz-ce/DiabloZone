import {readFile} from 'node:fs/promises';
import {SystemBundleSchema} from '../../schemas/systems.js';
import {digest} from './catalog.js';
export async function systemBundle(file:string){
  const bundle=SystemBundleSchema.parse(JSON.parse(await readFile(file,'utf8')));
  bundle.records.sort((a,b)=>a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id));
  const keys=new Set<string>(),slugs=new Set<string>();
  for(const row of bundle.records){
    if(String(row.source.sno)!==row.id||row.source.commit!==bundle.sourceCommit||!row.source.sha256||!row.source.gitBlob)throw new Error('Unsealed system source');
    if(row.localizationSource&&(row.localizationSource.commit!==bundle.sourceCommit||!row.localizationSource.sha256))throw new Error('Unsealed localization source');
    const key=row.kind+':'+row.id;
    if(keys.has(key)||slugs.has(row.slug))throw new Error('Duplicate system identity');keys.add(key);slugs.add(row.slug);
  }
  for(const row of bundle.records)for(const ref of row.references)if(ref.resolution==='archive'&&!bundle.records.some(target=>target.kind===ref.kind&&target.id===String(ref.sno)&&target.slug===ref.targetSlug))throw new Error('Broken system link');
  const sealed={sourceVersion:bundle.sourceVersion,sourceCommit:bundle.sourceCommit,season:bundle.season,channel:bundle.channel,records:bundle.records};
  const sha256=digest(sealed);
  if(bundle.inputSha256&&bundle.inputSha256!==sha256)throw new Error('System export seal mismatch');
  return {bundle,sealed,sha256};
}
