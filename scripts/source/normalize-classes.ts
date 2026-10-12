import { readFile,writeFile,mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ClassSchema,SkillSchema,TreeRecordSchema,type Skill,type GameClass,type TreeRecord } from '../../schemas/domain.js';
import { getString,cleanTooltipText } from '../import-d4data/string-list.js';
import { loadCatalog } from '../db/catalog.js';
import { pinnedSource,rawFormulas,sourceSlug,positiveHandle } from './pinned.js';

const output=path.resolve(process.argv[3]??'output/staging/f03');
if(output===path.resolve('data/generated'))throw new Error('Normalize into staging; published export must come from DB');
const {source,manifest,provenance,entries}=await pinnedSource(process.argv[2]);
const insensitive=new Map([...entries.keys()].map(file=>[file.toLowerCase(),file]));
const rewardsSource=await source('json/base/meta/GameBalance/SkillTreeRewards.gam.json');
const rewards=new Map<string,any>(rewardsSource.value.ptData.flatMap((t:any)=>t.tEntries??[]).map((r:any)=>[r.tHeader.szName,r]));
const skills:Skill[]=[],classes:GameClass[]=[],boards:Record<string,TreeRecord>={},coverage:any[]=[];
for(const name of ['Barbarian','Druid','Necromancer','Rogue','Sorcerer','Spiritborn','Paladin','Warlock']){
  const code=name.toLowerCase();
  const cls=await source(`json/base/meta/PlayerClass/${name}.pcl.json`),classId=String(cls.value.__snoID__);
  const kit=await source(`json/${cls.value.snoSkillKit.__targetFileName__}.json`);
  if(kit.value.__snoID__!==cls.value.snoSkillKit.__raw__)throw new Error('Class/kit source SNO mismatch');
  const powers=new Map<number,any>();
  const targets=new Map<number,any>();
  for(const entry of kit.value.arActiveSkillEntries)if(entry.snoPower)targets.set(entry.snoPower.__raw__,entry.snoPower);
  for(const node of kit.value.arNodes){if(!node.gbidReward)continue;const reward=rewards.get(node.gbidReward.name);if(!reward)throw new Error(`${name}: unresolved reward ${node.gbidReward.name}`);if(reward.snoPower)targets.set(reward.snoPower.__raw__,reward.snoPower);}
  const localSkills:Skill[]=[];
  for(const target of targets.values()){
    const power=await source(`json/${target.__targetFileName__}.json`);
    if(power.value.__snoID__!==target.__raw__)throw new Error('Power SNO mismatch');
    if(power.value.snoClassRequirement?.__raw__&&power.value.snoClassRequirement.__raw__!==cls.value.__snoID__)throw new Error(`${name}: power ${target.name} has conflicting class reference`);
    const stringFile=insensitive.get(`json/enUS_Text/meta/StringList/Power_${target.name}.stl.json`.toLowerCase());
    const strings=stringFile?await source(stringFile):undefined;
    const displayName=strings?getString(strings.value,'name'):undefined;
    const id=String(power.value.__snoID__),normal=positiveHandle(power.value.hIconNormal);
    const skill=SkillSchema.parse({id,slug:sourceSlug(displayName??target.name,id),name:displayName??target.name,class:code,classId,
      category:String(power.value.tPrimaryTag?.gbidSkillTag?.name??'').replace(/^Skill_Primary_/,'').toLowerCase()||undefined,
      type:power.value.bIsPassive?'passive':'active',localizationStatus:displayName?'resolved':'missing',
      description:strings?cleanTooltipText(getString(strings.value,'desc')):undefined,descriptionTemplate:strings?getString(strings.value,'desc'):undefined,
      tags:(power.value.arSkillTags??[]).filter((t:any)=>!t.bSearchOnly).map((t:any)=>t.gbidSkillTag?.name).filter(Boolean),
      iconRef:normal?{normalHandle:normal,mouseoverHandle:positiveHandle(power.value.hIconMouseover),pushedHandle:positiveHandle(power.value.hIconPushed),inactiveHandle:positiveHandle(power.value.hIconInactive)}:undefined,
      rawData:{mustBeLearned:power.value.bMustBeLearned,classRequirement:power.value.snoClassRequirement,classMembershipEvidence:'PlayerClass -> SkillKit -> active entry or tree reward -> Power SNO',primaryTag:power.value.tPrimaryTag,resourceCosts:power.value.arResourceCosts,healthCost:power.value.tHealthCost,chargeCost:power.value.tChargeCost,cooldownTime:power.value.tCooldownTime,resourceCostReductionCoefficient:power.value.tResourceCostReductionCoefficient,cooldownReductionCoefficient:power.value.tCooldownReductionCoefficient,formulaCount:power.value.nFormulaCount},
      rawFormulas:rawFormulas(power.value),source:power.ref,localizationSource:strings?.ref,patch:manifest.version});
    localSkills.push(skill);powers.set(power.value.__snoID__,{...power,strings,skill});
  }
  const nodes:any[]=[];
  for(const node of kit.value.arNodes){
    const reward=node.gbidReward?rewards.get(node.gbidReward.name):undefined;
    const sno=reward?.snoPower?.__raw__,detail=powers.get(sno);
    if(reward&&!detail)throw new Error(`${name}: unresolved tree power`);
    let skill=detail?.skill as Skill|undefined;
    let kind=reward?(detail.value.bIsPassive?'passive':'active'):(node.eRootNodeType===1?'hub':'gate');
    if(reward?.eType===1){
      const mod=detail.value.arMods.find((m:any)=>m.szName===reward.szPowerMod);
      if(!mod)throw new Error(`${name}: unresolved modifier ${reward.tHeader.szName}`);
      const id=`${sno}:mod:${mod.dwModId}`,localized=detail.strings?getString(detail.strings.value,`Mod${mod.dwModId}_Name`):undefined;
      skill=localSkills.find(s=>s.id===id);
      if(!skill){
        const modName=localized??reward.tHeader.szName,normal=positiveHandle(mod.hIconNormalOverride)??detail.skill.iconRef?.normalHandle;
        skill=SkillSchema.parse({id,slug:sourceSlug(modName,id),name:modName,class:code,classId,parentId:String(sno),type:'modifier',category:detail.skill.category,
          localizationStatus:localized?'resolved':'missing',description:detail.strings?cleanTooltipText(getString(detail.strings.value,`Mod${mod.dwModId}_Description`)):undefined,
          descriptionTemplate:detail.strings?getString(detail.strings.value,`Mod${mod.dwModId}_Description`):undefined,
          iconRef:normal?{normalHandle:normal,mouseoverHandle:positiveHandle(mod.hIconMouseoverOverride),pushedHandle:positiveHandle(mod.hIconPushedOverride),inactiveHandle:positiveHandle(mod.hIconInactiveOverride)}:undefined,
          maxRank:reward.dwMaxTalentRanks>0?reward.dwMaxTalentRanks:undefined,rawData:{powerMod:mod},rawFormulas:rawFormulas(mod),source:detail.ref,localizationSource:detail.strings?.ref,patch:manifest.version});
        localSkills.push(skill);
      }kind='modifier';
    }else if(skill&&reward.dwMaxTalentRanks>0)skill.maxRank=reward.dwMaxTalentRanks;
    nodes.push({id:node.dwID,x:node.vPosition.x,y:node.vPosition.y,kind,name:skill?.name??(kind==='hub'?'Yetenek kümesi':`Seviye ${node.dwNodeRequiredPlayerLevel}`),description:skill?.description,
      powerSno:sno,skillId:skill?.id,skillSlug:skill?.slug,category:skill?.category,iconHandle:skill?.iconRef?.normalHandle,borderHandle:positiveHandle(node.hNodeBorderOverride),rootNodeType:node.eRootNodeType,
      maxRanks:reward?.dwMaxTalentRanks>0?reward.dwMaxTalentRanks:undefined,requiredLevel:node.dwNodeRequiredPlayerLevel,exclusiveGroup:node.nExclusiveGroupId>=0?node.nExclusiveGroupId:undefined,rewardName:node.gbidReward?.name});
  }
  const edges=kit.value.arConnections.map((edge:any)=>{
    const a=kit.value.arNodes[edge.nIndexNodeA],b=kit.value.arNodes[edge.nIndexNodeB];
    if(a?.dwID!==edge.dwSourceId||b?.dwID!==edge.dwDestinationId)throw new Error('Source edge identity mismatch');
    return {from:a.dwID,to:b.dwID,points:[a.vPosition,...edge.arCustomPathPositions,b.vPosition]};});
  const points=[...nodes,...edges.flatMap((e:any)=>e.points)];
  const board=TreeRecordSchema.parse({id:String(kit.value.__snoID__),slug:sourceSlug(name,String(kit.value.__snoID__)),name,classCode:code,classId,source:kit.ref,patch:manifest.version,
    scope:'full',sourceNodeCount:kit.value.arNodes.length,sourceEdgeCount:kit.value.arConnections.length,nodes,edges,
    bounds:{minX:Math.min(...points.map((p:any)=>p.x)),minY:Math.min(...points.map((p:any)=>p.y)),maxX:Math.max(...points.map((p:any)=>p.x)),maxY:Math.max(...points.map((p:any)=>p.y))}});
  boards[code]=board;skills.push(...localSkills);
  classes.push(ClassSchema.parse({id:classId,slug:sourceSlug(name,classId),name,code,skillKitId:board.id,skillIds:localSkills.map(s=>s.id).sort(),source:cls.ref,patch:manifest.version,
    centerImageHandle:positiveHandle(cls.value.hSkillTreeCenterImage),rawData:{primaryResource:cls.value.tPrimaryResource,secondaryResource:cls.value.tSecondaryResource,coreStatBenefits:cls.value.arCoreStatBenefit}}));
  coverage.push({class:code,powers:targets.size,records:localSkills.length,nodes:nodes.length,edges:edges.length,missingLocalization:localSkills.filter(s=>s.localizationStatus==='missing').map(s=>s.id)});
}
await mkdir(output,{recursive:true});
const write=async(name:string,value:unknown)=>writeFile(path.join(output,`${name}.json`),JSON.stringify(value,null,2)+'\n');
for(const kind of ['items','affixes','aspects']){
  const records=JSON.parse(await readFile(`data/generated/${kind}.json`,'utf8'));
  for(const record of records){
    if(kind==='affixes')continue;
    const raw=(await source(record.source.file)).value;
    if(kind==='aspects'&&positiveHandle(raw.hIconOverride))record.iconRef={overrideHandle:raw.hIconOverride};
    if(kind==='items')record.iconRef={inventoryImageHandles:[...new Set<number>((raw.tInvImages??[]).flatMap((v:any)=>[v.hDefaultImage,v.hFemaleImage]).filter((h:number)=>positiveHandle(h)))],actorSno:positiveHandle(raw.snoActor?.__raw__)};
  }
  await write(kind,records);
}
const oldProvenance=JSON.parse(await readFile('data/generated/provenance.json','utf8'));
for(const ref of oldProvenance.files)if(!provenance.has(ref.file))provenance.set(ref.file,ref);
await write('skills',skills.sort((a,b)=>a.id.localeCompare(b.id)));await write('classes',classes.sort((a,b)=>a.id.localeCompare(b.id)));
await write('skill-tree',{gameBuild:manifest.build,classes:boards});
await write('metadata',{schemaVersion:2,source:'DiabloTools/d4data',sourceCommit:manifest.commit,sourceVersion:manifest.version,gameBuild:manifest.build,patch:manifest.patch,season:manifest.season,channel:'live',sample:false,phase:'F03',generatedAt:new Date().toISOString()});
await write('provenance',{sourceCommit:manifest.commit,sourceVersion:manifest.version,files:[...provenance.values()].sort((a,b)=>a.file.localeCompare(b.file))});
await write('coverage',{phase:'F03',sourceCommit:manifest.commit,version:manifest.version,classes:coverage,treeLayout:'original-source-coordinates-and-paths',scope:'Eight source-confirmed class skill kits; non-tree powers remain inventoried in F04/F06'});
const checked=await loadCatalog(output);console.log(JSON.stringify({output,files:checked.files.map(f=>({kind:f.kind,count:f.records.length})),links:checked.links.length,coverage,inputSha256:checked.inputSha256},null,2));
