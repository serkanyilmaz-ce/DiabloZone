import {databasePool} from './config.js';
import {systemBundle} from './system-bundle.js';
const {bundle,sha256}=await systemBundle(process.argv[2]??'output/system-staging.json');
if(!bundle.records.length)throw new Error('Empty system archive');
const pool=databasePool(),client=await pool.connect();
try{
  await client.query('begin');await client.query('select pg_advisory_xact_lock(150005)');
  const existing=await client.query("select id from system_archives where input_sha256=$1 and state='published'",[sha256]);
  let id=existing.rows[0]?.id;
  if(!id){
    id=(await client.query('insert into system_archives(source_version,source_commit,season_id,channel,input_sha256,record_count) values($1,$2,$3,$4,$5,$6) returning id',[bundle.sourceVersion,bundle.sourceCommit,bundle.season,bundle.channel,sha256,bundle.records.length])).rows[0].id;
    for(const row of bundle.records)await client.query('insert into system_records(archive_id,kind,id,slug,name,payload) values($1,$2,$3,$4,$5,$6)',[id,row.kind,row.id,row.slug,row.name,JSON.stringify(row)]);
    await client.query("update system_archives set state='published' where id=$1",[id]);
  }
  await client.query('commit');console.log(JSON.stringify({archiveId:id,inputSha256:sha256,records:bundle.records.length,preserved:!!existing.rows.length}));
}catch{await client.query('rollback');throw new Error('System archive import failed; transaction rolled back');}
finally{client.release();await pool.end();}
