// Browser-safe presentation helpers shared by static pages and dynamic lists.
// They only change how archived text is displayed; source records stay intact.
export type Locale='tr'|'en';

// Developer markers found in the source corpus: (PH) placeholder, (DNS) do-not-ship,
// TEST/WIP rows, "???" stubs and Turkish "(BAŞTAN TASARLANDI)" redesign notes.
const developerMarker=/(^|[\s([])(PH|DNS|WIP|NYI|TBD|DEPRECATED|UNUSED|REDESIGN)[)\]_]|DO NOT SHIP|BAŞTAN TASARLANDI|^\s*\[?TEST\b|\bTEST\]|^\s*\?{2,}\s*$|^\s*\(\s*\)|I need a new design/i;
export function isDeveloperText(...values:Array<string|undefined>){return values.some(value=>!!value&&developerMarker.test(value));}

// Turkish names keep "—" where the game inserts an item name or a grammatical
// case token; "—Ölen Gül—Ölen Gülü" holds two case forms. Show the base form.
export function cleanGameName(value:string){return value.split('—').map(part=>part.trim()).find(Boolean)?.replace(/^[–-]+\s*|\s*[–-]+$/g,'').replace(/\s{2,}/g,' ')??'';}
export function formatGameName(value:string,style:string|undefined,locale:Locale){
  const name=cleanGameName(value);
  if(style!=='aspect'||!name)return name;
  if(locale==='en'){
    if(/aspect/i.test(name))return name;
    if(/^of\s/i.test(name))return `Aspect ${name}`;
    return `${name} Aspect`;
  }
  return /yüzü$|aspect/i.test(name)?name:`${name} Yüzü`;
}
// Internal source names (Power_001_Intelligence_Main) read as identifiers, not prose.
export const isSourceIdentifier=(value:string)=>/^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+$/.test(value.trim());

// Unresolved tooltip values are archived as "—". Display them as a marked variable.
export function valueSegments(text:string):Array<{value:boolean;text:string}>{
  const normalized=text.replace(/—\s?\+—/g,'+—').replace(/—{2,}/g,'—');
  const parts:Array<{value:boolean;text:string}>=[];
  for(const piece of normalized.split(/(—)/))if(piece)parts.push(piece==='—'?{value:true,text:'X'}:{value:false,text:piece});
  return parts;
}

// Interface stat labels mark unresolved values with a standalone X.
export const labelSegments=(text:string)=>text.split(/(\bX\b)/).filter(Boolean).map(piece=>({value:piece==='X',text:piece}));

const rarityOrder=['mythic','unique','legendary','rare','magic','common','unknown'];
export const rarityRank=(rarity?:string)=>{const index=rarityOrder.indexOf(rarity??'unknown');return index<0?rarityOrder.length:index;};
const gearSlots=new Set(['helm','chestarmor','gloves','legs','boots','amulet','ring','shield','focus','offhandtotem','sword','sword2h','axe','axe2h','mace','mace2h','dagger','polearm','scythe','scythe2h','staff','wand','bow','crossbow','crossbow2h','glaive','flail','quarterstaff','tome']);
export const isGearSlot=(slot?:string)=>!!slot&&gearSlots.has(slot.toLowerCase());

const slotIcons:Array<[RegExp,string]>=[
  [/^helm$/,'helm'],[/^chestarmor$/,'chest'],[/^gloves$/,'gloves'],[/^legs$/,'legs'],[/^boots$/,'boots'],[/^ring$/,'ring'],[/^amulet$/,'amulet'],
  [/^(shield|focus|offhandtotem|tome|focusbookoffhand)$/,'offhand'],[/^(bow|crossbow)/,'bow'],[/^(staff|quarterstaff|wand)/,'staff'],
  [/^(sword|axe|mace|dagger|polearm|scythe|glaive|flail)/,'sword'],[/(gem|rune|charm|sigil|essence)/,'gem'],[/(elixir|potion|incense)/,'potion'],
  [/(cache|chest)/,'cache'],[/key/,'key'],[/glyph/,'glyph'],[/(mount|horse)/,'mount'],[/fish/,'fish'],[/trophy/,'crest'],
  [/(quest|lore|recipe|manual|book|scroll)/,'scroll'],
];
const systemIcons:Record<string,string>={ParagonBoard:'board',ParagonNode:'board',ParagonGlyph:'glyph',ParagonGlyphAffix:'glyph',Recipe:'scroll',Season:'crest',GameBalance:'table'};
export function fallbackIcon(kind:string,type?:string){
  if(kind==='items'){const slot=(type??'').toLowerCase();return slotIcons.find(([pattern])=>pattern.test(slot))?.[1]??'items';}
  if(kind==='systems')return systemIcons[type??'']??'table';
  return ({skills:'skills',aspects:'aspects',affixes:'rune',classes:'crest'} as Record<string,string>)[kind]??'items';
}
