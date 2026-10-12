import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { SkillSchema,ItemSchema,AspectSchema,AffixSchema,ClassSchema,TreeRecordSchema,type Skill,type SourceRefSchema } from '../../schemas/domain.js';
import { getString,cleanTooltipText } from '../import-d4data/string-list.js';
import { loadCatalog } from '../db/catalog.js';
import type { z } from 'zod';

const root=path.resolve(process.argv[2]??'.tmp/d4data');
const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
const commit=manifest.commit;
const git=(args:string[])=>{
  const result=spawnSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:32*1024*1024});
  if(result.status!==0)throw new Error('Pinned source read failed');return result.stdout;
};
if(git(['rev-parse','HEAD']).trim()!==commit||git(['status','--porcelain']).trim())throw new Error('Source checkout is not the sealed clean commit');
const version=git(['show',`${commit}:buildVersion.txt`]).trim();
if(version!==manifest.version)throw new Error('Source manifest differs from source build');
const provenance=new Map<string,z.infer<typeof SourceRefSchema>>();
async function source(file:string){
  if(file.includes('..')||!file.startsWith('json/'))throw new Error('Unsafe source locator');
  const canonical=git(['show',`${commit}:${file}`]);
  const local=await readFile(path.join(root,file),'utf8');
  if(local.replaceAll('\r\n','\n')!==canonical.replaceAll('\r\n','\n'))throw new Error(`Source was modified: ${file}`);
  const value=JSON.parse(canonical);
  const ref={file,sno:value.__snoID__,sha256:createHash('sha256').update(canonical).digest('hex'),gitBlob:git(['rev-parse',`${commit}:${file}`]).trim(),commit};
  provenance.set(file,ref);return {value,ref};
}
async function localization(prefix:string,name:string){return source(`json/enUS_Text/meta/StringList/${prefix}_${name}.stl.json`);}
function formulas(value:any,locator='$'):Array<{path:string;expression:string}>{
  if(!value||typeof value!=='object')return [];
  if(typeof value.value==='string'&&typeof value.compiled==='string')return [{path:locator,expression:value.value}];
  return Object.entries(value).flatMap(([key,entry])=>formulas(entry,`${locator}.${key}`));
}
const slug=(name:string,id:string)=>`${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${id.replaceAll(':','-')}`;
const cls=await source('json/base/meta/PlayerClass/Sorcerer.pcl.json');
const classId=String(cls.value.__snoID__);
const kit=await source(`json/${cls.value.snoSkillKit.__targetFileName__}.json`);
if(kit.value.__snoID__!==cls.value.snoSkillKit.__raw__)throw new Error('Class/kit source identity mismatch');
const rewardsSource=await source('json/base/meta/GameBalance/SkillTreeRewards.gam.json');
const rewards=new Map<string,any>(rewardsSource.value.ptData.flatMap((table:any)=>table.tEntries??[]).map((reward:any)=>[reward.tHeader.szName,reward]));
const skills:Skill[]=[];
const powers=new Map<number,{value:any;ref:z.infer<typeof SourceRefSchema>;strings:any;stringRef:z.infer<typeof SourceRefSchema>}>();
for(const internal of ['Sorcerer_Fireball','Sorcerer_FireBolt','Sorcerer_FlameShield']){
  const power=await source(`json/base/meta/Power/${internal}.pow.json`);
  const strings=await localization('Power',internal);
  if(power.value.bMustBeLearned!==true||power.value.snoClassRequirement?.__raw__!==cls.value.__snoID__)throw new Error('Skill is not a source-confirmed learnable class skill');
  const id=String(power.value.__snoID__),name=getString(strings.value,'name');
  if(!name)throw new Error('Missing skill source name');
  const category=String(power.value.tPrimaryTag?.gbidSkillTag?.name??'').replace(/^Skill_Primary_/,'').toLowerCase();
  skills.push(SkillSchema.parse({id,slug:slug(name,id),name,class:'sorcerer',classId,category,type:power.value.bIsPassive?'passive':'active',
    description:cleanTooltipText(getString(strings.value,'desc')),descriptionTemplate:getString(strings.value,'desc'),
    tags:(power.value.arSkillTags??[]).filter((tag:any)=>!tag.bSearchOnly).map((tag:any)=>tag.gbidSkillTag?.name).filter(Boolean),
    source:power.ref,localizationSource:strings.ref,patch:version,rawFormulas:formulas(power.value),
  }));
  powers.set(power.value.__snoID__,{...power,strings:strings.value,stringRef:strings.ref});
}
const nodes:any[]=[];
for(const node of kit.value.arNodes){
  const reward=rewards.get(node.gbidReward?.name);
  if(node.gbidReward&&!reward)throw new Error('Unresolved source reward');
  const sno=reward?.snoPower?.__raw__;
  if(reward&&!powers.has(sno))continue;
  const detail=powers.get(sno);
  let skill=skills.find(value=>value.id===String(sno));
  let kind=reward?(detail!.value.bIsPassive?'passive':'active'):(node.eRootNodeType===1?'hub':'gate');
  if(reward?.eType===1){
    const mod=detail!.value.arMods.find((value:any)=>value.szName===reward.szPowerMod);
    if(!mod)throw new Error('Unresolved source power modifier');
    const id=`${sno}:mod:${mod.dwModId}`,name=getString(detail!.strings,`Mod${mod.dwModId}_Name`);
    if(!name)throw new Error('Missing modifier localization');
    skill=skills.find(value=>value.id===id);
    if(!skill){
      skill=SkillSchema.parse({id,slug:slug(name,id),name,class:'sorcerer',classId,parentId:String(sno),type:'modifier',category:skills.find(value=>value.id===String(sno))?.category,
        description:cleanTooltipText(getString(detail!.strings,`Mod${mod.dwModId}_Description`)),descriptionTemplate:getString(detail!.strings,`Mod${mod.dwModId}_Description`),
        maxRank:reward.dwMaxTalentRanks>0?reward.dwMaxTalentRanks:undefined,source:detail!.ref,localizationSource:detail!.stringRef,patch:version,rawFormulas:formulas(mod)});
      skills.push(skill);
    }
    kind='modifier';
  }else if(skill&&reward.dwMaxTalentRanks>0)skill.maxRank=reward.dwMaxTalentRanks;
  nodes.push({id:node.dwID,x:node.vPosition.x,y:node.vPosition.y,kind,
    name:skill?.name??(kind==='hub'?'Yetenek kümesi':`Seviye ${node.dwNodeRequiredPlayerLevel}`),description:skill?.description,
    powerSno:sno,skillId:skill?.id,skillSlug:skill?.slug,category:skill?.category,maxRanks:reward?.dwMaxTalentRanks>0?reward.dwMaxTalentRanks:undefined,
    requiredLevel:node.dwNodeRequiredPlayerLevel,exclusiveGroup:node.nExclusiveGroupId>=0?node.nExclusiveGroupId:undefined,rewardName:node.gbidReward?.name,
  });
}
const nodeIds=new Set(nodes.map(node=>node.id));
const edges=kit.value.arConnections.filter((edge:any)=>nodeIds.has(edge.dwSourceId)&&nodeIds.has(edge.dwDestinationId)).map((edge:any)=>{
  const a=kit.value.arNodes[edge.nIndexNodeA],b=kit.value.arNodes[edge.nIndexNodeB];
  if(a?.dwID!==edge.dwSourceId||b?.dwID!==edge.dwDestinationId)throw new Error('Source tree edge identity mismatch');
  return {from:a.dwID,to:b.dwID,points:[a.vPosition,...edge.arCustomPathPositions,b.vPosition]};
});
const points=[...nodes,...edges.flatMap((edge:any)=>edge.points)];
const tree=TreeRecordSchema.parse({id:String(kit.value.__snoID__),slug:slug('Sorcerer',String(kit.value.__snoID__)),name:'Sorcerer',classCode:'sorcerer',classId,source:kit.ref,patch:version,
  scope:'excerpt',sourceNodeCount:kit.value.arNodes.length,sourceEdgeCount:kit.value.arConnections.length,nodes,edges,
  bounds:{minX:Math.min(...points.map((point:any)=>point.x)),minY:Math.min(...points.map((point:any)=>point.y)),maxX:Math.max(...points.map((point:any)=>point.x)),maxY:Math.max(...points.map((point:any)=>point.y))},
});
const item=await source('json/base/meta/Item/Helm_Unique_Generic_002.itm.json');
const itemStrings=await localization('Item','Helm_Unique_Generic_002');
const affixTargets=[...item.value.arForcedAffixes];
const aspect=await source('json/base/meta/Aspect/Asp_Legendary_Sorc_004.asp.json');
affixTargets.push(aspect.value.snoAffix);
const affixes:Array<z.infer<typeof AffixSchema>>=[];
for(const target of affixTargets){
  if(affixes.some(value=>value.id===String(target.__raw__)))continue;
  const affix=await source(`json/${target.__targetFileName__}.json`);
  if(affix.value.__snoID__!==target.__raw__)throw new Error('Affix reference identity mismatch');
  const stringsFile=`json/enUS_Text/meta/StringList/Affix_${target.name}.stl.json`;
  let strings:Awaited<ReturnType<typeof source>>|undefined;
  try {await readFile(path.join(root,stringsFile));strings=await source(stringsFile);}catch(error:any){if(error.code!=='ENOENT')throw error;}
  const id=String(affix.value.__snoID__),name=strings?getString(strings.value,'name'):undefined;
  affixes.push(AffixSchema.parse({id,slug:slug(name??target.name,id),internalName:target.name,name,
    description:strings?cleanTooltipText(getString(strings.value,'desc','codexdesc')):undefined,descriptionTemplate:strings?getString(strings.value,'desc','codexdesc'):undefined,
    staticValues:affix.value.arStaticValues??[],itemPowerMin:affix.value.nItemPowerMin,itemPowerMax:affix.value.nItemPowerMax,
    rawAllowedItemLabels:affix.value.arAllowedItemLabels??[],rawFormulas:formulas(affix.value),
    classId:affix.value.snoClassRequirement?.__raw__===cls.value.__snoID__?classId:undefined,
    tags:(affix.value.arAffixSkillTags??[]).map((value:any)=>value.name).filter(Boolean),source:affix.ref,localizationSource:strings?.ref,patch:version,
  }));
}
const affix=affixes.find(value=>value.id===String(aspect.value.snoAffix.__raw__))!;
const aspectName=affix.name;
if(!aspectName)throw new Error('Missing aspect source name');
const normalizedAspect=AspectSchema.parse({id:String(aspect.value.__snoID__),slug:slug(aspectName.replace(/^of\s+/i,''),String(aspect.value.__snoID__)),name:aspectName,
  category:'unknown',classId:affix.classId,classes:affix.classId?['sorcerer']:[],description:affix.description,descriptionTemplate:affix.descriptionTemplate,
  rawAllowedItemLabels:affix.rawAllowedItemLabels,tags:affix.tags,rawFormulas:affix.rawFormulas,affixId:affix.id,source:aspect.ref,affixSource:affix.source,localizationSource:affix.localizationSource,patch:version,
});
const itemName=getString(itemStrings.value,'name');if(!itemName)throw new Error('Missing item source name');
const normalizedItem=ItemSchema.parse({id:String(item.value.__snoID__),slug:slug(itemName,String(item.value.__snoID__)),name:itemName,
  rarity:item.value.snoSalvageTreasureClassMythic?'mythic':'unknown',slot:String(item.value.snoItemType?.name??'').toLowerCase(),classes:[],classRestrictionStatus:'unknown',
  affixIds:item.value.arForcedAffixes.map((value:any)=>String(value.__raw__)),flavor:getString(itemStrings.value,'flavor'),
  requiredLevel:item.value.nExplicitRequiredLevel>0?item.value.nExplicitRequiredLevel:undefined,fixedPowerLevel:item.value.nFixedIPowerLevel>0?item.value.nFixedIPowerLevel:undefined,
  source:item.ref,localizationSource:itemStrings.ref,patch:version,rawFormulas:formulas(item.value)});
