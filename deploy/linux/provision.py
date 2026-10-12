"""Run as root. Provision only DiabloZone; never print or pass secrets in argv."""
import os
import pathlib
import secrets
import subprocess

if os.geteuid() != 0:
    raise SystemExit("Run as root")

directory = pathlib.Path('/etc/diablozone')
directory.mkdir(mode=0o700, exist_ok=True)
os.chmod(directory, 0o700)
writer_file = directory / 'import.env'
reader_file = directory / 'api.env'


def sql(statement, database='postgres'):
    result = subprocess.run(
        ['runuser', '-u', 'postgres', '--', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', database],
        input=statement, text=True, capture_output=True,
    )
    if result.returncode:
        # PostgreSQL error details may contain credential-bearing SQL.
        raise SystemExit('PostgreSQL provisioning failed; no secrets were logged.')
    return result.stdout.strip()


def write_private(path, content):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as stream:
        stream.write(content)


if writer_file.exists() != reader_file.exists():
    raise SystemExit('Incomplete credential setup; existing files were preserved.')
if not writer_file.exists():
    occupied = sql("select count(*) from pg_roles where rolname in ('diablozone_writer','diablozone_reader');")
    database = sql("select count(*) from pg_database where datname='diablozone';")
    if occupied != '0' or database != '0':
        raise SystemExit('DiabloZone names already exist without managed credentials; no reset performed.')
    writer_password, reader_password = secrets.token_hex(32), secrets.token_hex(32)
    write_private(writer_file, f'DATABASE_URL=postgresql://diablozone_writer:{writer_password}@127.0.0.1:5432/diablozone\n')
    write_private(reader_file, f'DATABASE_READ_URL=postgresql://diablozone_reader:{reader_password}@127.0.0.1:5432/diablozone\nAPI_HOST=127.0.0.1\nAPI_PORT=8787\nAPI_TRUST_LOOPBACK_PROXY=1\n')
    sql(f"create role diablozone_writer login nosuperuser nocreatedb nocreaterole noreplication connection limit 5 password '{writer_password}'; create role diablozone_reader login nosuperuser nocreatedb nocreaterole noreplication connection limit 5 password '{reader_password}';")
    sql('create database diablozone owner diablozone_writer;')

owner = sql("select pg_get_userbyid(datdba) from pg_database where datname='diablozone';")
roles = sql("select count(*) from pg_roles where rolname in ('diablozone_writer','diablozone_reader') and not rolsuper and not rolcreatedb and not rolcreaterole and not rolreplication and rolconnlimit=5;")
if owner != 'diablozone_writer' or roles != '2':
    raise SystemExit('Existing database/role configuration is inconsistent; nothing was reset.')
sql('revoke all on database diablozone from public; grant connect on database diablozone to diablozone_writer,diablozone_reader; alter role diablozone_reader set default_transaction_read_only=on;')
sql('revoke all on schema public from public; grant usage on schema public to diablozone_reader; alter default privileges for role diablozone_writer in schema public grant select on tables to diablozone_reader;', 'diablozone')
for path in [writer_file, reader_file]:
    os.chmod(path, 0o600)
print('Separate DiabloZone database and non-superuser roles ready; credentials preserved privately.')
