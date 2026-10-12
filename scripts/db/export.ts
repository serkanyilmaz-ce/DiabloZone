import { mkdir,writeFile } from 'node:fs/promises';
import { databasePool } from './config.js';
import { isUuid } from '../../src/lib/api-query.js';
import { loadCatalog } from './catalog.js';
const snapshotId=process.argv[2];
if(!snapshotId||!isUuid(snapshotId))throw new Error('Usage: db:export <snapshot UUID>');
const pool=databasePool(true),client=await pool.connect();
try{
  await client.query('begin isolation level repeatable read read only');
  const snapshot=(await client.query("select s.*,b.season_id,b.patch,b.channel from snapshots s join builds b on b.id=s.build_id where s.id=$1 and s.state='published'",[snapshotId])).rows[0];
  if(!snapshot)throw new Error('Published snapshot not found');
  const root=`output/snapshots/${snapshotId}`;
  await mkdir(root,{recursive:true});
  const write=async(name:string,value:unknown)=>writeFile(`${root}/${name}.json`,JSON.stringify(value,null,2)+'\n');
  const isGame=snapshot.manifest.kind==='game_data';
  let total=0;
  for(const kind of ['skills','items','aspects','affixes','classes']){
    const records=await client.query('select payload from records where snapshot_id=$1 and kind=$2 order by id',[snapshotId,kind]);
    total+=records.rows.length;await write(kind,records.rows.map(row=>row.payload));
  }
  const boards=(await client.query("select payload from records where snapshot_id=$1 and kind='skill-tree' order by id",[snapshotId])).rows;
  await write('skill-tree',{gameBuild:isGame?snapshot.build_id:null,classes:Object.fromEntries(boards.map(row=>[row.payload.classCode,row.payload]))});
  const mechanics=(await client.query('select id,slug,domain,title,status,assumptions from mechanics where snapshot_id=$1 order by slug',[snapshotId])).rows;
  const formulas=(await client.query('select * from formulas where snapshot_id=$1',[snapshotId])).rows;
  const rng=(await client.query('select * from rng_models where snapshot_id=$1',[snapshotId])).rows;
  const sources=(await client.query('select id,kind,locator,sha256 from sources where snapshot_id=$1 order by locator',[snapshotId])).rows;
  const links=(await client.query('select source_kind,source_id,target_kind,target_id,relation from record_links where snapshot_id=$1 order by source_kind,source_id,relation,target_id',[snapshotId])).rows;
  await write('research',{snapshotId,mechanics,formulas,rng});
  await write('sources',sources);await write('links',links);
  if(isGame)await write('provenance',{sourceCommit:snapshot.manifest.sourceCommit,sourceVersion:snapshot.manifest.sourceVersion,files:snapshot.manifest.provenance});
  await write('metadata',{schemaVersion:isGame?2:1,source:'DiabloZone PostgreSQL',snapshotId,gameBuild:isGame?snapshot.build_id:null,researchBuild:!isGame?snapshot.build_id:null,
    season:snapshot.season_id,patch:snapshot.patch,channel:snapshot.channel,sourceVersion:snapshot.manifest.sourceVersion,sourceCommit:snapshot.manifest.sourceCommit,
    inputSha256:snapshot.manifest.inputSha256,sample:snapshot.manifest.sample===true,phase:snapshot.manifest.phase,recordCount:total+boards.length,generatedAt:new Date().toISOString()});
  if(isGame){
    const checked=await loadCatalog(root);
    if(checked.inputSha256!==snapshot.manifest.inputSha256||checked.links.length!==links.length)throw new Error('Database export seal or relationship count mismatch');
  }
  await client.query('commit');console.log(JSON.stringify({exportDirectory:root,snapshotId,kind:snapshot.manifest.kind,records:total+boards.length,links:links.length,verified:true}));
}finally{client.release();await pool.end();}
