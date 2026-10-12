import {readFile,writeFile,mkdir} from 'node:fs/promises';
const data=process.argv[2]??'output/staging/f03';
const requests=new Set();
const add=h=>{if(Number.isInteger(h)&&h>0&&h<0xFFFFFFFF)requests.add(h);};
for(const kind of ['skills','affixes'])for(const s of JSON.parse(await readFile(`${data}/${kind}.json`,'utf8')))for(const h of Object.values(s.iconRef??{}))add(h);
for(const c of JSON.parse(await readFile(`${data}/classes.json`,'utf8')))add(c.centerImageHandle);
for(const t of Object.values(JSON.parse(await readFile(`${data}/skill-tree.json`,'utf8')).classes))for(const n of t.nodes){add(n.iconHandle);add(n.borderHandle);}
for(const kind of ['items','aspects'])for(const s of JSON.parse(await readFile(`${data}/${kind}.json`,'utf8'))){
  const raw=JSON.parse(await readFile(`.tmp/d4data/${s.source.file}`,'utf8'));
  const visit=(v)=>{if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(/hIconOverride|hImageHandle|hDefaultImage|hFemaleImage|hRuneIcon|hVendorIcon/.test(k))add(x);else if(typeof x==='object')visit(x);}};visit(raw);
}
const ui=JSON.parse(await readFile('.tmp/d4data/json/base/meta/UI/SkillTree.ui.json','utf8'));
function visit(v){if(!v||typeof v!=='object')return;for(const [key,x]of Object.entries(v)){if(key==='hImageHandle')add(x);else if(typeof x==='object')visit(x);}}visit(ui);
await mkdir('output/assets-local',{recursive:true});await writeFile('output/assets-local/requests.json',JSON.stringify([...requests].sort((a,b)=>a-b))+'\n');
console.log(JSON.stringify({uniqueHandles:requests.size,file:'output/assets-local/requests.json'}));
