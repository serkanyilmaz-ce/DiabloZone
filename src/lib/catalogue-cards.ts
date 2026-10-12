import {skills,items,aspects,affixes,metadata} from './data';
import {term} from './terms';
export type CardKind='skills'|'items'|'aspects'|'affixes';
export interface CatalogueCard{
  id:string;slug:string;name:string;kind:CardKind;description:string;kicker:string;icon?:string;classes:string[];
  filters:Record<string,string>;text:string;chips:string[];
}
// Preserve raw source expressions in detail records; list previews mark unresolved
// tokens without evaluating them or silently substituting fabricated game values.
export function tooltipPreview(value:string|undefined){
  if(!value)return '';
  let out='';
  for(let i=0;i<value.length;i++){
    const ch=value[i];
    if(ch==='['||ch==='{'){
      const closing=ch==='['?']':'}';let depth=1;
      while(depth&&++i<value.length){if(value[i]===ch)depth++;else if(value[i]===closing)depth--;}
      out+='[çözümlenmedi]';
    }else out+=ch;
  }
  return out.replace(/\s+/g,' ').trim();
}
const datasets={skills,items,aspects,affixes};
const labels={skills:'Yetenek',items:'Eşya',aspects:'Aspekt',affixes:'Affix'};
const cache=new Map<string,CatalogueCard[]>();
export function catalogueCards(kind:CardKind|'all'):CatalogueCard[]{
  if(cache.has(kind))return cache.get(kind)!;
  if(kind==='all'){const all=(Object.keys(datasets) as CardKind[]).flatMap(k=>catalogueCards(k));cache.set(kind,all);return all;}
  const result=datasets[kind].map((record:any)=>{
    const classes=record.classes??(record.class?[record.class]:[]);
    const name=record.name??record.internalName;
    const description=tooltipPreview(record.description??record.flavor).slice(0,320)||`${record.rawFormulas.length} ham ifade · Kaynak detayını incele.`;
    const filters={type:record.type??'',rarity:record.rarity??'',slot:record.slot??'',category:record.category??'',kind,localized:record.localizationStatus??'resolved'};
    const kicker=kind==='skills'?`${term(record.class)} · ${term(record.category)}`:kind==='items'?`${term(record.rarity)} · ${term(record.slot)}`:labels[kind];
    const chips=[...(kind==='skills'?[term(record.type)]:[]),...(record.maxRank?[`${record.maxRank} rank`]:[]),...(record.localizationStatus==='missing'?['Kaynak adı']:[])];
    return {id:record.id,slug:record.slug,name,kind,description,kicker,icon:record.icon,classes,filters,
      text:`${name} ${record.internalName??''} ${record.description??record.flavor??''} ${record.tags?.join(' ')??''} ${classes.map(term).join(' ')} ${kicker}`,chips};
  }).sort((a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id));
  cache.set(kind,result);return result;
}
export function cardManifest(kind:CardKind|'all'){return {snapshotId:metadata.snapshotId,sourceVersion:metadata.sourceVersion,kind,records:catalogueCards(kind)};}
