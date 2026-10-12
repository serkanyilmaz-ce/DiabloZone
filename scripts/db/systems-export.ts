import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {databasePool} from './config.js';
import {systemBundle} from './system-bundle.js';
import {isUuid} from '../../src/lib/api-query.js';
const id=process.argv[2];if(!id||!isUuid(id))throw new Error('System archive UUID required');
const output=path.resolve(process.argv[3]??`output/system-archives/${id}/systems.json`);
const pool=databasePool(true),client=await pool.connect();
try{
  await client.query('begin isolation level repeatable read read only');
  const archive=(await client.query("select * from system_archives where id=$1 and state='published'",[id])).rows[0];if(!archive)throw new Error('Published system archive required');
  const records=(await client.query('select payload from system_records where archive_id=$1 order by kind,id',[id])).rows.map(r=>r.payload);
  if(records.length!==archive.record_count)throw new Error('System count mismatch');
  await mkdir(path.dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify({archiveId:id,storageSource:'DiabloZone PostgreSQL',sourceVersion:archive.source_version,sourceCommit:archive.source_commit,season:archive.season_id,channel:archive.channel,inputSha256:archive.input_sha256,records},null,2)+'\n');
  await systemBundle(output);await client.query('commit');console.log(JSON.stringify({file:output,archiveId:id,records:records.length,inputSha256:archive.input_sha256,verified:true}));
}finally{client.release();await pool.end();}
