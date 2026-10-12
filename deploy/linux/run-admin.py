"""Load a root-only writer environment without secrets in shell arguments."""
import os
import pathlib
import subprocess
import sys

if os.geteuid() != 0:
    raise SystemExit('Run as root')
release = pathlib.Path(sys.argv[1]).resolve(strict=True)
if release.parent != pathlib.Path('/srv/diablozone/releases'):
    raise SystemExit('Invalid release path')
task = sys.argv[2] if len(sys.argv) > 2 else 'bootstrap'
if task not in ('bootstrap', 'migrate', 'research', 'import', 'export'):
    raise SystemExit('Invalid admin task')
environment = os.environ.copy()
secret_file = '/etc/diablozone/api.env' if task == 'export' else '/etc/diablozone/import.env'
for line in pathlib.Path(secret_file).read_text().splitlines():
    if line and not line.startswith('#'):
        key, value = line.split('=', 1)
        environment[key] = value
result = subprocess.run(['/usr/local/bin/node', str(release / f'build/service/scripts/db/{task}.js'), *sys.argv[3:]], cwd=release, env=environment)
raise SystemExit(result.returncode)
