import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { parseRecordQuery, isUuid, escapeLike } from '../src/lib/api-query';
test('actual PostgreSQL engine enforces snapshot provenance, probabilities and immutability',async()=>{
  const db=new PGlite();
  try{
    await db.exec(await readFile('database/migrations/001_research.sql','utf8'));
    const create=async()=>{
      const s=await db.query<{id:string}>("insert into snapshots(build_id) values('73552') returning id");
      const snapshot=s.rows[0].id;
      const r=await db.query<{id:string}>("insert into sources(snapshot_id,kind,locator) values($1,'measurement','synthetic-test') returning id",[snapshot]);
      const m=await db.query<{id:string}>("insert into mechanics(snapshot_id,slug,domain,title,status) values($1,'test','damage','Synthetic test','hypothesis') returning id",[snapshot]);
      return {snapshot,source:r.rows[0].id,mechanic:m.rows[0].id};
    };
    const a=await create(),b=await create();
    const insert='insert into rng_models(snapshot_id,mechanic_id,source_id,distribution,probability,independence_status) values($1,$2,$3,$4,$5,$6)';
    await db.query(insert,[a.snapshot,a.mechanic,a.source,'unknown',null,'unknown']);
    await assert.rejects(db.query(insert,[a.snapshot,a.mechanic,a.source,'bernoulli',1.1,'assumed']));
    await assert.rejects(db.query(insert,[a.snapshot,b.mechanic,a.source,'bernoulli',.5,'assumed']));
    await assert.rejects(db.query(insert,[a.snapshot,a.mechanic,b.source,'bernoulli',.5,'assumed']));
    await db.query("insert into records(snapshot_id,kind,id,source_id,payload) values($1,'skills','test',$2,'{}')",[a.snapshot,a.source]);
    await db.query("update snapshots set state='published' where id=$1",[a.snapshot]);
    await assert.rejects(db.query("update records set name='changed' where snapshot_id=$1",[a.snapshot]),/immutable/);
    await assert.rejects(db.query('delete from records where snapshot_id=$1',[a.snapshot]),/immutable/);
    await assert.rejects(db.query("insert into records(snapshot_id,kind,id,source_id,payload) values($1,'skills','another',$2,'{}')",[a.snapshot,a.source]),/immutable/);
    await assert.rejects(db.query("update snapshots set state='draft' where id=$1",[a.snapshot]),/immutable/);
    await assert.rejects(db.query("update builds set channel='ptr' where id='73552'"),/immutable/);
    const preserved=await db.query<{probability:number|null}>('select probability from rng_models where snapshot_id=$1',[a.snapshot]);
    assert.equal(preserved.rows[0].probability,null);
  }finally{await db.close();}
});
test('API query limits and identifier validation reject malformed requests',()=>{
  assert.deepEqual(parseRecordQuery(new URLSearchParams('kind=items&page=2&q=ring')),{kind:'items',page:2,query:'ring',limit:24,offset:24});
  for(const query of ['kind=secret','page=-1','page=1.2','page=0',`q=${'a'.repeat(121)}`])assert.throws(()=>parseRecordQuery(new URLSearchParams(query)),RangeError);
  assert.equal(isUuid("' or 1=1"),false);
  assert.equal(escapeLike('10%_x'),'10\\%\\_x');
});
