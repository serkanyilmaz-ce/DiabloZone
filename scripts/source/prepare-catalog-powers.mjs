import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('.tmp/d4data');
const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
const inventory=JSON.parse(await readFile(`.tmp/source-evidence/${manifest.commit}-inventory.json`,'utf8'));
const available=new Map(inventory.entries.map(e=>[e.file.toLowerCase(),e.file]));
const targets=new Set();
function walk(value){if(!value||typeof value!=='object')return;if(value.groupName==='Power'&&value.__targetFileName__)targets.add(`json/${value.__targetFileName__}.json`);for(const v of Object.values(value))if(typeof v==='object')walk(v);}
for(const kind of ['Item','Affix'])for(const file of await readdir(path.join(root,`json/base/meta/${kind}`)))walk(JSON.parse(await readFile(path.join(root,`json/base/meta/${kind}/${file}`),'utf8')));
const patterns=(await readFile(path.join(root,'.git/info/sparse-checkout'),'utf8')).trim().split('\n');
for(const file of targets){if(!available.has(file.toLowerCase()))throw new Error(`Power target absent: ${file}`);patterns.push('/'+file);}
console.log(JSON.stringify({directPowerDependencies:targets.size}));
const r=spawnSync('git',['-C',root,'sparse-checkout','set','--no-cone','--stdin'],{input:[...new Set(patterns)].join('\n')+'\n',encoding:'utf8',maxBuffer:16*1024*1024});
if(r.status)throw new Error(r.stderr);console.log('Catalogue Power dependencies materialized');
