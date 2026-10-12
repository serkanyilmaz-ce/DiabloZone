import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseTree(text) {
  return text.split('\n').filter(Boolean).flatMap(line => {
    const match = line.match(/^\d{6} blob ([a-f0-9]{40})\t(json\/.+\.json)$/);
    if (!match) return [];
    const [, gitBlob, file] = match;
    if (file.includes('\\') || file.split('/').includes('..')) throw new Error('Unsafe source path');
    const parts = file.split('/');
    return [{ file, gitBlob, locale: parts[1], kind: parts[3] ?? 'unknown' }];
  });
}

export function sourceVersion(value) {
  const match = value.trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error('Expected an exact four-part source build');
  return { version: value.trim(), patch: match.slice(1, 4).join('.'), build: match[4] };
}

export function references(value) {
  const found = new Map();
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.__targetFileName__ === 'string') {
      const file = `json/${node.__targetFileName__}.json`;
      if (file.includes('\\') || file.split('/').includes('..')) throw new Error('Unsafe reference');
      found.set(file, { file, sno: node.__raw__ ?? null, group: node.groupName ?? null });
    }
    for (const child of Object.values(node)) visit(child);
  }
  visit(value);
  return [...found.values()];
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, '-c', 'core.quotepath=false', ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Source Git read failed: ${args[0]}`);
  return result.stdout;
}

async function files(root) {
  const output = [];
  async function visit(relative) {
    const directory = path.join(root, relative);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && file.endsWith('.json')) output.push(file);
    }
  }
  await visit('json');
  return output.sort();
}

async function run() {
  const root = path.resolve(process.argv[2] ?? '.tmp/d4data');
  const commit = process.argv[3];
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Pinned full commit required');
  if (git(root, ['rev-parse', 'HEAD']).trim() !== commit) throw new Error('Source checkout differs from pinned commit');
  if (git(root, ['status', '--porcelain']).trim()) throw new Error('Source checkout has local changes');
  const version = sourceVersion(git(root, ['show', `${commit}:buildVersion.txt`]));
  const entries = parseTree(git(root, ['ls-tree', '-r', '--full-tree', commit, '--', 'json']));
  if (!entries.length) throw new Error('Empty source inventory');
  const byFile = new Map(entries.map(entry => [entry.file, entry]));
  const materialized = [];
  for (const file of await files(root)) {
    const entry = byFile.get(file);
    if (!entry) throw new Error(`File absent from pinned tree: ${file}`);
    const canonical = Buffer.from(git(root, ['show', `${commit}:${file}`]), 'utf8');
    const raw = await readFile(path.join(root, file));
    if (raw.toString('utf8').replaceAll('\r\n', '\n') !== canonical.toString('utf8').replaceAll('\r\n', '\n')) throw new Error(`Source content mismatch: ${file}`);
    const object = JSON.parse(canonical);
    const linked = references(object).map(reference => ({ ...reference, inInventory: byFile.has(reference.file), materialized: false }));
    materialized.push({ ...entry, sno: object.__snoID__ ?? null, definitionType: object.__type__ ?? null,
      bytes: canonical.length, sha256: createHash('sha256').update(canonical).digest('hex'),
      nameHint: /(^|[/_ ])(Test|Placeholder|PH|DoNotShip|Bad Data)([/_ .]|$)/i.test(file) ? 'review_required' : 'unknown',
      references: linked,
    });
  }
  const downloaded = new Set(materialized.map(file => file.file));
  const byMaterializedFile = new Map(materialized.map(file => [file.file, file]));
  for (const file of materialized) for (const reference of file.references) {
    reference.materialized = downloaded.has(reference.file);
    const target = byMaterializedFile.get(reference.file);
    if (target && typeof reference.sno === 'number' && reference.sno > 0 && target.sno !== reference.sno) throw new Error(`SNO reference mismatch: ${file.file} -> ${reference.file}`);
  }
  const counts = {};
  for (const entry of entries) {
    counts[entry.locale] ??= {};
    counts[entry.locale][entry.kind] = (counts[entry.locale][entry.kind] ?? 0) + 1;
  }
  const classFiles = materialized.filter(file => file.kind === 'PlayerClass');
  const definitions = [];
  for (const file of classFiles) {
    const raw = JSON.parse(git(root, ['show', `${commit}:${file.file}`]));
    definitions.push({ file: file.file, sno: file.sno, status: file.nameHint,
      fields: Object.fromEntries(Object.entries(raw).filter(([key, value]) => /class|skillkit/i.test(key) && (typeof value !== 'object' || value === null))),
      skillKits: file.references.filter(reference => reference.group === 'SkillKit'),
    });
  }
  await mkdir('.tmp/source-evidence', { recursive: true });
  await writeFile(`.tmp/source-evidence/${commit}-inventory.json`, JSON.stringify({ commit, version, entries }, null, 2) + '\n');
  await writeFile(`.tmp/source-evidence/${commit}-samples.json`, JSON.stringify(materialized, null, 2) + '\n');
  const auxiliary = [];
  for (const file of ['buildVersion.txt', 'definitions.json', 'attributes.json', 'attributeList.json', 'LICENSE', 'readme.md']) {
    const raw = Buffer.from(git(root, ['show', `${commit}:${file}`]), 'utf8');
    auxiliary.push({ file, gitBlob: git(root, ['rev-parse', `${commit}:${file}`]).trim(), bytes: raw.length, sha256: createHash('sha256').update(raw).digest('hex') });
  }
  const documents = [];
  for (const [file, locator, assertions] of [
    ['official-season15.html', 'https://news.blizzard.com/en-us/article/24295394/celebrate-30-years-of-diablo-in-season-of-hell-s-legacy', ['Season of Hell', '73552']],
    ['official-patch-3.2.html', 'https://news.blizzard.com/en-us/article/24295395/diablo-iv-patch-notes', ['73764', 'September 30']],
  ]) {
    const raw = await readFile(`.tmp/source-evidence/${file}`);
    if (!assertions.every(value => raw.toString('utf8').includes(value))) throw new Error('Captured official document content does not match expected evidence');
    documents.push({ locator, cachedFile: `.tmp/source-evidence/${file}`, bytes: raw.length, sha256: createHash('sha256').update(raw).digest('hex') });
  }
  const localFile = 'C:/Program Files (x86)/Diablo IV/.build.info';
  const localRaw = await readFile(localFile);
  const localLines = localRaw.toString('utf8').trim().split(/\r?\n/).map(line => line.split('|'));
  const versionColumn = localLines[0].findIndex(value => value.startsWith('Version!'));
  const activeColumn = localLines[0].findIndex(value => value.startsWith('Active!'));
  const active = localLines.slice(1).filter(row => row[activeColumn] === '1');
  if (versionColumn < 0 || active.length !== 1) throw new Error('Ambiguous local installation manifest');
  const local = { ...sourceVersion(active[0][versionColumn]), locator: localFile, sha256: createHash('sha256').update(localRaw).digest('hex'), status: 'installation_observation_only' };
  const summaries = materialized.map(file => {
    const referenceCounts = { total: file.references.length, absentFromSource: file.references.filter(value => !value.inInventory).length, notMaterialized: file.references.filter(value => !value.materialized).length };
    return { ...file, references: file.references.slice(0, ['PlayerClass', 'Power', 'Item', 'Affix', 'Aspect'].includes(file.kind) ? 100 : 12), referenceCounts, referencesTruncated: file.references.length > (['PlayerClass', 'Power', 'Item', 'Affix', 'Aspect'].includes(file.kind) ? 100 : 12) };
  });
  const manifest = { schemaVersion: 1, repository: 'https://github.com/DiabloTools/d4data', commit,
    observedAt: new Date().toISOString(), ...version, season: 15, channel: 'live', baseline: 'season_start',
    evidence: { season: 'https://news.blizzard.com/en-us/article/24295394/celebrate-30-years-of-diablo-in-season-of-hell-s-legacy', patch: 'https://news.blizzard.com/en-us/article/24295395/diablo-iv-patch-notes' },
    inventory: { scope: 'entire_json_git_tree', totalFiles: entries.length, counts,
      note: 'Counts include historical/test/unknown records. They are not counts of playable records.' },
    localObservation: local, documents, auxiliary,
    compatibility: { matchesLocalInstallation: local.version === version.version, note: 'Season-start baseline; later client patch is a separate build. Array class-index ordering is unresolved and must not be inferred from filenames.' },
    materialized: { files: summaries, totalBytes: materialized.reduce((sum, file) => sum + file.bytes, 0), classes: definitions },
  };
  await mkdir('data/research', { recursive: true });
  await writeFile('data/research/source-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ commit, version: version.version, inventoryFiles: entries.length,
    sourceKinds: Object.keys(counts.base ?? {}).length, materialized: materialized.length,
    classes: definitions.map(value => ({ file: value.file, fields: value.fields, skillKits: value.skillKits })),
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await run();
