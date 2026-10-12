import 'dotenv/config';
import pg from 'pg';
export function databasePool(readOnly = false) {
  const url = readOnly ? process.env.DATABASE_READ_URL : process.env.DATABASE_URL;
  if (!url) throw new Error(`${readOnly ? 'DATABASE_READ_URL' : 'DATABASE_URL'} gerekli. .env.example dosyasına bak.`);
  const pool=new pg.Pool({ connectionString:url, max:5, connectionTimeoutMillis:5000, statement_timeout:5000,
    ...(readOnly ? { options:'-c default_transaction_read_only=on' } : {}),
  });
  // pg removes the disconnected idle client. Handle its event so a database
  // restart does not terminate the API; later requests obtain a fresh client.
  pool.on('error',()=>console.warn('Database connection interrupted; the next request will reconnect.'));
  return pool;
}
