import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AspectSchema, type Aspect } from '../../schemas/domain.js';
import { readBuildVersion, writeJson } from './io.js';
import { cleanTooltipText, getString, readStringList } from './string-list.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

function inferClasses(internalName: string): Aspect['classes'] {
  const name = internalName.toLowerCase();
  const classes: Aspect['classes'] = [];
  const patterns: Array<[RegExp, Aspect['classes'][number]]> = [
    [/(?:^|_)barb(?:arian)?(?:_|$)/, 'barbarian'],
    [/(?:^|_)druid(?:_|$)/, 'druid'],
    [/(?:^|_)necro(?:mancer)?(?:_|$)/, 'necromancer'],
    [/(?:^|_)rogue(?:_|$)/, 'rogue'],
    [/(?:^|_)(?:sorc|sorcerer)(?:_|$)/, 'sorcerer'],
    [/(?:^|_)spiritborn(?:_|$)/, 'spiritborn'],
    [/(?:^|_)paladin(?:_|$)/, 'paladin'],
    [/(?:^|_)warlock(?:_|$)/, 'warlock'],
  ];
  for (const [pattern, cls] of patterns) if (pattern.test(name)) classes.push(cls);
  return classes;
}

function inferCategory(tags: string[]): Aspect['category'] {
  const normalized = tags.map(x => x.toLowerCase());
  if (normalized.some(x => x.includes('legendary_offensive'))) return 'offensive';
  if (normalized.some(x => x.includes('legendary_defensive'))) return 'defensive';
  if (normalized.some(x => x.includes('legendary_utility'))) return 'utility';
  if (normalized.some(x => x.includes('legendary_resource'))) return 'resource';
  if (normalized.some(x => x.includes('legendary_mobility'))) return 'mobility';
  return 'unknown';
}

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const build = (await readBuildVersion(root)) ?? 'unknown';
const aspectsDir = path.join(root, 'json/base/meta/Aspect');
const stringsDir = path.join(root, 'json/enUS_Text/meta/StringList');

const entries = await fs.readdir(aspectsDir, { withFileTypes: true });
const aspects: Aspect[] = [];
const skipped: Array<{ file: string; reason: string }> = [];

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.asp.json')) continue;
  const aspectFile = path.join(aspectsDir, entry.name);

  try {
    const raw = await readJson<any>(aspectFile);
    const target = String(raw.snoAffix?.__targetFileName__ ?? '');
    const affixInternalName = String(raw.snoAffix?.name ?? '');
    if (!target || !affixInternalName) {
      skipped.push({ file: entry.name, reason: 'missing snoAffix target/name' });
      continue;
    }

    const affixFile = path.join(root, 'json', `${target}.json`);
    const affix = await readJson<any>(affixFile);
    const stringsFile = path.join(stringsDir, `Affix_${affixInternalName}.stl.json`);

    let strings;
    try {
      strings = await readStringList(stringsFile);
    } catch {
      skipped.push({ file: entry.name, reason: 'missing localized affix string list' });
      continue;
    }

    const name = getString(strings, 'name');
    if (!name) {
      skipped.push({ file: entry.name, reason: 'missing localized aspect name' });
      continue;
    }

    const descriptionTemplate = getString(strings, 'desc', 'codexdesc');
    const tags = (affix.arAffixSkillTags ?? [])
      .map((x: any) => x?.name)
      .filter((x: unknown): x is string => typeof x === 'string');

    const classes = inferClasses(affixInternalName);
    const rawAllowedItemLabels = Array.isArray(affix.arAllowedItemLabels)
      ? affix.arAllowedItemLabels.filter((x: unknown): x is number => typeof x === 'number')
      : [];

    const aspect = AspectSchema.parse({
      id: slugify(affixInternalName),
      slug: slugify(name.replace(/^of\s+/i, '')),
      name,
      description: cleanTooltipText(descriptionTemplate),
      descriptionTemplate,
      category: inferCategory(tags),
      classes,
      allowedSlots: [],
      rawAllowedItemLabels,
      tags,
      source: {
        file: path.relative(root, aspectFile),
        sno: raw.__snoID__,
      },
      affixSource: {
        file: path.relative(root, affixFile),
        sno: affix.__snoID__,
      },
      localizationSource: {
        file: path.relative(root, stringsFile),
        sno: strings.__snoID__,
      },
      patch: build,
    });

    aspects.push(aspect);
  } catch (error) {
    skipped.push({
      file: entry.name,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

const deduped = Array.from(new Map(aspects.map(x => [x.id, x])).values())
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

await writeJson('data/generated/aspects.json', deduped);
await writeJson('data/generated/aspects-report.json', {
  source: 'DiabloTools/d4data',
  gameBuild: build,
  generatedAt: new Date().toISOString(),
  imported: deduped.length,
  byCategory: Object.fromEntries(
    ['offensive','defensive','utility','resource','mobility','unknown'].map(category => [
      category,
      deduped.filter(x => x.category === category).length,
    ])
  ),
  byClass: Object.fromEntries(
    ['barbarian','druid','necromancer','rogue','sorcerer','spiritborn','paladin','warlock'].map(cls => [
      cls,
      deduped.filter(x => x.classes.includes(cls as any)).length,
    ])
  ),
  generic: deduped.filter(x => x.classes.length === 0).length,
  skipped: skipped.length,
  skippedSamples: skipped.slice(0, 100),
});

if (deduped.length < 100) throw new Error(`Aspect sanity check failed: only ${deduped.length} aspects imported`);
if (!deduped.some(x => /berserk ripping/i.test(x.name))) throw new Error('Aspect sanity check failed: Berserk Ripping missing');

console.log(`Imported ${deduped.length} aspects from d4data ${build}`);
