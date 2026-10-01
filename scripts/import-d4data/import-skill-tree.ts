import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readBuildVersion, writeJson } from './io.js';

type Skill={slug:string;name:string;class:string;category?:string;type:string;source:{sno?:string|number}};
type Reward={tHeader?:{szName?:string};eType?:number;snoPower?:{__raw__?:number};szPowerMod?:number;dwMaxTalentRanks?:number;unk_94e270e?:boolean};
function arg(name:string){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:undefined;}
async function readJson<T>(file:string):Promise<T>{return JSON.parse(await fs.readFile(file,'utf8')) as T;}
function humanize(name:string){return name.replace(/^.*?_Mod_/,'').replace(/^.*?_Unlock_/,'').replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').trim();}

const root=path.resolve(arg('--datamine')??'.tmp/d4data');
const build=(await readBuildVersion(root))??'unknown';
const sourceFile=path.join(root,'json/base/meta/GameBalance/SkillTreeRewards.gam.json');
const raw=await readJson<any>(sourceFile);
const skills=await readJson<Skill[]>('data/generated/skills.json');
const skillBySno=new Map<number,Skill>();
for(const skill of skills){const sno=Number(skill.source?.sno);if(Number.isInteger(sno)&&sno>0)skillBySno.set(sno,skill);}
const rewards:Reward[]=[];
for(const table of raw.ptData??[]) for(const entry of table?.tEntries??[]) rewards.push(entry);
const grouped=new Map<number,{skill:Skill;order:number;unlock?:Reward;mods:Reward[]}>();
for(let index=0;index<rewards.length;index++){
  const reward=rewards[index]; const sno=Number(reward.snoPower?.__raw__); const skill=skillBySno.get(sno); if(!skill)continue;
  let group=grouped.get(sno); if(!group){group={skill,order:index,mods:[]};grouped.set(sno,group);}
  const mod=Number(reward.szPowerMod??0); if(Number(reward.eType??0)===0&&mod===0&&!group.unlock)group.unlock=reward; else group.mods.push(reward);
}
const classes:Record<string,any[]>={};
for(const group of grouped.values()){
  const cls=group.skill.class; if(cls==='unknown')continue; (classes[cls]??=[]).push({
    powerSno:Number(group.skill.source.sno),skillSlug:group.skill.slug,name:group.skill.name,category:group.skill.category??'uncategorized',type:group.skill.type,
    order:group.order,maxRanks:Number(group.unlock?.dwMaxTalentRanks??0)||undefined,rewardName:group.unlock?.tHeader?.szName,
    modifiers:group.mods.map((m,index)=>({order:index,rewardName:m.tHeader?.szName,label:humanize(String(m.tHeader?.szName??`Upgrade ${index+1}`)),modifierHash:Number(m.szPowerMod??0)||undefined,maxRanks:Number(m.dwMaxTalentRanks??0)||undefined,defining:Boolean(m.unk_94e270e)})),
  });
}
for(const nodes of Object.values(classes)) nodes.sort((a:any,b:any)=>a.order-b.order||a.name.localeCompare(b.name));
const output={source:'DiabloTools/d4data',gameBuild:build,sourceFile:path.relative(root,sourceFile),sourceSno:raw.__snoID__,generatedAt:new Date().toISOString(),layout:'logical',note:'Logical branches come from SkillTreeRewards. DiabloZone currently arranges them visually until exact class-board coordinates and edge geometry are decoded.',classes};
await writeJson('data/generated/skill-tree.json',output);
const counts=Object.fromEntries(Object.entries(classes).map(([cls,nodes])=>[cls,nodes.length]));
await writeJson('data/generated/skill-tree-report.json',{source:'DiabloTools/d4data',gameBuild:build,matchedPowers:grouped.size,byClass:counts});
if(!classes.sorcerer?.some((x:any)=>x.name==='Fireball'))throw new Error('Skill tree sanity check failed: Sorcerer Fireball missing');
if(Object.keys(classes).length<5)throw new Error(`Skill tree sanity check failed: only ${Object.keys(classes).length} classes matched`);
console.log(`Imported ${grouped.size} logical skill-tree powers from ${rewards.length} rewards; ${JSON.stringify(counts)}`);
