import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { databasePool } from './config.js';
const pool=databasePool();
const client=await pool.connect();
try {
  await client.query('begin');
  await client.query("select pg_advisory_xact_lock(150001)");
  await client.query('create table if not exists schema_migrations(name text primary key, sha256 text not null, applied_at timestamptz not null default now())');
  for (const name of (await readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort()) {
    const sql=await readFile(`database/migrations/${name}`,'utf8');
    const hash=createHash('sha256').update(sql).digest('hex');
    const exists=await client.query('select sha256 from schema_migrations where name=$1',[name]);
    if(exists.rowCount){if(exists.rows[0].sha256!==hash)throw new Error('Uygulanmış migration değiştirildi.');continue;}
    await client.query(sql);
    await client.query('insert into schema_migrations(name,sha256) values($1,$2)',[name,hash]);
    console.log(`Applied ${name}`);
  }
  await client.query('commit');
} catch {
  await client.query('rollback');
  throw new Error('Migration başarısız; işlem geri alındı. Bağlantı/şemayı kontrol et.');
} finally { client.release(); await pool.end(); }
