import {readGenerated} from './data';
import {SystemBundleSchema,systemKinds} from '../../schemas/systems';
import {gameAssetPath} from './assets';
import {tooltipPreview,type CatalogueCard} from './catalogue-cards';
const raw=readGenerated<unknown>('systems.json',null);
export const systemArchive=raw?SystemBundleSchema.parse(raw):null;
if(systemArchive&&(!systemArchive.archiveId||!systemArchive.inputSha256||systemArchive.storageSource!=='DiabloZone PostgreSQL'))throw new Error('Published reader export required for systems');
export const systems=systemArchive?.records??[];
export const systemLabels:Record<string,string>={ParagonBoard:'Paragon panosu',ParagonNode:'Paragon düğümü',ParagonGlyph:'Glyph',ParagonGlyphAffix:'Glyph bonusu',Recipe:'Tarif',Season:'Sezon kaydı',GameBalance:'Matematik tablosu'};
export {systemKinds};
export const systemBySlug=new Map(systems.map(r=>[r.slug,r]));
export const systemById=new Map(systems.map(r=>[r.kind+':'+r.id,r]));
export function systemIcon(row:typeof systems[number]){return row.iconHandles.map(gameAssetPath).find(Boolean);}
export const systemCards:CatalogueCard[]=systems.map<CatalogueCard>(r=>({id:r.id,slug:r.slug,name:r.name,kind:'systems',kicker:systemLabels[r.kind],icon:systemIcon(r),classes:[],
  description:tooltipPreview(r.descriptionTemplate).slice(0,220)||`${r.rawFormulas.length} ham ifade · ${r.references.length} kaynak referansı`,
  filters:{type:r.kind,kind:r.kind,icon:systemIcon(r)?'available':'missing'},text:`${r.name} ${r.internalName} ${r.id} ${systemLabels[r.kind]}`,chips:[`${r.rawFormulas.length} ifade`,r.name===r.internalName?'Kaynak adı':'Kaynak çevirisi']})).sort((a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id));
