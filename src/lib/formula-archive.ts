import {createHash} from 'node:crypto';
import {skills,affixes,metadata} from './data';
import {systems,systemArchive} from './systems';
import {parseExpression} from './expression';
const groups=[{kind:'skills',records:skills},{kind:'affixes',records:affixes},{kind:'systems',records:systems}];
if(systemArchive&&systemArchive.sourceVersion!==metadata.sourceVersion)throw new Error('Formula archive cannot combine different source builds');
export const formulaRecords=groups.flatMap(group=>group.records.flatMap(record=>record.rawFormulas.filter(f=>f.expression.trim()).map(formula=>{
  let symbols:string[]=[],status='supported',reason='';try{symbols=parseExpression(formula.expression).symbols;}catch(error){status='unsupported';reason=(error as Error).message;}
  const name=('name' in record?record.name:undefined)??('internalName' in record?record.internalName:record.id);
  return {key:createHash('sha256').update(`${group.kind}:${record.id}:${formula.path}`).digest('hex'),name,kind:group.kind,slug:record.slug,id:record.id,...formula,source:record.source,symbols,status,reason};
})));
export function formulaManifest(){
  const owners:Array<{name:string|undefined;kind:string;slug:string|undefined;id:string;source:typeof formulaRecords[number]['source']}>=[];
  const indexes=new Map<string,number>();
  const records=formulaRecords.map(({key,name,kind,slug,id,source,path,expression,symbols,status,reason})=>{
    const identity=kind+':'+id;let owner=indexes.get(identity);
    if(owner===undefined){owner=owners.length;indexes.set(identity,owner);owners.push({name,kind,slug,id,source});}
    return {key,owner,path,expression,symbols,status,reason};
  });
  return {schemaVersion:2,gameSnapshot:metadata.snapshotId,systemArchive:systemArchive?.archiveId,sourceVersion:metadata.sourceVersion,owners,records};
}
