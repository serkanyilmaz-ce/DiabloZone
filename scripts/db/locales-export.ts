import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {databasePool} from './config.js';
import {digest} from './catalog.js';
import {localeBundle} from './locales-bundle.js';
import {isUuid} from '../../src/lib/api-query.js';
const id=process.argv[2],output=path.resolve(process.argv[3]??'output/localization/reader-export.json');if(!id||!isUuid(id))throw new Error('Locale set UUID required');
const pool=databasePool(true),client=await pool.connect();
try{
  await client.query('begin isolation level repeatable read read only');
  const set=(await client.query("select * from localization_sets where id=$1 and state='published'",[id])).rows[0];if(!set)throw new Error('Published locale set required');
  const entries=(await client.query('select payload from localized_entities where localization_set_id=$1 order by record_key',[id])).rows.map(r=>r.payload).sort((a,b)=>a.key.localeCompare(b.key));
  if(entries.length!==set.entry_count||digest({context:set.context,entries})!==set.input_sha256)throw new Error('Locale reader seal mismatch');
  await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify({...set.context,entries,inputSha256:set.input_sha256,localeSetId:id,storageSource:'DiabloZone PostgreSQL'},null,2)+'\n');
  await localeBundle(output);await client.query('commit');console.log(JSON.stringify({file:output,localeSetId:id,entries:entries.length,inputSha256:set.input_sha256,verified:true}));
}finally{client.release();await pool.end();}
