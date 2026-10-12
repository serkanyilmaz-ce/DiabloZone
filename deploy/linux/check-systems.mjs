import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=realpathSync(fileURLToPath(new URL('../../../',import.meta.url)));
if(path.dirname(root)!=='/srv/diablozone/releases')throw new Error('Native release required');
const require=createRequire(path.join(root,'package.json')),{parse}=require('dotenv'),{Pool}=require('pg');
const {systemBundle}=await import(path.join(root,'build/service/scripts/db/system-bundle.js'));
const {canonical}=await import(path.join(root,'build/service/scripts/db/catalog.js'));
const {bundle,sha256}=await systemBundle(path.join(root,'data/generated/systems.json'));
const readerPool=new Pool({connectionString:parse(readFileSync('/etc/diablozone/api.env')).DATABASE_READ_URL,max:1});
const writerPool=new Pool({connectionString:parse(readFileSync('/etc/diablozone/import.env')).DATABASE_URL,max:1});
const reader=await readerPool.connect(),writer=await writerPool.connect();
const origin='https://diablozone.152.70.4.125.sslip.io';
async function denied(client,sql,args,code){await client.query('begin');try{await assert.rejects(client.query(sql,args),e=>e.code===code);}finally{await client.query('rollback');}}
try{
  const archive=(await reader.query("select * from system_archives where id=$1 and state='published'",[bundle.archiveId])).rows[0];
  assert.equal(archive.input_sha256,sha256);assert.equal(archive.record_count,bundle.records.length);
  const actual=(await reader.query('select kind,id,payload from system_records where archive_id=$1',[bundle.archiveId])).rows;
  const rows=new Map(actual.map(r=>[r.kind+':'+r.id,r.payload]));assert.equal(rows.size,bundle.records.length);
  for(const row of bundle.records)assert.equal(canonical(row),canonical(rows.get(row.kind+':'+row.id)));
  await denied(reader,'update system_records set name=name where archive_id=$1',[bundle.archiveId],'42501');
  await denied(writer,'delete from system_records where archive_id=$1',[bundle.archiveId],'P0001');
  await denied(writer,"update system_archives set state='draft' where id=$1",[bundle.archiveId],'P0001');
  await writer.query('begin');
  try{
    const draft=(await writer.query("insert into system_archives(source_version,source_commit,season_id,channel,input_sha256,record_count) values($1,$2,15,'live',$3,1) returning id",[bundle.sourceVersion,bundle.sourceCommit,'0'.repeat(64)])).rows[0].id;
    await assert.rejects(writer.query("update system_archives set state='published' where id=$1",[draft]),e=>e.code==='P0001');
  }finally{await writer.query('rollback');}
  const kinds=[...new Set(bundle.records.map(r=>r.kind))];
  for(const kind of kinds){const response=await fetch(`${origin}/api/v1/system-archives/${bundle.archiveId}/records?kind=${kind}`);assert.equal(response.status,200);const body=await response.json();assert.equal(body.archive.id,bundle.archiveId);assert.equal(body.total,bundle.records.filter(r=>r.kind===kind).length);for(const row of body.data)assert.equal(canonical(row.payload),canonical(rows.get(row.kind+':'+row.id)));}
  assert.equal((await fetch(`${origin}/api/v1/system-archives/${bundle.archiveId}/records?kind=Secret`)).status,400);
  let index=0;const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  await Promise.all(Array.from({length:6},async()=>{while(index<bundle.records.length){const row=bundle.records[index++],response=await fetch(`${origin}/systems/${row.slug}/`);assert.equal(response.status,200);const html=await response.text();assert(html.includes(bundle.archiveId));assert(html.includes(escape(row.name)));}}));
  assert.equal((await fetch('https://aryaland.online/')).status,200);
  console.log(JSON.stringify({archiveId:bundle.archiveId,seal:sha256,records:rows.size,kinds,checks:['All PostgreSQL payloads match reader export','Reader writes denied','Published records and archive immutable','Incomplete publication rejected; fixture rolled back','All kind API counts and payloads match','All detail HTML routes match archive and name','Existing Aryaland HTTPS preserved']}));
}finally{reader.release();writer.release();await readerPool.end();await writerPool.end();}