const normalizedClass=ClassSchema.parse({id:classId,slug:slug('Sorcerer',classId),name:'Sorcerer',code:'sorcerer',skillKitId:tree.id,skillIds:skills.map(value=>value.id).sort(),source:cls.ref,patch:version,
  rawData:{primaryResource:cls.value.tPrimaryResource,secondaryResource:cls.value.tSecondaryResource,coreStatBenefits:cls.value.arCoreStatBenefit}});
const output='data/generated';await mkdir(output,{recursive:true});
const write=async(name:string,value:unknown)=>writeFile(`${output}/${name}.json`,JSON.stringify(value,null,2)+'\n');
for(const [name,records]of Object.entries({skills,items:[normalizedItem],aspects:[normalizedAspect],affixes,classes:[normalizedClass]}))await write(name,records.sort((a,b)=>a.id.localeCompare(b.id)));
await write('skill-tree',{gameBuild:manifest.build,classes:{sorcerer:tree}});
await write('metadata',{schemaVersion:2,source:'DiabloTools/d4data',sourceCommit:commit,sourceVersion:version,gameBuild:manifest.build,patch:manifest.patch,season:manifest.season,channel:'live',sample:true,phase:'F02',generatedAt:new Date().toISOString()});
await write('provenance',{sourceCommit:commit,sourceVersion:version,files:[...provenance.values()].sort((a,b)=>a.file.localeCompare(b.file))});
const checked=await loadCatalog(output);
console.log(JSON.stringify({version,files:checked.files.map(file=>({kind:file.kind,count:file.records.length})),links:checked.links.length,nodes:tree.nodes.length,sourceNodes:tree.sourceNodeCount,inputSha256:checked.inputSha256},null,2));
