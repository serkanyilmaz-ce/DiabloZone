import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root=path.resolve(process.argv[2]??'.tmp/d4data');
const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
const git=(args)=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:32*1024*1024});if(r.status)throw new Error(r.stderr);return r.stdout;};
if(git(['rev-parse','HEAD']).trim()!==manifest.commit||git(['status','--porcelain']).trim())throw new Error('Pinned source checkout required');
const rewards=JSON.parse(await readFile(path.join(root,'json/base/meta/GameBalance/SkillTreeRewards.gam.json'),'utf8')).ptData.flatMap(t=>t.tEntries??[]);
const byName=new Map(rewards.map(r=>[r.tHeader.szName,r]));
const inventory=JSON.parse(await readFile(`.tmp/source-evidence/${manifest.commit}-inventory.json`,'utf8'));
const available=new Set(inventory.entries.map(e=>e.file));
const insensitive=new Map(inventory.entries.map(e=>[e.file.toLowerCase(),e.file]));
const files=new Set();const report=[];
for(const code of ['Barbarian','Druid','Necromancer','Rogue','Sorcerer','Spiritborn','Paladin','Warlock']){
  const classFile=`json/base/meta/PlayerClass/${code}.pcl.json`;
  const cls=JSON.parse(await readFile(path.join(root,classFile),'utf8'));
  const kitFile=`json/${cls.snoSkillKit.__targetFileName__}.json`;
  const kit=JSON.parse(await readFile(path.join(root,kitFile),'utf8'));
  files.add(classFile);files.add(kitFile);
  const powers=new Set(kit.arActiveSkillEntries.map(e=>e.snoPower?.__targetFileName__).filter(Boolean));
  for(const n of kit.arNodes){if(!n.gbidReward)continue;const r=byName.get(n.gbidReward.name);if(!r)throw new Error(`${code}: reward ${n.gbidReward.name} missing`);if(r.snoPower)powers.add(r.snoPower.__targetFileName__);}
  for(const p of powers){files.add(`json/${p}.json`);const name=p.split('/').at(-1).replace(/\.pow$/,'');const strings=insensitive.get(`json/enUS_Text/meta/StringList/Power_${name}.stl.json`.toLowerCase());if(strings)files.add(strings);}
  const localized=`json/enUS_Text/meta/StringList/PlayerClass_${code}.stl.json`;if(available.has(localized))files.add(localized);
  report.push({class:code,sourceSno:cls.__snoID__,nodes:kit.arNodes.length,edges:kit.arConnections.length,powers:powers.size});
}
const patterns=(await readFile(path.join(root,'.git/info/sparse-checkout'),'utf8')).trim().split('\n');
for(const file of files){if(!available.has(file))throw new Error(`Source path not in pinned inventory: ${file}`);patterns.push('/'+file);}
const patternFile=path.resolve('.tmp/source-evidence/classes-sparse.txt');await writeFile(patternFile,[...new Set(patterns)].join('\n')+'\n');
console.log(JSON.stringify({files:files.size,report,patternFile},null,2));
const input=await readFile(patternFile,'utf8');
const result=spawnSync('git',['-C',root,'sparse-checkout','set','--no-cone','--stdin'],{input,encoding:'utf8',maxBuffer:8*1024*1024});
if(result.status)throw new Error(result.stderr);console.log('Pinned class dependencies materialized');
