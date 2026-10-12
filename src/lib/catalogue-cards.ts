import {skills,items,aspects,affixes,metadata} from './data';
import {term} from './terms';
import {readableTooltip} from './tooltip';
import {itemProperties,type ItemProperty} from './item-properties';
import {cleanGameName,fallbackIcon,formatGameName,isDeveloperText,isGearSlot,rarityRank} from './presentation';
export type CardKind='skills'|'items'|'aspects'|'affixes';
export interface CatalogueCard{
  id:string;slug:string;name:string;kind:CardKind|'systems';description:string;kicker:string;icon?:string;classes:string[];
  filters:Record<string,string>;text:string;chips:string[];
  // Presentation: rarity colour, interface glyph when no original icon, readable item lines.
  rarity?:string;fallback:string;nameStyle?:'aspect'|'identifier';properties?:ItemProperty[];descriptionField?:string;
}
// Preserve raw source expressions in detail records; list previews mark unresolved
// tokens without evaluating them or silently substituting fabricated game values.
export function tooltipPreview(value:string|undefined){
  return readableTooltip(value);
}
const datasets={skills,items,aspects,affixes};
const labels={skills:'Yetenek',items:'Eşya',aspects:'Aspekt',affixes:'Affix'};
const cache=new Map<string,CatalogueCard[]>();
// Playable records first; items by rarity, then gear before quest/crafting objects.
const compareOrder=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
export function catalogueCards(kind:CardKind|'all'):CatalogueCard[]{
  if(cache.has(kind))return cache.get(kind)!;
  if(kind==='all'){const all=(Object.keys(datasets) as CardKind[]).flatMap(k=>catalogueCards(k));cache.set(kind,all);return all;}
  const result=datasets[kind].map((record:any)=>{
    const classes=record.classes??(record.class?[record.class]:[]);
    const sourceName:string=record.name??record.internalName;
    const developer=isDeveloperText(sourceName,record.name);
    const nameStyle=kind==='aspects'&&!developer?'aspect' as const:undefined;
    const name=record.localizationStatus==='missing'&&!record.name?`Kaynak kaydı ${record.id}`:nameStyle?formatGameName(sourceName,'aspect','en'):cleanGameName(sourceName)||sourceName;
    const props=kind==='items'?itemProperties([...(record.inherentAffixIds??[]),...record.affixIds]):undefined;
    const description=kind==='items'?(props!.lines.length?'':tooltipPreview(record.flavor).slice(0,220)):tooltipPreview(record.description).slice(0,320);
    const quality=developer?'dev':'game';
    const filters={type:record.type??'',rarity:record.rarity??'',slot:record.slot??'',category:record.category??'',kind,localized:record.localizationStatus??'resolved',icon:record.icon?'available':'missing',quality};
    const kicker=kind==='skills'?`${term(record.class)} · ${term(record.category)}`:kind==='items'?`${term(record.rarity)} · ${term(record.slot)}`:labels[kind];
    const chips=[...(kind==='skills'?[term(record.type)]:[]),...(record.maxRank?[`${record.maxRank} kademe`]:[]),...(classes.length===1&&kind!=='skills'?[term(classes[0])]:[]),
      ...(kind==='items'&&record.requiredLevel?[`Seviye ${record.requiredLevel}`]:[]),...(kind==='items'&&props!.unresolved?[`+${props!.unresolved} özellik`]:[]),...(developer?['Test kaydı']:[])];
    return {id:record.id,slug:record.slug,name,kind,description,kicker,icon:record.icon,classes,filters,
      text:`${name} ${record.internalName??''} ${record.description??record.flavor??''} ${props?.lines.map(l=>`${l.en} ${l.tr??''}`).join(' ')??''} ${record.tags?.join(' ')??''} ${classes.map(term).join(' ')} ${kicker}`,chips,
      rarity:kind==='items'?record.rarity:undefined,fallback:fallbackIcon(kind,record.slot),nameStyle,properties:props?.lines.slice(0,5),
      descriptionField:kind==='items'?'flavor':'description',
      order:[developer?1:0,kind==='items'?rarityRank(record.rarity):0,kind==='items'&&!isGearSlot(record.slot)?1:0,record.icon?0:1]};
  }).sort((a,b)=>compareOrder(a.order,b.order)||a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id))
    .map(({order:_order,...card})=>card as CatalogueCard);
  cache.set(kind,result);return result;
}
export function cardManifest(kind:CardKind|'all'){return {snapshotId:metadata.snapshotId,sourceVersion:metadata.sourceVersion,kind,records:catalogueCards(kind)};}
