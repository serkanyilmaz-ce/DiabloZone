import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('data/research/assets-manifest.json','utf8'));
const directory=process.env.D4_CATALOG_DIR??'data/generated';
const skills=JSON.parse(await readFile(`${directory}/skills.json`,'utf8'));
test('every class-tree skill uses an actual extracted game handle and sealed PNG',async()=>{
  assert.equal(manifest.source,'local-read-only-CASC');
  const rows=new Map<number,any>(manifest.assets.map((row:any)=>[row.handle,row]));
  const used=new Set<number>(skills.map((skill:any)=>skill.iconRef?.normalHandle));
  for(const handle of used){
    const row=rows.get(handle);assert(row&&row.status==='extracted',`Unresolved original handle ${handle}`);
    const bytes=await readFile(`public/${row.path}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
    assert.equal(bytes.readUInt32BE(16),row.width);assert.equal(bytes.readUInt32BE(20),row.height);
  }
});
