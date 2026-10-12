import {readGenerated} from './data';
import {SystemBundleSchema,systemKinds} from '../../schemas/systems';
import {gameAssetPath} from './assets';
import {tooltipPreview,type CatalogueCard} from './catalogue-cards';
import {cleanGameName,fallbackIcon,isDeveloperText,isSourceIdentifier} from './presentation';
const raw=readGenerated<unknown>('systems.json',null);
export const systemArchive=raw?SystemBundleSchema.parse(raw):null;
if(systemArchive&&(!systemArchive.archiveId||!systemArchive.inputSha256||systemArchive.storageSource!=='DiabloZone PostgreSQL'))throw new Error('Published reader export required for systems');
export const systems=systemArchive?.records??[];
export const systemLabels:Record<string,string>={ParagonBoard:'Paragon panosu',ParagonNode:'Paragon düğümü',ParagonGlyph:'Glyph',ParagonGlyphAffix:'Glyph bonusu',Recipe:'Tarif',Season:'Sezon kaydı',GameBalance:'Matematik tablosu'};
export {systemKinds};
export const systemBySlug=new Map(systems.map(r=>[r.slug,r]));
export const systemById=new Map(systems.map(r=>[r.kind+':'+r.id,r]));
export function systemIcon(row:typeof systems[number]){return row.iconHandles.map(gameAssetPath).find(Boolean);}
const systemCard=(r:typeof systems[number]):CatalogueCard&{developer:boolean}=>{
  const icon=systemIcon(r),developer=isDeveloperText(r.name),name=cleanGameName(r.name)||r.name;
  return {id:r.id,slug:r.slug,name,kind:'systems',kicker:systemLabels[r.kind],icon,classes:[],fallback:fallbackIcon('systems',r.kind),nameStyle:isSourceIdentifier(name)?'identifier':undefined,
    description:tooltipPreview(r.descriptionTemplate).slice(0,220),developer,
    filters:{type:r.kind,kind:r.kind,icon:icon?'available':'missing',quality:developer?'dev':'game'},text:`${r.name} ${r.internalName} ${r.id} ${systemLabels[r.kind]}`,
    chips:[...(r.rawFormulas.length?[`${r.rawFormulas.length} ifade`]:[]),...(developer?['Test kaydı']:[])]};
};
// Playable, named and illustrated records first; identifiers and test rows stay reachable by filter.
export const systemCards:CatalogueCard[]=systems.map(systemCard).sort((a,b)=>Number(a.developer)-Number(b.developer)||Number(!a.icon)-Number(!b.icon)||Number(a.nameStyle==='identifier')-Number(b.nameStyle==='identifier')||a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id)).map(({developer:_developer,...card})=>card);
