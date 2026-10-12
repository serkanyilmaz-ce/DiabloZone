import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('.tmp/d4data');
const inventory=JSON.parse(await readFile('.tmp/source-evidence/33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0-inventory.json','utf8'));
const files=inventory.entries.filter(e=>e.locale==='base'&&(
  e.kind==='Texture'&&/2DUI.*(SkillTree|Skill|Class|Inventory|Affix|Aspect|Icon)/i.test(e.file)||
  e.kind==='UI'&&/\/(SkillTree|Skills|FrontEnd_CharacterCreate_Screen|CharacterDetails)\.ui\.json$/i.test(e.file)
)).map(e=>'/'+e.file);
const old=(await readFile(path.join(root,'.git/info/sparse-checkout'),'utf8')).trim().split('\n');
const r=spawnSync('git',['-C',root,'sparse-checkout','set','--no-cone','--stdin'],{input:[...new Set([...old,...files])].join('\n')+'\n',encoding:'utf8',maxBuffer:8*1024*1024});
if(r.status)throw new Error(r.stderr);console.log(JSON.stringify({materialized:files.length}));
