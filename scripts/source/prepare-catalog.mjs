import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('.tmp/d4data');
const manifest=JSON.parse(await readFile('data/research/source-manifest.json','utf8'));
const git=args=>{const r=spawnSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status)throw new Error(r.stderr);return r.stdout.trim();};
if(git(['rev-parse','HEAD'])!==manifest.commit||git(['status','--porcelain']))throw new Error('Clean pinned source checkout required');
const inventory=JSON.parse(await readFile(`.tmp/source-evidence/${manifest.commit}-inventory.json`,'utf8'));
const files=inventory.entries.filter(e=>e.locale==='base'&&['Item','Affix','Aspect','ItemType'].includes(e.kind));
const lookup=new Map(inventory.entries.map(e=>[e.file.toLowerCase(),e.file]));
const kinds=['Item','Affix','Aspect','ItemType'];
const patterns=(await readFile(path.join(root,'.git/info/sparse-checkout'),'utf8')).trim().split('\n').filter(p=>!kinds.some(k=>p.startsWith(`/json/base/meta/${k}/`)||p.startsWith(`/json/enUS_Text/meta/StringList/${k}_`)));
for(const kind of kinds){patterns.push(`/json/base/meta/${kind}/`);patterns.push(`/json/enUS_Text/meta/StringList/${kind}_*.stl.json`);}
let strings=0;
for(const entry of files){
  const token=entry.file.split('/').at(-1).replace(/\.[^.]+\.json$/,'');
  const file=lookup.get(`json/enUS_Text/meta/StringList/${entry.kind}_${token}.stl.json`.toLowerCase());
  if(file)strings++;
}
const counts=files.reduce((a,e)=>(a[e.kind]=(a[e.kind]??0)+1,a),{});
const input=[...new Set(patterns)].join('\n')+'\n';await writeFile('.tmp/source-evidence/catalog-sparse.txt',input);
console.log(JSON.stringify({sourceCommit:manifest.commit,counts,localizationFiles:strings,patterns:input.split('\n').length-1}));
const r=spawnSync('git',['-C',root,'sparse-checkout','set','--no-cone','--stdin'],{input,encoding:'utf8',maxBuffer:16*1024*1024});
if(r.status)throw new Error(r.stderr);console.log('Complete pinned item/affix/aspect inventory materialized');
