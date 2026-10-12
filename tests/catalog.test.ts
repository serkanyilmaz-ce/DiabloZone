import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,mkdtemp,writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { digest,loadCatalog } from '../scripts/db/catalog.js';

test('catalogue seal survives JSONB key reordering and rejects broken relationships',async()=>{
  const original=await loadCatalog();
  assert.equal(original.files.find(file=>file.kind==='items')!.records.length,1);
  assert.equal(original.links.filter(link=>link.relation==='item_affix').length,5);
  const directory=await mkdtemp(path.join(os.tmpdir(),'diablozone-catalog-'));
  for(const file of original.files){
    // Recursive JSONB-like key order change, preserving all nested data.
    const reorder=(value:any):any=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,entry])=>[key,reorder(entry)])):value;
    const full=file.records.map(reorder);
    await writeFile(path.join(directory,`${file.kind}.json`),JSON.stringify(file.kind==='skill-tree'?{classes:Object.fromEntries(full.map((record:any)=>[record.classCode,record]))}:full));
  }
  await writeFile(path.join(directory,'metadata.json'),JSON.stringify({...original.metadata,inputSha256:original.inputSha256}));
  await writeFile(path.join(directory,'provenance.json'),await readFile('data/generated/provenance.json','utf8'));
  const roundtrip=await loadCatalog(directory);
  assert.equal(roundtrip.inputSha256,original.inputSha256);
  assert.equal(digest({b:2,a:1}),digest({a:1,b:2}));
  const items=JSON.parse(await readFile(path.join(directory,'items.json'),'utf8'));
  items[0].affixIds.push('missing-reference');
  await writeFile(path.join(directory,'items.json'),JSON.stringify(items));
  await assert.rejects(loadCatalog(directory),/Unresolved catalogue relationship/);
});

test('game relationship migration rejects cross-snapshot endpoints, duplicate routes and published edits',async()=>{
  const db=new PGlite();
  try{
    await db.exec(await readFile('database/migrations/001_research.sql','utf8'));
    await db.exec(await readFile('database/migrations/002_game_catalog.sql','utf8'));
    const make=async()=>{
      const snapshot=(await db.query<{id:string}>("insert into snapshots(build_id) values('73552') returning id")).rows[0].id;
      const source=(await db.query<{id:string}>("insert into sources(snapshot_id,kind,locator) values($1,'measurement','fixture') returning id",[snapshot])).rows[0].id;
      await db.query("insert into records(snapshot_id,kind,id,slug,source_id,payload) values($1,'classes','1','class',$2,'{}'),($1,'skills','2','skill',$2,'{}')",[snapshot,source]);
      return {snapshot,source};
    };
    const a=await make(),b=await make();
    const insert="insert into record_links(snapshot_id,source_kind,source_id,target_kind,target_id,relation) values($1,'classes','1','skills',$2,'class_skill')";
    await db.query(insert,[a.snapshot,'2']);
    await db.query("insert into records(snapshot_id,kind,id,source_id,payload) values($1,'skills','other-only',$2,'{}')",[b.snapshot,b.source]);
    await assert.rejects(db.query(insert,[a.snapshot,'other-only']));
    await assert.rejects(db.query("insert into records(snapshot_id,kind,id,slug,source_id,payload) values($1,'skills','3','skill',$2,'{}')",[a.snapshot,a.source]));
    await db.query("update snapshots set state='published' where id=$1",[a.snapshot]);
    await assert.rejects(db.query('delete from record_links where snapshot_id=$1',[a.snapshot]),/immutable/);
    await assert.rejects(db.query("update records set name='changed' where snapshot_id=$1 and kind='classes'",[a.snapshot]),/immutable/);
  }finally{await db.close();}
});
