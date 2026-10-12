"""Back up only DiabloZone and restore into an isolated temporary database."""
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
from datetime import datetime, timezone

if os.geteuid() != 0:
    raise SystemExit('Root required')
identifier = sys.argv[1] if len(sys.argv) > 1 else ''
if not re.fullmatch(r'[0-9]{8}-[0-9]{6}', identifier):
    raise SystemExit('Unique YYYYMMDD-HHMMSS required')
production = 'diablozone'
temporary = 'diablozone_restore_' + identifier.replace('-', '_')
if not re.fullmatch(r'diablozone_restore_[0-9]{8}_[0-9]{6}', temporary):
    raise SystemExit('Invalid isolated database name')
directory = pathlib.Path('/var/backups/diablozone') / identifier
directory.mkdir(mode=0o700, parents=False, exist_ok=False)
dump = directory / 'diablozone.dump'

def postgres(arguments, **options):
    return subprocess.run(['runuser', '-u', 'postgres', '--', *arguments], check=True, **options)

def query(database):
    sql = """select jsonb_build_object(
      'snapshots',(select jsonb_agg(jsonb_build_array(id,state,manifest->>'inputSha256') order by id) from snapshots),
      'records',(select count(*) from records),'links',(select count(*) from record_links),
      'sources',(select count(*) from sources),'mechanics',(select count(*) from mechanics),
      'formulas',(select count(*) from formulas),'rng',(select count(*) from rng_models),
      'system_archives',(select jsonb_agg(jsonb_build_array(id,state,input_sha256,record_count) order by id) from system_archives),
      'system_records',(select count(*) from system_records),
      'asset_sets',(select jsonb_agg(jsonb_build_array(id,state,input_sha256) order by id) from asset_sets),
      'assets',(select count(*) from game_assets),
      'localization_sets',(select jsonb_agg(jsonb_build_array(id,state,input_sha256,entry_count) order by id) from localization_sets),
      'localized_entities',(select count(*) from localized_entities),
      'migrations',(select jsonb_agg(jsonb_build_array(name,sha256) order by name) from schema_migrations)
    )"""
    result = postgres(['psql', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-d', database, '-c', sql], capture_output=True, text=True)
    return json.loads(result.stdout)

before = query(production)
with dump.open('xb') as output:
    os.chmod(dump, 0o600)
    postgres(['pg_dump', '--format=custom', production], stdout=output)
created = False
try:
    postgres(['createdb', '--template=template0', temporary])
    created = True
    with dump.open('rb') as source:
        postgres(['pg_restore', '--exit-on-error', '--single-transaction', '--no-owner', '--no-privileges', '--dbname', temporary], stdin=source, capture_output=True)
    restored = query(temporary)
    if restored != before:
        raise RuntimeError('Restored counts, seals or migration fingerprints differ')
finally:
    if created:
        postgres(['dropdb', temporary])
after = query(production)
if after != before:
    raise RuntimeError('Production changed during the backup check; inspect concurrent imports')
with dump.open('rb') as source:
    checksum = hashlib.file_digest(source, 'sha256').hexdigest()
report = {'at': datetime.now(timezone.utc).isoformat(), 'database': production,
          'sha256': checksum, 'bytes': dump.stat().st_size,
          'restoreVerified': True, 'temporaryDatabaseRemoved': True,
          'productionPreserved': True, 'state': before}
(directory / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: value for key, value in report.items() if key != 'state'}))
