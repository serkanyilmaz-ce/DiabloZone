import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const release = process.argv[2];
if (!release || !/^\d{8}-\d{6}$/.test(release)) throw new Error('Usage: pnpm release:package YYYYMMDD-HHMMSS');
const directory = resolve('.cache/releases', release);
await mkdir(resolve('.cache/releases'), { recursive: true });
await mkdir(directory, { recursive: false });
for (const name of ['dist', 'build/service', 'database/migrations', 'data/research', 'data/generated']) {
  await cp(name, join(directory, name), { recursive: true });
}
for (const name of ['package.json', 'pnpm-lock.yaml']) {
  await cp(`deploy/linux/runtime/${name}`, join(directory, name));
}
// Explicit allowlists keep secrets, SSH keys, node_modules and game archives out.
for (const name of ['src', 'schemas', 'scripts', 'public', 'docs', 'deploy', 'database', 'data', 'tests']) {
  await cp(name, join(directory, 'source', name), { recursive: true, filter: source => !/[\\/](node_modules|private|raw|bin|obj|\.env(?:\.[^\\/]*)?)(?:[\\/]|$)/.test(source) });
}
for (const name of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'astro.config.mjs', 'tsconfig.json', 'tsconfig.service.json', 'tsconfig.tooling.json', 'eslint.config.mjs', 'README.md', 'AGENTS.md', '.gitattributes', '.gitignore', '.env.example']) {
  await cp(name, join(directory, 'source', name));
}
const hashes = {};
async function manifest(root, relative = '') {
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await manifest(root, name);
    else if (entry.isFile()) hashes[name] = createHash('sha256').update(await readFile(join(root, name))).digest('hex');
    else throw new Error(`Unexpected link in release: ${name}`);
  }
}
await manifest(directory);
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
const status=spawnSync('git',['status','--porcelain'],{encoding:'utf8'});
const draft=status.status!==0||status.stdout.trim().length>0;
await writeFile(join(directory, 'release.json'), JSON.stringify({ release, commit: revision.status === 0&&!draft ? revision.stdout.trim() : null, basedOn:revision.status===0?revision.stdout.trim():null,draft,site: 'https://diablozone.152.70.4.125.sslip.io', files: hashes }, null, 2) + '\n');
const archive = `${directory}.tar.gz`;
const packed = spawnSync('tar', ['-czf', archive, '-C', directory, '.'], { stdio: 'inherit' });
if (packed.status !== 0) throw new Error('Release packaging failed.');
console.log(JSON.stringify({ release, archive, sha256: createHash('sha256').update(await readFile(archive)).digest('hex') }));
