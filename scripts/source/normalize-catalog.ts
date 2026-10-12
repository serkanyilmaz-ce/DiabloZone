import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {ItemSchema,AspectSchema,AffixSchema,type Item,type Aspect,type Affix} from '../../schemas/domain.js';
import {pinnedSource,rawFormulas,sourceSlug,positiveHandle} from './pinned.js';
import {getString,cleanTooltipText} from '../import-d4data/string-list.js';
import {loadCatalog} from '../db/catalog.js';

const output=path.resolve(process.argv[3]??'output/staging/f04');
if(output===path.resolve('data/generated'))throw new Error('Normalize into staging; publication requires reader export');
const {source,manifest,entries,provenance}=await pinnedSource(process.argv[2]);
const lookup=new Map([...entries.keys()].map(file=>[file.toLowerCase(),file]));
const classes=JSON.parse(await readFile('data/generated/classes.json','utf8'));
const byClass=new Map<number,any>(classes.map((c:any)=>[Number(c.id),c]));
const allClasses=classes.map((c:any)=>c.code);
const unresolved:any[]=[];
const files=(kind:string)=>[...entries.keys()].filter(file=>file.startsWith(`json/base/meta/${kind}/`)).sort();
async function strings(kind:string,internal:string){const file=lookup.get(`json/enUS_Text/meta/StringList/${kind}_${internal}.stl.json`.toLowerCase());return file?source(file):undefined;}
const internal=(file:string)=>path.basename(file).replace(/\.[^.]+\.json$/,'');
function pick(value:any,keys:string[]){return Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));}
function universal(flags:any){return Array.isArray(flags)&&flags.length===classes.length&&flags.every(f=>f===1);}
async function power(ref:any){
  if(!ref?.__raw__)return undefined;
  const file=`json/${ref.__targetFileName__}.json`;
  if(!entries.has(file)){unresolved.push({kind:'Power',sno:ref.__raw__,file});return undefined;}
  const loaded=await source(file);if(loaded.value.__snoID__!==ref.__raw__)throw new Error('Power source identity mismatch');return loaded;
}
const itemTypes=new Map<number,any>();
for(const file of files('ItemType')){const row=await source(file);itemTypes.set(row.value.__snoID__,row);}
const affixes:Affix[]=[],items:Item[]=[],aspects:Aspect[]=[];
for(const file of files('Affix')){
  const row=await source(file),v=row.value,id=String(v.__snoID__),token=internal(file),localized=await strings('Affix',token);
  const name=localized?cleanTooltipText(getString(localized.value,'name')):undefined;
  const passive=await power(v.snoPassivePower);
  const cls=byClass.get(v.snoClassRequirement?.__raw__);
  const slots=[...itemTypes.values()].filter(t=>t.value.arItemLabels.some((label:number)=>(v.arAllowedItemLabels??[]).includes(label))).map(t=>internal(t.ref.file));
  const normal=positiveHandle(passive?.value.hIconNormal);
  affixes.push(AffixSchema.parse({id,slug:sourceSlug(name??token,id),internalName:token,name,localizationStatus:name?'resolved':'missing',
    description:localized?cleanTooltipText(getString(localized.value,'desc','codexdesc')):undefined,descriptionTemplate:localized?getString(localized.value,'desc','codexdesc'):undefined,
    staticValues:v.arStaticValues??[],itemPowerMin:v.nItemPowerMin,itemPowerMax:v.nItemPowerMax,rawAllowedItemLabels:v.arAllowedItemLabels??[],
    tags:(v.arAffixSkillTags??[]).map((t:any)=>t?.name).filter(Boolean),classId:cls?.id,classes:cls?[cls.code]:universal(v.fAllowedForPlayerClass)?allClasses:undefined,
    iconRef:normal?{normalHandle:normal}:undefined,rawFormulas:rawFormulas(v),
    rawData:{...pick(v,['dwFlags','eMagicType','eCategory','nWeight','tCost','gbidAffixFamily','fAllowedForPlayerClass','dwAllowedQualityLevels','eAffixType','arMaxLegendaryRanks','ptItemAffixAttributes','snoClassRequirement','arPowerToModify','arEnableCondition','arItemTags','arAffixTags','bIsTemperedAffix','arConditionalSkillTags','arSkillTagsToAdd','arSkillTagsToRemove']),candidateItemTypes:slots,itemTypeMatchMethod:'label intersection; runtime eligibility logic unresolved'},
    source:row.ref,localizationSource:localized?.ref,passivePowerSource:passive?.ref,patch:manifest.version}));
}
const byAffix=new Map(affixes.map(a=>[a.id,a]));
for(const file of files('Item')){
  const row=await source(file),v=row.value,id=String(v.__snoID__),token=internal(file),localized=await strings('Item',token);
  const name=localized?cleanTooltipText(getString(localized.value,'name')):undefined;
  const references=[...(v.arForcedAffixes??[]),...(v.arInherentAffixes??[])].filter(r=>r?.__raw__);
  const missing=references.filter(r=>!byAffix.has(String(r.__raw__)));
  for(const r of missing)unresolved.push({kind:'ItemAffix',source:id,sno:r.__raw__,file:r.__targetFileName__});
  const related=await power(v.snoPower??v.snoPowerPassive);
  // These authored nonzero eMagicType values are corpus interpretations. Zero
  // includes base items used for multiple generated rarities; it stays unknown.
  const rarity=({1:'legendary',2:'unique',4:'mythic'} as Record<number,string>)[v.eMagicType]??'unknown';
  const universalClass=universal(v.fUsableByClass);
  items.push(ItemSchema.parse({id,slug:sourceSlug(name??token,id),name:name??token,internalName:token,localizationStatus:name?'resolved':'missing',rarity,
    slot:v.snoItemType?.name?.toLowerCase(),classes:universalClass?allClasses:[],classRestrictionStatus:universalClass?'explicit':'unknown',
    affixIds:[...new Set(references.filter(r=>byAffix.has(String(r.__raw__))).map(r=>String(r.__raw__)))],
    inherentAffixIds:(v.arInherentAffixes??[]).filter((r:any)=>r?.__raw__&&byAffix.has(String(r.__raw__))).map((r:any)=>String(r.__raw__)),
    requiredLevel:v.nExplicitRequiredLevel>0?v.nExplicitRequiredLevel:undefined,fixedPowerLevel:v.nFixedIPowerLevel>0?v.nFixedIPowerLevel:undefined,
    flavor:localized?cleanTooltipText(getString(localized.value,'flavor')):undefined,
    iconRef:{inventoryImageHandles:[...new Set<number>((v.tInvImages??[]).flatMap((x:any)=>[x.hDefaultImage,x.hFemaleImage]).filter((h:number)=>positiveHandle(h)))],actorSno:positiveHandle(v.snoActor?.__raw__),alternateHandle:positiveHandle(v.hRuneIcon)??positiveHandle(v.hVendorIcon)??positiveHandle(v.hSetCharmIcon?.hImageHandle),alternateRole:positiveHandle(v.hRuneIcon)?'rune':positiveHandle(v.hVendorIcon)?'vendor':positiveHandle(v.hSetCharmIcon?.hImageHandle)?'set_charm':undefined},
    rawFormulas:rawFormulas(v),powerSource:related?.ref,
    rawData:{...pick(v,['eMagicType','eForcedItemQualityModifier','eDisplayedQualityLevel','dwFlags','nMaxStackSize','nBaseCostCurrency','eCurrencyType','nSellCostOverride','snoBaseItem','snoRandomItemTreasureClass','arItemFamilies','ptAttributes','nForcedMaxAffixCount','fUsableByClass','ptSocketedEffects','snoGemForcedAffix','snoRunePower','dwRunicPowerAmount','hRuneIcon','eRuneRarity','flDynamicRuneValue','flICDOverrideSeconds','eRuneOverflowType','snoRecipe','snoMount','snoCompanion','snoCollectiblePower','arReputation','eItemUseType','tRequirementsToBeActive','bSeasonItem','dwContentLicenseRequirements','snoUseCondition','eCharmRarity','snoPowerPassive','bIsTransmog']),rarityInterpretation:rarity==='unknown'?'unresolved or generated at runtime':'datamined enum corpus; not gameplay verification',unresolvedAffixes:missing},
    source:row.ref,localizationSource:localized?.ref,patch:manifest.version}));
}
for(const file of files('Aspect')){
  const row=await source(file),v=row.value,id=String(v.__snoID__),token=internal(file),a=byAffix.get(String(v.snoAffix?.__raw__));
  if(v.snoAffix?.__raw__&&!a)unresolved.push({kind:'AspectAffix',source:id,sno:v.snoAffix.__raw__,file:v.snoAffix.__targetFileName__});
  const name=a?.name??token;
  aspects.push(AspectSchema.parse({id,slug:sourceSlug(name.replace(/^of\s+/i,''),id),name,internalName:token,localizationStatus:a?.name?'resolved':'missing',category:'unknown',
    classes:a?.classes??[],classId:a?.classId,affixId:a?.id,description:a?.description,descriptionTemplate:a?.descriptionTemplate,
    tags:a?.tags??[],rawAllowedItemLabels:a?.rawAllowedItemLabels??[],rawFormulas:a?.rawFormulas??[],iconRef:positiveHandle(v.hIconOverride)?{overrideHandle:v.hIconOverride}:undefined,
    rawData:{affixReference:v.snoAffix,categoryEnum:a?.rawData?.eCategory,categoryInterpretation:'unresolved',candidateItemTypes:a?.rawData?.candidateItemTypes},source:row.ref,affixSource:a?.source,localizationSource:a?.localizationSource,patch:manifest.version}));
}
await mkdir(output,{recursive:true});
const write=async(name:string,value:unknown)=>writeFile(path.join(output,`${name}.json`),JSON.stringify(value,null,2)+'\n');
for(const kind of ['skills','classes','skill-tree'])await write(kind,JSON.parse(await readFile(`data/generated/${kind}.json`,'utf8')));
for(const [kind,records]of Object.entries({items,affixes,aspects}))await write(kind,records.sort((a,b)=>a.id.localeCompare(b.id)));
const prior=JSON.parse(await readFile('data/generated/provenance.json','utf8'));for(const ref of prior.files)if(!provenance.has(ref.file))provenance.set(ref.file,ref);
await write('provenance',{sourceCommit:manifest.commit,sourceVersion:manifest.version,files:[...provenance.values()].sort((a,b)=>a.file.localeCompare(b.file))});
await write('metadata',{schemaVersion:2,source:'DiabloTools/d4data',sourceCommit:manifest.commit,sourceVersion:manifest.version,gameBuild:manifest.build,patch:manifest.patch,season:manifest.season,channel:'live',sample:false,phase:'F04',generatedAt:new Date().toISOString()});
const coverage={phase:'F04',sourceCommit:manifest.commit,sourceVersion:manifest.version,items:{source:files('Item').length,imported:items.length,localized:items.filter(i=>i.localizationStatus==='resolved').length,withInventoryIcon:items.filter(i=>i.iconRef?.inventoryImageHandles.length).length,byRarity:items.reduce((a:any,i)=>(a[i.rarity]=(a[i.rarity]??0)+1,a),{})},affixes:{source:files('Affix').length,imported:affixes.length,localized:affixes.filter(a=>a.localizationStatus==='resolved').length,withRawExpressions:affixes.filter(a=>a.rawFormulas.length).length},aspects:{source:files('Aspect').length,imported:aspects.length},unresolved,availability:'Source presence does not prove shipping, season activation or loot eligibility; all variants retained'};
await write('coverage',coverage);
const checked=await loadCatalog(output);console.log(JSON.stringify({output,counts:checked.files.map(f=>({kind:f.kind,count:f.records.length})),links:checked.links.length,inputSha256:checked.inputSha256,coverage},null,2));
