import { promises as fs } from 'node:fs';
import path from 'node:path';

type Skill={slug:string;name:string;icon?:string;iconRef?:{normalHandle?:number}};
type Item={slug:string;name:string;icon?:string};
type Aspect={slug:string;name:string;icon?:string;iconRef?:{overrideHandle?:number}};
type SourceMap={items:Record<string,string|null>;aspects:Record<string,string|null>};
const SKILL_BASE='https://www.purediablo.com/diablo4/images/skills';
const ITEM_PAGE_BASE='https://www.purediablo.com/diablo4';
const ITEM_IMAGE_BASE='https://www.purediablo.com/diablo4/images/items';
const ASPECT_BASE='https://www.purediablo.com/diablo4/images/aspects';
const USER_AGENT='DiabloZone/0.1 (+https://github.com/serkanyilmaz-ce/DiabloZone)';
const SOURCE_MAP_FILE='public/assets/icon-source-map.json';
const VERIFIED_ITEM_IMAGE_IDS:Record<string,string>={'Harlequin Crest':'2104072'};
async function readJson<T>(f:string):Promise<T>{return JSON.parse(await fs.readFile(f,'utf8')) as T;}
async function readJsonOr<T>(f:string,x:T):Promise<T>{try{return await readJson<T>(f);}catch{return x;}}
async function writeJson(f:string,v:unknown){await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify(v,null,2)+'\n');}
function wikiTitle(name:string){return encodeURIComponent(name.replace(/\s+/g,'_')).replace(/%2F/gi,'/').replace(/'/g,'%27');}
async function fetchWithTimeout(url:string,timeoutMs=10000){return fetch(url,{signal:AbortSignal.timeout(timeoutMs),redirect:'follow',headers:{'user-agent':USER_AGENT,accept:'*/*'}});}
async function downloadImage(url:string,destination:string){const response=await fetchWithTimeout(url);if(!response.ok)throw new Error(`HTTP ${response.status}`);const type=response.headers.get('content-type')??'';if(!type.startsWith('image/'))throw new Error(`unexpected content-type ${type||'unknown'}`);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100)throw new Error('image payload too small');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes);}
async function mapLimit<T>(values:T[],limit:number,worker:(value:T,index:number)=>Promise<void>){let cursor=0;async function run(){while(true){const index=cursor++;if(index>=values.length)return;await worker(values[index],index);}}await Promise.all(Array.from({length:Math.min(limit,values.length)},run));}
function uniqueMatches(html:string,regex:RegExp){return[...new Set(Array.from(html.matchAll(regex),m=>m[1]))];}

