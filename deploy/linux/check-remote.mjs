import assert from 'node:assert/strict';
import { readFileSync,realpathSync } from 'node:fs';
import {createRequire} from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const origin = 'https://diablozone.152.70.4.125.sslip.io';
const releaseRoot=realpathSync(process.env.DIABLOZONE_RELEASE_ROOT??fileURLToPath(new URL('../../../',import.meta.url)));
if(path.dirname(releaseRoot)!=='/srv/diablozone/releases')throw new Error('Native release path required');
const require=createRequire(path.join(releaseRoot,'package.json'));
const {parse}=require('dotenv'),pg=require('pg');
const {loadCatalog,canonical}=await import(path.join(releaseRoot,'build/service/scripts/db/catalog.js'));
const writerPool = new pg.Pool({ connectionString: parse(readFileSync('/etc/diablozone/import.env')).DATABASE_URL, max: 1 });
const readerPool = new pg.Pool({ connectionString: parse(readFileSync('/etc/diablozone/api.env')).DATABASE_READ_URL, max: 1 });
// Explicit clients retain the same connection after an expected SQL error.
// Pool.query releases erroring clients and cannot safely span transactions.
const writer = await writerPool.connect();
const reader = await readerPool.connect();
const checks = [];
const checked = message => { checks.push(message); console.log(`PASS ${message}`); };
async function rejected(client, sql, code, values = []) {
  await assert.rejects(client.query(sql, values), error => error.code === code);
}
async function apiFetch(url){
  let response=await fetch(url);
  if(response.status===429){
    const wait=Math.min(60000,Math.max(1000,Number(response.headers.get('Retry-After')??'60')*1000));
    console.log('API rate boundary reached; waiting for the next request window');
    await new Promise(resolve=>setTimeout(resolve,wait));response=await fetch(url);
  }
  return response;
}
try {
  const roles = await reader.query("select rolname,rolsuper from pg_roles where rolname in ('diablozone_writer','diablozone_reader')");
  assert.equal(roles.rows.length, 2);
  assert(roles.rows.every(role => !role.rolsuper));
  assert.equal((await reader.query('show default_transaction_read_only')).rows[0].default_transaction_read_only, 'on');
  await reader.query('begin read write');
  await rejected(reader, 'update mechanics set title=title where false', '42501');
  await reader.query('rollback');
  checked('Non-superuser roles; reader write denied even in a read-write transaction');

  const snapshots = await writer.query("select id,build_id from snapshots where state='published' and manifest->>'kind'='research' order by created_at desc limit 1");
  assert.equal(snapshots.rows.length, 1);
  const snapshot = snapshots.rows[0];
  await writer.query('begin');
  await rejected(writer, 'update snapshots set manifest=manifest where id=$1', 'P0001', [snapshot.id]);
  await writer.query('rollback');
  checked('Published snapshot is immutable on actual PostgreSQL 16');

  await writer.query('begin');
  const draft = (await writer.query('insert into snapshots(build_id) values($1) returning id', [snapshot.build_id])).rows[0].id;
  const source = (await writer.query("insert into sources(snapshot_id,kind,locator) values($1,'measurement','remote-validation-fixture') returning id", [draft])).rows[0].id;
  const mechanic = (await writer.query("insert into mechanics(snapshot_id,slug,domain,title,status) values($1,'fixture','loot','temporary validation','unknown') returning id", [draft])).rows[0].id;
  await writer.query('savepoint probability');
  const insertRng = "insert into rng_models(snapshot_id,mechanic_id,source_id,distribution,probability,independence_status) values($1,$2,$3,'unknown',$4,'unknown')";
  await rejected(writer, insertRng, '23514', [draft, mechanic, source, 1.1]);
  await writer.query('rollback to savepoint probability');
  await writer.query(insertRng, [draft, mechanic, source, null]);
  assert.equal((await writer.query('select probability from rng_models where snapshot_id=$1', [draft])).rows[0].probability, null);
  const otherSource = (await writer.query('select id from sources where snapshot_id=$1 limit 1', [snapshot.id])).rows[0].id;
  await writer.query('savepoint provenance');
  await rejected(writer, insertRng, '23503', [draft, mechanic, otherSource, null]);
  await writer.query('rollback to savepoint provenance');
  await writer.query('rollback');
  checked('RNG bounds, unknown NULL and cross-snapshot source rejection; all fixtures rolled back');

  for (const path of ['/', '/skills/', '/items/', '/aspects/', '/skill-tree/', '/search/', '/research/', '/lab/']) {
    const result = await fetch(origin + path);
    assert.equal(result.status, 200, path);
    assert.match(await result.text(), /DiabloZone/);
  }
  checked('Eight public HTML routes over certificate-verified HTTPS');
  assert.equal((await fetch(origin + '/missing-validation-page')).status, 404);
  assert.equal((await fetch(origin + '/health')).status, 404);
  assert.equal((await fetch(origin + '/api/v1/seasons', { method: 'POST' })).status, 405);
  assert.equal((await fetch(origin + '/api/v1/snapshots/not-a-uuid/mechanics')).status, 400);
  assert.equal((await fetch(origin + '/api/v1/snapshots?kind=wrong')).status, 400);
  checked('Custom 404, private health, write method and invalid query rejection');
  const published = await (await fetch(origin + '/api/v1/snapshots?season=15&channel=live&kind=research')).json();
  assert.equal(published.data[0].id, snapshot.id);
  const mechanics = await (await fetch(`${origin}/api/v1/snapshots/${snapshot.id}/mechanics`)).json();
  assert.equal(mechanics.data.length, 8);
  assert(mechanics.data.every(value => value.status === 'unknown'));
  for (const section of ['records?kind=items', 'formulas', 'rng']) {
    const response = await fetch(`${origin}/api/v1/snapshots/${snapshot.id}/${section}`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.length, 0);
  }
  checked('Caddy to API to PostgreSQL: same snapshot, eight unknown areas, zero fabricated game data');
  const catalog=await loadCatalog(path.join(releaseRoot,'data/generated'));
  assert(catalog.metadata.snapshotId);
  const gameId=catalog.metadata.snapshotId;
  const games=await (await fetch(origin+'/api/v1/snapshots?season=15&channel=live&kind=game_data')).json();
  assert.equal(games.data[0].id,gameId);
  assert.equal(games.data[0].manifest.inputSha256,catalog.inputSha256);
  for(const file of catalog.files){
    const payloads=new Map();
    for(let page=1;page<=Math.max(1,Math.ceil(file.records.length/24));page++){
      const response=await apiFetch(`${origin}/api/v1/snapshots/${gameId}/records?kind=${file.kind}&page=${page}`);
      assert.equal(response.status,200);
      const result=await response.json();
      assert.equal(result.total,file.records.length);assert.equal(result.snapshot.id,gameId);
      for(const row of result.data){assert(!payloads.has(row.id));payloads.set(row.id,row.payload);}
    }
    assert.equal(payloads.size,file.records.length);
    for(const record of file.records){
      assert.equal(canonical(payloads.get(record.id)),canonical(record));
    }
    if(file.kind==='skill-tree')continue;
    for(let offset=0;offset<file.records.length;offset+=8){
      await Promise.all(file.records.slice(offset,offset+8).map(async record=>{
        const page=await fetch(`${origin}/${file.kind}/${record.slug}/`);assert.equal(page.status,200);
        const html=await page.text();assert(html.includes(gameId));assert(html.includes(String(record.source.sno)));
        const escaped=(record.name??record.internalName).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;').replaceAll('"','&quot;');
        assert(html.includes(escaped),`Detail name mismatch ${file.kind}:${record.id}`);
      }));
    }
  }
  const linkCount=(await reader.query('select count(*)::int as count from record_links where snapshot_id=$1',[gameId])).rows[0].count;
  assert.equal(linkCount,catalog.links.length);
  await reader.query('begin read write');
  await rejected(reader,'update records set name=name where false','42501');
  await reader.query('rollback');
  await writer.query('begin');
  await rejected(writer,'delete from record_links where snapshot_id=$1','P0001',[gameId]);
  await writer.query('rollback');
  checked('All real game API payloads match the PostgreSQL export; detail HTML carries the same snapshot; reader and immutable links protected');
  const originalAssets=JSON.parse(readFileSync(path.join(releaseRoot,'data/research/assets-manifest.json'),'utf8'));
  if(originalAssets.assetSetId){
    const assetId=originalAssets.assetSetId;
    const stored=(await reader.query("select input_sha256,source_version,data_source_version,state from asset_sets where id=$1",[assetId])).rows[0];
    assert.equal(stored.state,'published');assert.equal(stored.input_sha256,originalAssets.inputSha256);
    assert.equal(stored.source_version,originalAssets.sourceVersion);assert.equal(stored.data_source_version,originalAssets.dataSourceVersion);
    const all=(await reader.query('select payload from game_assets where asset_set_id=$1 order by handle',[assetId])).rows;
    assert.equal(canonical(all.map(row=>row.payload)),canonical(originalAssets.assets));
    await reader.query('begin read write');await rejected(reader,'update game_assets set status=status where false','42501');await reader.query('rollback');
    await writer.query('begin');await rejected(writer,'delete from game_assets where asset_set_id=$1','P0001',[assetId]);await writer.query('rollback');
    const result=await (await apiFetch(`${origin}/api/v1/asset-sets/${assetId}/assets?handle=2402480109`)).json();
    assert.equal(result.total,1);assert.equal(result.assetSet.source_version,stored.source_version);
    const png=originalAssets.assets.find(a=>a.handle===2402480109);assert.equal((await fetch(origin+'/'+png.path)).status,200);
    assert.equal((await fetch(`${origin}/api/v1/asset-sets/${assetId}/assets?handle=`)).status,400);
    checked('Original image registry matches the reader export; separate graphics build, original PNG, reader and immutable set validated');
  }
  const treeHtml=await (await fetch(origin+'/skill-tree/')).text();
  for(const board of catalog.files.find(file=>file.kind==='skill-tree').records){assert(treeHtml.includes(board.id));assert(treeHtml.includes(board.scope));}
  assert.equal((await fetch('http://127.0.0.1:3001/')).status,200);
  assert.equal((await fetch('https://aryaland.online/')).status,200);
  checked('Existing Aryaland remains available on its current domain');
  console.log(JSON.stringify({gameSnapshot:gameId,records:catalog.files.reduce((sum,file)=>sum+file.records.length,0),links:linkCount,seal:catalog.inputSha256}));
  console.log(JSON.stringify({ snapshot: snapshot.id, build: snapshot.build_id, mechanics: 8, verified: 0, checks }));
} finally {
  await writer.query('rollback').catch(() => {});
  await reader.query('rollback').catch(() => {});
  writer.release(); reader.release();
  await Promise.all([writerPool.end(), readerPool.end()]);
}
