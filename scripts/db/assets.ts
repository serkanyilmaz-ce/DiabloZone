import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {databasePool} from './config.js';
import {digest} from './catalog.js';
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const schema=z.object({source:z.literal('local-read-only-CASC'),sourceVersion:z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),dataSourceVersion:z.string(),dataSourceCommit:z.string().regex(/^[a-f0-9]{40}$/),buildInfoSha256:hash,extractorCommit:z.string().regex(/^[a-f0-9]{40}$/),assets:z.array(z.object({handle:z.number().int().min(1).max(4294967294),status:z.enum(['extracted','unresolved','unavailable']),path:z.string().optional(),sha256:hash.optional(),width:z.number().int().positive().optional(),height:z.number().int().positive().optional(),atlasSno:z.number().int().positive().optional()}).passthrough())});
const raw=JSON.parse(await readFile(process.argv[2]??'data/research/assets-manifest.json','utf8'));
const manifest=schema.parse(raw);
if(new Set(manifest.assets.map(a=>a.handle)).size!==manifest.assets.length)throw new Error('Duplicate original asset handle');
const publicRoot=path.resolve(process.argv[3]??'dist');
for(const asset of manifest.assets){
  if(asset.status!=='extracted')continue;
  if(!asset.path||! /^assets\/game\/\d+\.\d+\.\d+\.\d+\/\d+(?:-[a-f0-9]{64})?\.png$/.test(asset.path)||!asset.sha256||!asset.width||!asset.height)throw new Error('Unsealed original image');
  const bytes=await readFile(path.join(publicRoot,asset.path));
  if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256||bytes.readUInt32BE(16)!==asset.width||bytes.readUInt32BE(20)!==asset.height)throw new Error('Original image digest or dimensions differ');
}
const {assets,...context}=manifest;
const inputSha256=digest({context,assets:[...assets].sort((a,b)=>a.handle-b.handle)});
const pool=databasePool(),client=await pool.connect();
try{
  await client.query('begin');await client.query('select pg_advisory_xact_lock(150004)');
  const found=await client.query("select id from asset_sets where input_sha256=$1 and state='published'",[inputSha256]);
  if(found.rows.length){await client.query('commit');console.log(JSON.stringify({assetSetId:found.rows[0].id,preserved:true,inputSha256}));}
  else{
    const id=(await client.query('insert into asset_sets(source_version,data_source_version,data_source_commit,input_sha256,build_info_sha256,extractor_commit,manifest) values($1,$2,$3,$4,$5,$6,$7) returning id',[manifest.sourceVersion,manifest.dataSourceVersion,manifest.dataSourceCommit,inputSha256,manifest.buildInfoSha256,manifest.extractorCommit,JSON.stringify(context)])).rows[0].id;
    for(const asset of assets)await client.query('insert into game_assets(asset_set_id,handle,status,path,sha256,width,height,atlas_sno,payload) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,asset.handle,asset.status,asset.path??null,asset.sha256??null,asset.width??null,asset.height??null,asset.atlasSno??null,JSON.stringify(asset)]);
    await client.query("update asset_sets set state='published' where id=$1",[id]);await client.query('commit');
    console.log(JSON.stringify({assetSetId:id,preserved:false,inputSha256,requested:assets.length,extracted:assets.filter(a=>a.status==='extracted').length}));
  }
}catch{await client.query('rollback');throw new Error('Original asset registration failed; transaction rolled back');}
finally{client.release();await pool.end();}
