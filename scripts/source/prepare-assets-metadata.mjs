import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('.tmp/d4data');
const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
const inventory=JSON.parse(await readFile(`.tmp/source-evidence/${manifest.commit}-inventory.json`,'utf8'));
const available=new Set(inventory.entries.map(e=>e.file));
const report=JSON.parse(await readFile(process.argv[2]??'output/assets-local/3.2.2.73764/report.json','utf8'));
const patterns=(await readFile(path.join(root,'.git/info/sparse-checkout'),'utf8')).trim().split('\n');
const files=new Set(report.assets.filter(a=>a.atlasName).map(a=>`json/base/meta/Texture/${a.atlasName}.tex.json`));
const missing=[];
for(const file of files){if(available.has(file))patterns.push('/'+file);else missing.push(file);}
console.log(JSON.stringify({atlasDefinitions:files.size,missingInPinnedSource:missing.length}));
const r=spawnSync('git',['-C',root,'sparse-checkout','set','--no-cone','--stdin'],{input:[...new Set(patterns)].join('\n')+'\n',encoding:'utf8',maxBuffer:16*1024*1024});
if(r.status)throw new Error(r.stderr);console.log('Pinned original atlas definitions materialized');
