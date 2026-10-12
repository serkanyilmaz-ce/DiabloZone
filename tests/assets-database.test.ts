import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('original asset registry preserves separate build identity, rejects unsealed images and published mutations',async()=>{
  const db=new PGlite();
  try{
    await db.exec(await readFile('database/migrations/003_original_assets.sql','utf8'));
    const create=async()=>(await db.query<{id:string}>('insert into asset_sets(source_version,data_source_version,data_source_commit,input_sha256,build_info_sha256,extractor_commit,manifest) values($1,$2,$3,$4,$5,$6,$7) returning id',['3.2.2.73764','3.2.1.73552','a'.repeat(40),Math.random().toString(16).slice(2).padEnd(64,'0'),'b'.repeat(64),'c'.repeat(40),'{}'])).rows[0].id;
    const a=await create(),b=await create();
    await assert.rejects(db.query("insert into game_assets(asset_set_id,handle,status,payload) values($1,2402480109,'extracted','{}')",[a]));
    await db.query("insert into game_assets(asset_set_id,handle,status,path,sha256,width,height,payload) values($1,2402480109,'extracted','assets/game/3.2.2.73764/2402480109.png',$2,128,128,'{}')",[a,'d'.repeat(64)]);
    await db.query("update asset_sets set state='published' where id=$1",[a]);
    await assert.rejects(db.query('update game_assets set asset_set_id=$1 where asset_set_id=$2',[b,a]),/immutable/);
    await assert.rejects(db.query('delete from game_assets where asset_set_id=$1',[a]),/immutable/);
    await assert.rejects(db.query("update asset_sets set source_version='3.2.1.73552' where id=$1",[a]),/immutable/);
    await assert.rejects(db.query("insert into game_assets(asset_set_id,handle,status,payload) values($1,1,'unresolved','{}')",[a]),/immutable/);
    assert.equal((await db.query<{source_version:string;data_source_version:string}>('select source_version,data_source_version from asset_sets where id=$1',[a])).rows[0].source_version,'3.2.2.73764');
  }finally{await db.close();}
});
