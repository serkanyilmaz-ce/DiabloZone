import {databasePool} from './config.js';
import {localeBundle} from './locales-bundle.js';
import {readableTooltip} from '../../src/lib/tooltip.js';
import {createHash} from 'node:crypto';
const {context,entries,inputSha256}=await localeBundle(process.argv[2]??'output/localization/staging.json');
const pool=databasePool(),client=await pool.connect();
try{
  await client.query('begin');await client.query('select pg_advisory_xact_lock(150006)');
  const existing=(await client.query("select id from localization_sets where input_sha256=$1 and state='published'",[inputSha256])).rows[0];
  let id=existing?.id;
  if(!id){
    const game=(await client.query("select kind||':'||id as key,payload from records where snapshot_id=$1",[context.gameSnapshotId])).rows;
    const systems=(await client.query("select 'systems:'||id as key,payload from system_records where archive_id=$1",[context.systemArchiveId])).rows;
    const records=new Map([...game,...systems].map(r=>[r.key,r.payload]));
    for(const entry of entries){const record=records.get(entry.key);if(!record)throw new Error('Locale record not in source snapshot');
      for(const [key,field] of Object.entries(entry.fields)){
        const raw=key==='description'?record.descriptionTemplate:record[key];
        if(readableTooltip(raw)!==field.en.replaceAll('\r\n','\n'))throw new Error('English locale baseline mismatch');
        if(key==='description'&&createHash('sha256').update(raw.replaceAll('\r\n','\n').trim()).digest('hex')!==field.rawEnglishSha256)throw new Error('Raw English baseline hash mismatch');
      }
    }
    id=(await client.query('insert into localization_sets(game_snapshot_id,system_archive_id,locale,source_version,data_source_version,input_sha256,context,entry_count) values($1,$2,$3,$4,$5,$6,$7,$8) returning id',[context.gameSnapshotId,context.systemArchiveId,context.locale,context.sourceVersion,context.dataSourceVersion,inputSha256,JSON.stringify(context),entries.length])).rows[0].id;
    for(const row of entries)await client.query('insert into localized_entities(localization_set_id,record_key,payload) values($1,$2,$3)',[id,row.key,JSON.stringify(row)]);
    await client.query("update localization_sets set state='published' where id=$1",[id]);
  }
  await client.query('commit');console.log(JSON.stringify({localeSetId:id,inputSha256,entries:entries.length,preserved:!!existing}));
}catch(error){await client.query('rollback');throw new Error(`Localization import rolled back: ${(error as Error).message}`,{cause:error});}
finally{client.release();await pool.end();}
