import { mkdir, writeFile } from 'node:fs/promises';
import { databasePool } from './config.js';
const snapshotId=process.argv[2];
if(!snapshotId || !/^[0-9a-f-]{36}$/i.test(snapshotId)) throw new Error('Kullanım: pnpm db:export <snapshot-uuid>. Çıktı output/snapshots içine yazılır.');
const pool=databasePool(true),client=await pool.connect();
try{
  await client.query('begin isolation level repeatable read read only');
  const snapshot=await client.query("select s.*,b.season_id,b.patch,b.channel from snapshots s join builds b on b.id=s.build_id where s.id=$1 and s.state='published'",[snapshotId]);
  if(!snapshot.rows.length) throw new Error('Yayınlanmış snapshot bulunamadı.');
  const root=`output/snapshots/${snapshotId}`;await mkdir(root,{recursive:true});
  let total=0;
  for(const kind of ['skills','items','aspects','affixes']){
    const records=await client.query('select payload from records where snapshot_id=$1 and kind=$2 order by id',[snapshotId,kind]);
    total+=records.rows.length;
    await writeFile(`${root}/${kind}.json`,JSON.stringify(records.rows.map(row=>row.payload),null,2)+'\n');
  }
  const mechanics=await client.query('select id,slug,domain,title,status,assumptions from mechanics where snapshot_id=$1 order by slug',[snapshotId]);
  const formulas=await client.query('select f.*,s.kind as source_kind,s.locator,s.sha256 from formulas f join sources s on s.id=f.source_id where f.snapshot_id=$1',[snapshotId]);
  const dependencies=await client.query('select * from formula_dependencies where snapshot_id=$1',[snapshotId]);
  const rng=await client.query('select r.*,s.kind as source_kind,s.locator,s.sha256 from rng_models r join sources s on s.id=r.source_id where r.snapshot_id=$1',[snapshotId]);
  await writeFile(`${root}/research.json`,JSON.stringify({build:snapshot.rows[0].build_id,snapshotId,mechanics:mechanics.rows,formulas:formulas.rows,dependencies:dependencies.rows,rng:rng.rows},null,2)+'\n');
  await writeFile(`${root}/metadata.json`,JSON.stringify({source:'DiabloZone PostgreSQL',gameBuild:total?snapshot.rows[0].build_id:null,researchBuild:snapshot.rows[0].build_id,season:snapshot.rows[0].season_id,patch:snapshot.rows[0].patch,channel:snapshot.rows[0].channel,snapshotId,generatedAt:new Date().toISOString(),schemaVersion:1},null,2)+'\n');
  await client.query('commit');console.log(`Exported ${root}; existing generated data was preserved.`);
}finally{client.release();await pool.end();}
