import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=realpathSync(process.env.DIABLOZONE_RELEASE_ROOT??fileURLToPath(new URL('../../../',import.meta.url)));
if(path.dirname(root)!=='/srv/diablozone/releases')throw new Error('Native release required');
const require=createRequire(path.join(root,'package.json')),{parse}=require('dotenv'),{Pool}=require('pg');
const {digest,canonical}=await import(path.join(root,'build/service/scripts/db/catalog.js'));
const manifest=JSON.parse(readFileSync(path.join(root,'data/research/localization-manifest.json')));
const projection=JSON.parse(readFileSync(path.join(root,'dist',manifest.url)));
const readerPool=new Pool({connectionString:parse(readFileSync('/etc/diablozone/api.env')).DATABASE_READ_URL,max:1}),writerPool=new Pool({connectionString:parse(readFileSync('/etc/diablozone/import.env')).DATABASE_URL,max:1});
const reader=await readerPool.connect(),writer=await writerPool.connect();
const origin='https://diablozone.152.70.4.125.sslip.io';
async function denied(client,sql,args,code){await client.query('begin read write');try{await assert.rejects(client.query(sql,args),e=>e.code===code);}finally{await client.query('rollback');}}
try{
  const set=(await reader.query("select * from localization_sets where id=$1 and state='published'",[manifest.localeSetId])).rows[0];
  assert.equal(set.game_snapshot_id,manifest.gameSnapshotId);assert.equal(set.data_source_version,'3.2.1.73552');assert.equal(set.source_version,'3.2.2.73764');
  const entries=(await reader.query('select payload from localized_entities where localization_set_id=$1',[set.id])).rows.map(r=>r.payload).sort((a,b)=>a.key.localeCompare(b.key));
  assert.equal(entries.length,set.entry_count);assert.equal(digest({context:set.context,entries}),manifest.inputSha256);
  for(const row of entries){const fields=Object.fromEntries(Object.entries(row.fields).map(([key,f])=>[key,{en:f.en,tr:f.tr}]));assert.equal(canonical(fields),canonical(projection.records[row.key]));}
  const skills=entries.filter(r=>r.key.startsWith('skills:')&&r.fields.description);assert.equal(skills.length,1600);
  await denied(reader,'update localized_entities set payload=payload where localization_set_id=$1',[set.id],'42501');
  await denied(writer,'delete from localized_entities where localization_set_id=$1',[set.id],'P0001');
  await denied(writer,"update localization_sets set state='draft' where id=$1",[set.id],'P0001');
  const api=await fetch(`${origin}/api/v1/localization-sets/${set.id}/entities?key=skills%3A165023`);assert.equal(api.status,200);const body=await api.json();assert.equal(body.total,1);assert.equal(body.data[0].payload.fields.name.tr,'Ateş Topu');
  assert.equal((await fetch(`${origin}/api/v1/localization-sets?locale=unknown`)).status,400);
  assert.equal((await fetch(`${origin}/api/v1/localization-sets/${set.id}/entities?key=skills%3Abad`)).status,400);
  assert.equal((await fetch('https://aryaland.online/')).status,200);
  console.log(JSON.stringify({localeSetId:set.id,entries:entries.length,skillDescriptions:skills.length,seal:manifest.inputSha256,checks:['Every compact locale field matches actual PostgreSQL payload','Locale seal and separate source builds verified','All 1600 skill descriptions localized','Reader ACL and published set/records immutable','Localized API and invalid query rejection','Aryaland HTTPS preserved']}));
}finally{reader.release();writer.release();await readerPool.end();await writerPool.end();}
