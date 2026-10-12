import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { databasePool } from './config.js';

await import('./migrate.js');
const raw=await readFile('data/research/season15-plan.json','utf8');
const hash=createHash('sha256').update(raw).digest('hex');
const pool=databasePool();
const client=await pool.connect();
try {
  await client.query('select pg_advisory_lock(150002)');
  const result=await client.query("select id from snapshots where state='published' and manifest->>'inputSha256'=$1 limit 1",[hash]);
  if(result.rows.length) console.log('Research plan already exists; persisted data was preserved.');
  else await import('./research.js');
} finally {
  await client.query('select pg_advisory_unlock(150002)');
  client.release();await pool.end();
}
