#!/usr/bin/env bash
set -Eeuo pipefail
release_id="${1:?Release ID required}"
archive_hash="${2:?Archive SHA256 required}"
mode="${3:-activate}"
[[ "$mode" == activate || "$mode" == prepare ]] || exit 2
[[ "$EUID" == 0 && "$release_id" =~ ^[0-9]{8}-[0-9]{6}$ && "$archive_hash" =~ ^[a-f0-9]{64}$ ]] || exit 2
release_root="/srv/diablozone/releases/$release_id"
archive="/home/ubuntu/diablozone-deploy/$release_id.tar.gz"
printf '%s  %s\n' "$archive_hash" "$archive" | sha256sum --check
systemctl is-active --quiet caddy postgresql@16-main aryaland
curl --fail --silent --output /dev/null http://127.0.0.1:3001/
if ! id diablozone >/dev/null 2>&1; then
    useradd --system --home-dir /var/lib/diablozone --create-home --shell /usr/sbin/nologin diablozone
fi
install -d -o root -g root -m 0755 /srv/diablozone /srv/diablozone/releases
install -d -o diablozone -g diablozone -m 0750 /var/cache/diablozone/pnpm
python3 - "$release_root" "$archive" "$release_id" <<'PY'
import hashlib, json, pathlib, sys, tarfile
root, archive, release = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
if root.exists():
    raise SystemExit('Release path already exists; choose a new release ID.')
root.mkdir(mode=0o755)
with tarfile.open(archive) as packed:
    for member in packed.getmembers():
        name = pathlib.PurePosixPath(member.name)
        if name.is_absolute() or '..' in name.parts or member.issym() or member.islnk():
            raise SystemExit('Unsafe archive member')
        if any(part in ('.git', 'node_modules', '.cache') or (part.startswith('.env') and part != '.env.example') or part.endswith(('.key', '.pem')) for part in name.parts):
            raise SystemExit('Private material in archive')
    packed.extractall(root, filter='data')
manifest = json.loads((root / 'release.json').read_text())
if manifest['release'] != release:
    raise SystemExit('Release manifest mismatch')
for name, expected in manifest['files'].items():
    path = (root / name).resolve()
    if not path.is_relative_to(root) or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise SystemExit('Release file hash mismatch')
print('Release archive and file hashes verified.')
PY
if [[ ! -x /opt/diablozone-tools/node_modules/.bin/pnpm ]]; then
    npm install --prefix /opt/diablozone-tools --no-audit --no-fund --ignore-scripts pnpm@10.11.0
fi
[[ "$(/opt/diablozone-tools/node_modules/.bin/pnpm --version)" == 10.11.0 ]]
chown -R diablozone:diablozone "$release_root"
runuser -u diablozone -- /opt/diablozone-tools/node_modules/.bin/pnpm --dir "$release_root" install --prod --frozen-lockfile --ignore-scripts --store-dir /var/cache/diablozone/pnpm
chown -R root:root "$release_root"
chmod -R a+rX "$release_root"
python3 "$release_root/source/deploy/linux/provision.py"
python3 "$release_root/source/deploy/linux/run-admin.py" "$release_root" bootstrap
if [[ "$mode" == prepare ]]; then
    echo "Prepared $release_id for database import/export; current release was preserved."
    exit 0
fi
install -m 0644 "$release_root/source/deploy/linux/diablozone-api.service" /etc/systemd/system/diablozone-api.service
systemd-analyze verify /etc/systemd/system/diablozone-api.service
previous_release="$(readlink /srv/diablozone/current || true)"
python3 - "$release_root" <<'PY'
import os, sys
current = '/srv/diablozone/current'
temporary = '/srv/diablozone/current.next'
if os.path.lexists(temporary):
    raise SystemExit('Pending release link already exists; no overwrite performed.')
os.symlink(sys.argv[1], temporary)
os.replace(temporary, current)
PY
systemctl daemon-reload
systemctl enable diablozone-api
systemctl restart diablozone-api
for attempt in {1..15}; do
    if curl --fail --silent http://127.0.0.1:8787/health; then break; fi
    sleep 1
done
curl --fail --silent http://127.0.0.1:8787/health
backup="/var/backups/diablozone/$release_id"
install -d -m 0700 "$backup"
cp -a /etc/caddy/Caddyfile "$backup/Caddyfile"
install -d -m 0755 /etc/caddy/sites
if [[ -f /etc/caddy/sites/diablozone.caddy ]]; then
    cp -a /etc/caddy/sites/diablozone.caddy "$backup/diablozone.caddy"
fi
install -m 0644 "$release_root/source/deploy/linux/diablozone.caddy" /etc/caddy/sites/diablozone.caddy
python3 - <<'PY'
from pathlib import Path
path = Path('/etc/caddy/Caddyfile')
content = path.read_text()
directive = 'import /etc/caddy/sites/*.caddy'
if directive not in content.splitlines():
    path.write_text(content.rstrip() + '\n\n' + directive + '\n')
PY
if ! caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
    cp -a "$backup/Caddyfile" /etc/caddy/Caddyfile
    echo 'Caddy validation failed; previous main configuration restored.' >&2
    exit 1
fi
systemctl reload caddy
curl --fail --silent --output /dev/null http://127.0.0.1:3001/
systemctl is-active diablozone-api caddy aryaland
echo "Installed release $release_id; previous release: ${previous_release:-none}. HTTPS verification follows separately."