const skillsFile='data/generated/skills.json',itemsFile='data/generated/items.json',aspectsFile='data/generated/aspects.json';
const skills=await readJson<Skill[]>(skillsFile),items=await readJson<Item[]>(itemsFile),aspects=await readJson<Aspect[]>(aspectsFile);
const sourceMap=await readJsonOr<SourceMap>(SOURCE_MAP_FILE,{items:{},aspects:{}}); sourceMap.items??={}; sourceMap.aspects??={};
const report={generatedAt:new Date().toISOString(),skills:{total:skills.length,candidates:0,resolved:0,cached:0,missing:[] as string[]},items:{total:items.length,candidates:items.length,resolved:0,cached:0,sourceMapHits:0,verifiedOverrides:0,knownMissing:0,ambiguous:[] as string[],missing:[] as string[]},aspects:{total:aspects.length,candidates:0,resolved:0,cached:0,direct:0,sourceMapHits:0,missing:[] as string[]}};
const skillCandidates=skills.filter(x=>Number(x.iconRef?.normalHandle??0)>0);report.skills.candidates=skillCandidates.length;
await mapLimit(skillCandidates,12,async skill=>{const handle=Number(skill.iconRef!.normalHandle),relative=`assets/skills/${skill.slug}.png`,destination=path.join('public',relative);try{await fs.access(destination);skill.icon=relative;report.skills.cached++;report.skills.resolved++;return;}catch{}try{await downloadImage(`${SKILL_BASE}/${handle}.png`,destination);skill.icon=relative;report.skills.resolved++;}catch{report.skills.missing.push(`${skill.name} (${handle})`);}});
await mapLimit(items,10,async item=>{const relative=`assets/items/${item.slug}.png`,destination=path.join('public',relative);try{await fs.access(destination);item.icon=relative;report.items.cached++;report.items.resolved++;return;}catch{}const verified=VERIFIED_ITEM_IMAGE_IDS[item.name];if(verified){try{await downloadImage(`${ITEM_IMAGE_BASE}/${verified}.png`,destination);sourceMap.items[item.name]=verified;item.icon=relative;report.items.verifiedOverrides++;report.items.resolved++;return;}catch{}}
const cached=sourceMap.items[item.name];if(typeof cached==='string'){try{await downloadImage(`${ITEM_IMAGE_BASE}/${cached}.png`,destination);item.icon=relative;report.items.sourceMapHits++;report.items.resolved++;return;}catch{delete sourceMap.items[item.name];}}try{const page=await fetchWithTimeout(`${ITEM_PAGE_BASE}/${wikiTitle(item.name)}`,9000);if(!page.ok)throw new Error(`page HTTP ${page.status}`);const html=await page.text(),ids=new Set<string>();for(const id of uniqueMatches(html,/\/diablo4\/images\/items\/(\d+)\.png/gi))ids.add(id);for(const id of uniqueMatches(html,/Image:\s*(\d+)\.png/gi))ids.add(id);if(ids.size!==1){if(ids.size>1)report.items.ambiguous.push(`${item.name}: ${[...ids].join(',')}`);else report.items.missing.push(`${item.name}: no item image on page`);return;}const id=[...ids][0];await downloadImage(`${ITEM_IMAGE_BASE}/${id}.png`,destination);sourceMap.items[item.name]=id;item.icon=relative;report.items.resolved++;}catch(error){report.items.missing.push(`${item.name}: ${error instanceof Error?error.message:String(error)}`);}});
const aspectCandidates=aspects.filter(x=>Number(x.iconRef?.overrideHandle??0)>0);report.aspects.candidates=aspectCandidates.length;
await mapLimit(aspectCandidates,10,async aspect=>{const handle=Number(aspect.iconRef!.overrideHandle),relative=`assets/aspects/${aspect.slug}.png`,destination=path.join('public',relative);try{await fs.access(destination);aspect.icon=relative;report.aspects.cached++;report.aspects.resolved++;return;}catch{}
for(const url of [`${ASPECT_BASE}/${handle}.png`,`${SKILL_BASE}/${handle}.png`]){try{await downloadImage(url,destination);aspect.icon=relative;report.aspects.direct++;report.aspects.resolved++;return;}catch{}}
const cached=sourceMap.aspects[aspect.name];if(typeof cached==='string'){try{await downloadImage(cached,destination);aspect.icon=relative;report.aspects.sourceMapHits++;report.aspects.resolved++;return;}catch{delete sourceMap.aspects[aspect.name];}}
try{const page=await fetchWithTimeout(`${ITEM_PAGE_BASE}/${wikiTitle(aspect.name)}`,9000);if(!page.ok)throw new Error(`page HTTP ${page.status}`);const html=await page.text();const urls=uniqueMatches(html,/(https?:\/\/[^"'<>\s]+\.png)/gi).filter(x=>/diablo4/i.test(x));const relativeUrls=uniqueMatches(html,/(\/diablo4\/[^"'<>\s]+\.png)/gi).map(x=>`https://www.purediablo.com${x}`);const candidates=[...new Set([...urls,...relativeUrls])].filter(x=>!/logo|avatar|icon\/wiki/i.test(x));for(const url of candidates){try{await downloadImage(url,destination);sourceMap.aspects[aspect.name]=url;aspect.icon=relative;report.aspects.resolved++;return;}catch{}}throw new Error('no usable aspect image on page');}catch(error){report.aspects.missing.push(`${aspect.name}: ${error instanceof Error?error.message:String(error)}`);}});
const tree=await readJson<any>('data/generated/skill-tree.json');
const handles=[...new Set<number>(Object.values(tree.classes).flatMap((board:any)=>board.nodes.map((node:any)=>Number(node.iconHandle??0))).filter((handle:number)=>handle>0))];
const resolved=new Set<number>();
await mapLimit(handles,12,async handle=>{const destination=`public/assets/skill-tree/${handle}.png`;try{await fs.access(destination);resolved.add(handle);return;}catch{}try{await downloadImage(`${SKILL_BASE}/${handle}.png`,destination);resolved.add(handle);}catch{}});
for(const board of Object.values(tree.classes) as any[])for(const node of board.nodes){if(resolved.has(node.iconHandle))node.icon=`assets/skill-tree/${node.iconHandle}.png`;else{const skill=skills.find(skill=>skill.slug===node.skillSlug);if(skill?.icon)node.icon=skill.icon;}}
await writeJson('data/generated/skill-tree.json',tree);
console.log(`Tree icons ${resolved.size}/${handles.length}`);
await writeJson(skillsFile,skills);await writeJson(itemsFile,items);await writeJson(aspectsFile,aspects);await writeJson(SOURCE_MAP_FILE,sourceMap);await writeJson('data/generated/icon-assets-report.json',report);
console.log(`Skill icons ${report.skills.resolved}/${report.skills.candidates}; item icons ${report.items.resolved}/${report.items.candidates}; aspect icons ${report.aspects.resolved}/${report.aspects.candidates}`);
if(!skills.some(x=>x.name==='Fireball'&&x.icon))throw new Error('Icon sanity check failed: Fireball icon was not resolved');
if(!items.some(x=>x.name==='Harlequin Crest'&&x.icon))console.warn('Icon warning: Harlequin Crest icon was not resolved');
