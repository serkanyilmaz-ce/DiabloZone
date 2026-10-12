import { databasePool } from './config.js';
import { loadCatalog } from './catalog.js';
const catalog=await loadCatalog(process.argv[2]??'data/generated');
if(process.env.DATA_SEASON&&Number(process.env.DATA_SEASON)!==catalog.metadata.season)throw new Error('Explicit season differs from source');
if(process.env.DATA_CHANNEL&&process.env.DATA_CHANNEL!==catalog.metadata.channel)throw new Error('Explicit channel differs from source');
const pool=databasePool(),client=await pool.connect();
try{
  await client.query('begin');
  await client.query('select pg_advisory_xact_lock(150003)');
  const existing=await client.query("select id from snapshots where state='published' and manifest->>'kind'='game_data' and manifest->>'inputSha256'=$1",[catalog.inputSha256]);
  if(existing.rows.length){
    await client.query('commit');console.log(JSON.stringify({snapshotId:existing.rows[0].id,preserved:true,inputSha256:catalog.inputSha256}));
  }else{
    const context=catalog.context;
    await client.query('insert into builds(id,season_id,patch,channel) values($1,$2,$3,$4) on conflict(id) do nothing',[context.gameBuild,context.season,context.patch,context.channel]);
    const actual=(await client.query('select season_id,channel,patch from builds where id=$1',[context.gameBuild])).rows[0];
    if(actual.season_id!==context.season||actual.channel!==context.channel||actual.patch!==context.patch)throw new Error('Build context mismatch');
    const manifest={kind:'game_data',schemaVersion:2,inputSha256:catalog.inputSha256,...context,phase:'F02',provenance:catalog.provenance,files:catalog.files.map(file=>({kind:file.kind,sha256:file.sha256,count:file.records.length})),links:catalog.links.length};
    const snapshotId=(await client.query('insert into snapshots(build_id,manifest) values($1,$2) returning id',[context.gameBuild,JSON.stringify(manifest)])).rows[0].id;
    const sourceIds=new Map<string,string>();
    for(const source of catalog.provenance){
      const locator=`https://github.com/DiabloTools/d4data/blob/${source.commit}/${source.file}`;
      const id=(await client.query("insert into sources(snapshot_id,kind,locator,sha256) values($1,'datamine',$2,$3) returning id",[snapshotId,locator,source.sha256])).rows[0].id;
      sourceIds.set(source.file,id);
    }
    for(const file of catalog.files){
      await client.query("insert into sources(snapshot_id,kind,locator,sha256) values($1,'normalized_export',$2,$3)",[snapshotId,`catalog:${file.kind}`,file.sha256]);
      for(const record of file.records)await client.query('insert into records(snapshot_id,kind,id,slug,name,source_id,payload) values($1,$2,$3,$4,$5,$6,$7)',[snapshotId,file.kind,record.id,'slug' in record?record.slug:null,'name' in record?record.name:null,sourceIds.get(record.source.file),JSON.stringify(record)]);
    }
    for(const link of catalog.links)await client.query('insert into record_links(snapshot_id,source_kind,source_id,target_kind,target_id,relation) values($1,$2,$3,$4,$5,$6)',[snapshotId,link.sourceKind,link.sourceId,link.targetKind,link.targetId,link.relation]);
    await client.query("update snapshots set state='published' where id=$1",[snapshotId]);
    await client.query('commit');console.log(JSON.stringify({snapshotId,preserved:false,inputSha256:catalog.inputSha256,records:catalog.files.reduce((sum,file)=>sum+file.records.length,0),links:catalog.links.length}));
  }
}catch{
  await client.query('rollback');
  throw new Error('Game import failed; transaction rolled back. Check sealed catalogue and database.');
}finally{client.release();await pool.end();}
