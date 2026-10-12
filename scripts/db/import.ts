import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SkillSchema, ItemSchema, AspectSchema, AffixSchema } from '../../schemas/domain.js';
import { databasePool } from './config.js';
import { z } from 'zod';
const metadata=JSON.parse(await readFile('data/generated/metadata.json','utf8'));
const season=Number(process.env.DATA_SEASON ?? '15');
const channel=process.env.DATA_CHANNEL;
if(!metadata.gameBuild || !Number.isSafeInteger(season) || season<1 || !['live','ptr'].includes(channel ?? '')) throw new Error('Kaynak build, DATA_SEASON ve açık DATA_CHANNEL=live/ptr gerekli. Eksik veriye sezon atama yapılmaz.');
const schemas={skills:SkillSchema,items:ItemSchema,aspects:AspectSchema,affixes:AffixSchema};
const loaded = await Promise.all(Object.entries(schemas).map(async([kind,schema])=>{
  const raw=await readFile(`data/generated/${kind}.json`,'utf8');
  return {kind,raw,records:z.array(schema).parse(JSON.parse(raw)),hash:createHash('sha256').update(raw).digest('hex')};
}));
if(!loaded.some(file=>file.records.length)) throw new Error('Boş veri kümesi oyun verisi olarak yayınlanamaz.');
if(loaded.some(file=>file.records.some(record=>record.patch!==String(metadata.gameBuild)))) throw new Error('Kayıtların kaynak sürümü metadata build ile eşleşmiyor.');
const pool=databasePool(),client=await pool.connect();
try {
  await client.query('begin');
  const build=String(metadata.gameBuild);
  // A build is never silently reassigned to another season/channel.
  await client.query('insert into builds(id,season_id,patch,channel,observed_at) values($1,$2,$3,$4,now()) on conflict(id) do nothing',[build,season,metadata.patch ?? null,channel]);
  const actual=await client.query('select season_id,channel from builds where id=$1',[build]);
  if(actual.rows[0].season_id!==season || actual.rows[0].channel!==channel) throw new Error('Build bağlamı uyuşmuyor.');
  const snapshot=await client.query('insert into snapshots(build_id,manifest) values($1,$2) returning id',[build,JSON.stringify({kind:'game_data',schemaVersion:1,files:loaded.map(file=>({kind:file.kind,sha256:file.hash,count:file.records.length}))})]);
  const snapshotId=snapshot.rows[0].id;
  for(const file of loaded){
    const source=await client.query('insert into sources(snapshot_id,kind,locator,sha256) values($1,$2,$3,$4) returning id',[snapshotId,'normalized_export',`data/generated/${file.kind}.json`,file.hash]);
    for(const record of file.records) await client.query('insert into records(snapshot_id,kind,id,slug,name,source_id,payload) values($1,$2,$3,$4,$5,$6,$7)',[snapshotId,file.kind,record.id,'slug' in record?record.slug:null,'name' in record?record.name:null,source.rows[0].id,JSON.stringify(record)]);
  }
  await client.query("update snapshots set state='published' where id=$1",[snapshotId]);
  await client.query('commit');console.log(`Published immutable snapshot ${snapshotId}`);
} catch { await client.query('rollback'); throw new Error('İçe aktarım başarısız; kayıtlar geri alındı. Kaynak, build ve bağlantı bağlamını kontrol et.'); }
finally {client.release();await pool.end();}
