import { createServer, type ServerResponse } from 'node:http';
import { databasePool } from './db/config.js';
import { parseRecordQuery, isUuid, escapeLike } from '../src/lib/api-query.js';
import { clientAddress } from '../src/lib/client-address.js';
const pool=databasePool(true);
const host=process.env.API_HOST ?? '127.0.0.1';
const port=Number(process.env.API_PORT ?? '8787');
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Geçersiz API_PORT.');
const buckets=new Map<string,{since:number;count:number}>();
const reply=(response:ServerResponse,status:number,body:unknown)=>{
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  response.end(JSON.stringify(body));
};
const server=createServer(async(request,response)=>{
  const key=clientAddress(request.socket.remoteAddress,request.headers['x-real-ip'],process.env.API_TRUST_LOOPBACK_PROXY==='1',process.env.API_TRUSTED_PROXY_ADDRESS);
  const now=Date.now();
  if(buckets.size>10000) for(const [ip,bucket] of buckets) if(now-bucket.since>60000) buckets.delete(ip);
  if(buckets.size>10000){reply(response,429,{error:'Servis yoğun.'});return;}
  let bucket=buckets.get(key);if(!bucket||now-bucket.since>60000){bucket={since:now,count:0};buckets.set(key,bucket);}
  if(++bucket.count>240){response.setHeader('Retry-After','60');reply(response,429,{error:'İstek sınırı aşıldı.'});return;}
  const origin=process.env.API_ALLOWED_ORIGIN;
  if(origin&&request.headers.origin===origin) response.setHeader('Access-Control-Allow-Origin',origin);
  if(!['GET','HEAD'].includes(request.method ?? '')){response.setHeader('Allow','GET, HEAD');reply(response,405,{error:'Salt okunur API.'});return;}
  try{
    const url=new URL(request.url ?? '/', 'http://localhost');
    if(url.pathname==='/health'){await pool.query('select 1');reply(response,200,{status:'ok'});return;}
    if(url.pathname==='/api/v1/seasons'){
      const result=await pool.query('select id,name,status,source_url from seasons order by id desc');reply(response,200,{data:result.rows});return;
    }
    if(url.pathname==='/api/v1/asset-sets'){
      const version=url.searchParams.get('sourceVersion');
      if(version!==null&&!/^\d+\.\d+\.\d+\.\d+$/.test(version))throw new RangeError('Geçersiz görsel sürümü.');
      const result=await pool.query("select id,source_version,data_source_version,data_source_commit,input_sha256,build_info_sha256,extractor_commit,created_at from asset_sets where state='published' and ($1::text is null or source_version=$1) order by created_at desc limit 50",[version]);
      reply(response,200,{data:result.rows});return;
    }
    const assetMatch=url.pathname.match(/^\/api\/v1\/asset-sets\/([^/]+)\/assets$/);
    if(assetMatch){
      const id=assetMatch[1],pageText=url.searchParams.get('page')??'1',status=url.searchParams.get('status'),handle=url.searchParams.get('handle');
      if(!isUuid(id)||!/^\d{1,6}$/.test(pageText)||Number(pageText)<1||status!==null&&!['extracted','unavailable','unresolved'].includes(status)||handle!==null&&(!/^\d{1,10}$/.test(handle)||Number(handle)<1||Number(handle)>4294967294))throw new RangeError('Geçersiz görsel sorgusu.');
      const set=await pool.query("select id,source_version,data_source_version,input_sha256 from asset_sets where id=$1 and state='published'",[id]);
      if(!set.rows.length){reply(response,404,{error:'Yayınlanmış görsel arşivi bulunamadı.'});return;}
      const values=[id,status,handle];
      const where='asset_set_id=$1 and ($2::text is null or status=$2) and ($3::bigint is null or handle=$3)';
      const count=await pool.query(`select count(*)::int as count from game_assets where ${where}`,values);
      const rows=await pool.query(`select handle,status,path,sha256,width,height,atlas_sno,payload from game_assets where ${where} order by handle limit 24 offset $4`,[...values,(Number(pageText)-1)*24]);
      reply(response,200,{assetSet:set.rows[0],page:Number(pageText),limit:24,total:count.rows[0].count,data:rows.rows});return;
    }
    if(url.pathname==='/api/v1/snapshots'){
      const season=url.searchParams.get('season') ?? '15',channel=url.searchParams.get('channel') ?? 'live';
      const kind=url.searchParams.get('kind');
      if(!/^\d{1,4}$/.test(season)||!['live','ptr'].includes(channel)) throw new RangeError('Geçersiz sezon veya kanal.');
      if(kind && !['research','game_data'].includes(kind)) throw new RangeError('Geçersiz snapshot türü.');
      const result=await pool.query("select s.id,s.build_id,s.created_at,(s.manifest-'provenance') as manifest,b.patch,b.channel,b.season_id from snapshots s join builds b on b.id=s.build_id where s.state='published' and b.season_id=$1 and b.channel=$2 and ($3::text is null or s.manifest->>'kind'=$3) order by s.created_at desc limit 50",[Number(season),channel,kind??null]);
      reply(response,200,{data:result.rows});return;
    }
    const match=url.pathname.match(/^\/api\/v1\/snapshots\/([^/]+)\/(records|mechanics|formulas|rng)$/);
    if(!match){reply(response,404,{error:'Uç nokta bulunamadı.'});return;}
    const [,snapshotId,section]=match;if(!isUuid(snapshotId)) throw new RangeError('Geçersiz snapshot kimliği.');
    const snapshot=await pool.query("select s.id,s.build_id,b.season_id,b.channel from snapshots s join builds b on b.id=s.build_id where s.id=$1 and s.state='published'",[snapshotId]);
    if(!snapshot.rows.length){reply(response,404,{error:'Yayınlanmış snapshot bulunamadı.'});return;}
    if(section==='records'){
      const {kind,query,page,limit,offset}=parseRecordQuery(url.searchParams);
      const pattern=`%${escapeLike(query)}%`;
      const count=await pool.query('select count(*)::integer as count from records where snapshot_id=$1 and kind=$2 and ($3=\'%%\' or name ilike $3 or payload->>\'description\' ilike $3 or payload->>\'flavor\' ilike $3 or payload->>\'internalName\' ilike $3)',[snapshotId,kind,pattern]);
      const result=await pool.query('select id,slug,name,payload from records where snapshot_id=$1 and kind=$2 and ($3=\'%%\' or name ilike $3 or payload->>\'description\' ilike $3 or payload->>\'flavor\' ilike $3 or payload->>\'internalName\' ilike $3) order by id limit $4 offset $5',[snapshotId,kind,pattern,limit,offset]);
      reply(response,200,{snapshot:snapshot.rows[0],page,limit,total:count.rows[0].count,data:result.rows});return;
    }
    if(section==='formulas' || section==='rng'){
      const page=Number(url.searchParams.get('page') ?? '1');
      if(!Number.isSafeInteger(page)||page<1||page>100000) throw new RangeError('Geçersiz sayfa.');
      // Table identifiers come from this fixed branch, never from a request value.
      const sql=section==='formulas'
        ? 'select f.id,m.slug as mechanic,f.raw_expression,f.interpretation,f.unit,f.validation_status,s.kind as source_kind,s.locator as source_locator,s.sha256,coalesce((select jsonb_agg(jsonb_build_object(\'symbol\',d.symbol,\'resolution\',d.resolution,\'constant_value\',d.constant_value,\'dependency_formula_id\',d.dependency_formula_id,\'unit\',d.unit)) from formula_dependencies d where d.formula_id=f.id),\'[]\'::jsonb) as dependencies from formulas f join mechanics m on m.id=f.mechanic_id join sources s on s.id=f.source_id where f.snapshot_id=$1 order by f.id limit 24 offset $2'
        : 'select r.id,m.slug as mechanic,r.distribution,r.probability,r.independence_status,r.parameters,r.notes,s.kind as source_kind,s.locator as source_locator,s.sha256 from rng_models r join mechanics m on m.id=r.mechanic_id join sources s on s.id=r.source_id where r.snapshot_id=$1 order by r.id limit 24 offset $2';
      const result=await pool.query(sql,[snapshotId,(page-1)*24]);reply(response,200,{snapshot:snapshot.rows[0],page,limit:24,data:result.rows});return;
    }
    const result=await pool.query('select id,slug,domain,title,status,assumptions from mechanics where snapshot_id=$1 order by domain,slug limit 1000',[snapshotId]);
    reply(response,200,{snapshot:snapshot.rows[0],data:result.rows});
  }catch(error){if(error instanceof RangeError) reply(response,400,{error:error.message});else reply(response,503,{error:'Veritabanı geçici olarak kullanılamıyor.'});}
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(port,host,()=>console.log(`Read-only DiabloZone API: http://${host}:${port}`));
function close(){server.close(()=>{void pool.end();});}
process.once('SIGTERM',close);process.once('SIGINT',close);
