import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
test('Localization publication binds published source versions and prevents edits, moves and incomplete sets',async()=>{
  const db=new PGlite();
  try{
    for(const file of ['001_research.sql','002_game_catalog.sql','003_original_assets.sql','004_system_archive.sql','005_localization.sql'])await db.exec(await readFile('database/migrations/'+file,'utf8'));
    const game=(await db.query<{id:string}>("insert into snapshots(build_id,manifest) values('73552','{\"sourceVersion\":\"3.2.1.73552\"}') returning id")).rows[0].id;
    await db.query("update snapshots set state='published' where id=$1",[game]);
    const system=(await db.query<{id:string}>("insert into system_archives(source_version,source_commit,season_id,channel,input_sha256,record_count) values('3.2.1.73552',$1,15,'live',$2,1) returning id",['a'.repeat(40),'b'.repeat(64)])).rows[0].id;
    await db.query("insert into system_records(archive_id,kind,id,slug,name,payload) values($1,'Recipe','1','recipe-1','Synthetic fixture','{}')",[system]);
    await db.query("update system_archives set state='published' where id=$1",[system]);
    const create=async(hash:string)=>(await db.query<{id:string}>("insert into localization_sets(game_snapshot_id,system_archive_id,locale,source_version,data_source_version,input_sha256,context,entry_count) values($1,$2,'tr','3.2.2.73764','3.2.1.73552',$3,'{}',1) returning id",[game,system,hash])).rows[0].id;
    const id=await create('c'.repeat(64));await assert.rejects(db.query("update localization_sets set state='published' where id=$1",[id]),/count mismatch/);
    await db.query("insert into localized_entities(localization_set_id,record_key,payload) values($1,'skills:1','{}')",[id]);
    await db.query("update localization_sets set state='published' where id=$1",[id]);
    await assert.rejects(db.query("update localized_entities set payload='{}' where localization_set_id=$1",[id]),/immutable/);
    await assert.rejects(db.query('delete from localized_entities where localization_set_id=$1',[id]),/immutable/);
    await assert.rejects(db.query("update localization_sets set state='draft' where id=$1",[id]),/immutable/);
    const draft=await create('d'.repeat(64));await assert.rejects(db.query('update localized_entities set localization_set_id=$1 where localization_set_id=$2',[draft,id]),/immutable/);
  }finally{await db.close();}
});
