import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {databasePool} from './config.js';
import {digest} from './catalog.js';
import {isUuid} from '../../src/lib/api-query.js';
const id=process.argv[2];if(!id||!isUuid(id))throw new Error('Published asset-set UUID required');
const output=path.resolve(process.argv[3]??`output/asset-sets/${id}`);
const pool=databasePool(true),client=await pool.connect();
try{
  await client.query('begin isolation level repeatable read read only');
  const set=(await client.query("select * from asset_sets where id=$1 and state='published'",[id])).rows[0];
  if(!set)throw new Error('Published asset set not found');
  const assets=(await client.query('select payload from game_assets where asset_set_id=$1 order by handle',[id])).rows.map(row=>row.payload);
  if(digest({context:set.manifest,assets})!==set.input_sha256)throw new Error('Original asset database export seal differs');
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'assets-manifest.json'),JSON.stringify({...set.manifest,assets,assetSetId:id,inputSha256:set.input_sha256,storageSource:'DiabloZone PostgreSQL',requested:assets.length,exportedAt:new Date().toISOString()},null,2)+'\n');
  await client.query('commit');console.log(JSON.stringify({assetSetId:id,output,inputSha256:set.input_sha256,assets:assets.length,verified:true}));
}catch{await client.query('rollback');throw new Error('Original asset reader export failed; transaction rolled back');}
finally{client.release();await pool.end();}
