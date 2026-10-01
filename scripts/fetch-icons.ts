import { promises as fs } from 'node:fs';
import path from 'node:path';

type Skill = {
  slug: string;
  name: string;
  icon?: string;
  iconRef?: { normalHandle?: number };
};

type Item = {
  slug: string;
  name: string;
  icon?: string;
  iconRef?: { inventoryImageHandles?: number[] };
};

type SourceMap = {
  items: Record<string, string | null>;
};

const SKILL_BASE = 'https://www.purediablo.com/diablo4/images/skills';
const ITEM_PAGE_BASE = 'https://www.purediablo.com/diablo4';
const ITEM_IMAGE_BASE = 'https://www.purediablo.com/diablo4/images/items';
const USER_AGENT = 'DiabloZone/0.1 (+https://github.com/serkanyilmaz-ce/DiabloZone)';
const SOURCE_MAP_FILE = 'public/assets/icon-source-map.json';

// Manually verified against the provider page/image. These are intentionally
// tiny and explicit: they avoid guessing when a canonical name does not map
// cleanly to the provider page while keeping the generic resolver intact.
const VERIFIED_ITEM_IMAGE_IDS: Record<string, string> = {
  'Harlequin Crest': '2104072',
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

async function readJsonOr<T>(file: string, fallback: T): Promise<T> {
  try { return await readJson<T>(file); } catch { return fallback; }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
}

function wikiTitle(name: string) {
  return encodeURIComponent(name.replace(/\s+/g, '_'))
    .replace(/%2F/gi, '/')
    .replace(/'/g, '%27');
}

async function fetchWithTimeout(url: string, timeoutMs = 10000) {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
    headers: { 'user-agent': USER_AGENT, accept: '*/*' },
  });
}

async function downloadImage(url: string, destination: string) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`unexpected content-type ${type || 'unknown'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100) throw new Error('image payload too small');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
}

async function mapLimit<T>(values: T[], limit: number, worker: (value: T, index: number) => Promise<void>) {
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= values.length) return;
      await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, run));
}

function uniqueMatches(html: string, regex: RegExp) {
  return [...new Set(Array.from(html.matchAll(regex), match => match[1]))];
}

const skillsFile = 'data/generated/skills.json';
const itemsFile = 'data/generated/items.json';
const skills = await readJson<Skill[]>(skillsFile);
const items = await readJson<Item[]>(itemsFile);
const sourceMap = await readJsonOr<SourceMap>(SOURCE_MAP_FILE, { items: {} });

const report = {
  generatedAt: new Date().toISOString(),
  sources: {
    primary: 'DiabloTools/d4data icon references',
    secondary: 'PureDiablo image files and item pages',
  },
  skills: { total: skills.length, candidates: 0, resolved: 0, cached: 0, missing: [] as string[] },
  items: {
    total: items.length,
    candidates: 0,
    resolved: 0,
    cached: 0,
    sourceMapHits: 0,
    verifiedOverrides: 0,
    knownMissing: 0,
    ambiguous: [] as string[],
    missing: [] as string[],
  },
};

const skillCandidates = skills.filter(x => Number(x.iconRef?.normalHandle ?? 0) > 0);
report.skills.candidates = skillCandidates.length;

await mapLimit(skillCandidates, 12, async skill => {
  const handle = Number(skill.iconRef!.normalHandle);
  const relative = `assets/skills/${skill.slug}.png`;
  const destination = path.join('public', relative);
  try {
    await fs.access(destination);
    skill.icon = relative;
    report.skills.cached++;
    report.skills.resolved++;
    return;
  } catch {}

  try {
    await downloadImage(`${SKILL_BASE}/${handle}.png`, destination);
    skill.icon = relative;
    report.skills.resolved++;
  } catch {
    report.skills.missing.push(`${skill.name} (${handle})`);
  }
});

const itemCandidates = items.filter(x => (x.iconRef?.inventoryImageHandles?.length ?? 0) > 0);
report.items.candidates = itemCandidates.length;

await mapLimit(itemCandidates, 10, async item => {
  const relative = `assets/items/${item.slug}.png`;
  const destination = path.join('public', relative);
  try {
    await fs.access(destination);
    item.icon = relative;
    report.items.cached++;
    report.items.resolved++;
    return;
  } catch {}

  const verifiedImageId = VERIFIED_ITEM_IMAGE_IDS[item.name];
  if (verifiedImageId) {
    try {
      await downloadImage(`${ITEM_IMAGE_BASE}/${verifiedImageId}.png`, destination);
      sourceMap.items[item.name] = verifiedImageId;
      item.icon = relative;
      report.items.verifiedOverrides++;
      report.items.resolved++;
      return;
    } catch (error) {
      report.items.missing.push(`${item.name}: verified image ${verifiedImageId} failed: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }

  const cachedSource = sourceMap.items[item.name];
  if (cachedSource === null) {
    report.items.knownMissing++;
    return;
  }

  if (typeof cachedSource === 'string') {
    try {
      await downloadImage(`${ITEM_IMAGE_BASE}/${cachedSource}.png`, destination);
      item.icon = relative;
      report.items.sourceMapHits++;
      report.items.resolved++;
      return;
    } catch {
      delete sourceMap.items[item.name];
    }
  }

  try {
    const page = await fetchWithTimeout(`${ITEM_PAGE_BASE}/${wikiTitle(item.name)}`, 12000);
    if (!page.ok) throw new Error(`page HTTP ${page.status}`);
    const html = await page.text();

    const ids = new Set<string>();
    for (const id of uniqueMatches(html, /\/diablo4\/images\/items\/(\d+)\.png/gi)) ids.add(id);
    for (const id of uniqueMatches(html, /Image:\s*(\d+)\.png/gi)) ids.add(id);

    if (ids.size !== 1) {
      sourceMap.items[item.name] = null;
      if (ids.size > 1) report.items.ambiguous.push(`${item.name}: ${[...ids].join(',')}`);
      else report.items.missing.push(`${item.name}: no item image on page`);
      return;
    }

    const imageId = [...ids][0];
    await downloadImage(`${ITEM_IMAGE_BASE}/${imageId}.png`, destination);
    sourceMap.items[item.name] = imageId;
    item.icon = relative;
    report.items.resolved++;
  } catch (error) {
    report.items.missing.push(`${item.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

await writeJson(skillsFile, skills);
await writeJson(itemsFile, items);
await writeJson(SOURCE_MAP_FILE, sourceMap);
await writeJson('data/generated/icon-assets-report.json', report);

console.log(`Skill icons: ${report.skills.resolved}/${report.skills.candidates} candidates resolved (${report.skills.cached} cached)`);
console.log(`Item icons: ${report.items.resolved}/${report.items.candidates} candidates resolved (${report.items.cached} cached, ${report.items.sourceMapHits} source-map hits, ${report.items.verifiedOverrides} verified overrides)`);
console.log(`Item ambiguous: ${report.items.ambiguous.length}; missing: ${report.items.missing.length}; known missing: ${report.items.knownMissing}`);

// Direct hash resolution is deterministic, so keep a hard sanity check for it.
if (!skills.some(x => x.name === 'Fireball' && x.icon)) {
  throw new Error('Icon sanity check failed: Fireball icon was not resolved');
}

// Item resolution depends on an external secondary source. Report regressions,
// but do not block the entire static-site deploy when that source changes.
if (!items.some(x => x.name === 'Harlequin Crest' && x.icon)) {
  console.warn('Icon warning: Harlequin Crest icon was not resolved');
}
