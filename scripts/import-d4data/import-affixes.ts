import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AffixSchema, type Affix, type Aspect, type Item } from '../../schemas/domain.js';
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

async function readGenerated<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const build = (await readBuildVersion(root)) ?? 'unknown';
const affixesDir = path.join(root, 'json/base/meta/Affix');
const stringsDir = path.join(root, 'json/enUS_Text/meta/StringList');

const items = await readGenerated<Item[]>('data/generated/items.json');
const aspects = await readGenerated<Aspect[]>('data/generated/aspects.json');

const referenced = new Set<string>();
for (const item of items) for (const id of item.affixIds) referenced.add(id);
for (const aspect of aspects) {
  const file = aspect.affixSource?.file;
  if (!file) continue;
  referenced.add(path.basename(file).replace(/\.aff\.json$/i, ''));
}

const affixes: Affix[] = [];
const skipped: Array<{ id: string; reason: string }> = [];

for (const internalName of Array.from(referenced).sort()) {
  const affixFile = path.join(affixesDir, `${internalName}.aff.json`);
  try {
    const raw = await readJson<any>(affixFile);
    const stringsFile = path.join(stringsDir, `Affix_${internalName}.stl.json`);

    let strings;
    try {
      strings = await readStringList(stringsFile);
    } catch {
      strings = undefined;
    }

    const descriptionTemplate = strings ? getString(strings, 'desc', 'codexdesc') : undefined;
    const tags = (raw.arAffixSkillTags ?? [])
      .map((x: any) => x?.name)
      .filter((x: unknown): x is string => typeof x === 'string');
    const staticValues = Array.isArray(raw.arStaticValues)
      ? raw.arStaticValues.filter((x: unknown): x is number => typeof x === 'number')
      : [];

    const affix = AffixSchema.parse({
      id: slugify(internalName),
      internalName,
      name: strings ? getString(strings, 'name') : undefined,
      description: cleanTooltipText(descriptionTemplate),
      descriptionTemplate,
      staticValues,
      itemPowerMin: typeof raw.nItemPowerMin === 'number' ? raw.nItemPowerMin : undefined,
      itemPowerMax: typeof raw.nItemPowerMax === 'number' ? raw.nItemPowerMax : undefined,
      tags,
      source: {
        file: path.relative(root, affixFile),
        sno: raw.__snoID__,
      },
      localizationSource: strings ? {
        file: path.relative(root, stringsFile),
        sno: strings.__snoID__,
      } : undefined,
      passivePowerSource: raw.snoPassivePower?.__targetFileName__ ? {
        file: `json/${raw.snoPassivePower.__targetFileName__}.json`,
        sno: raw.snoPassivePower.__raw__,
      } : undefined,
      patch: build,
    });

    affixes.push(affix);
  } catch (error) {
    skipped.push({
      id: internalName,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

const deduped = Array.from(new Map(affixes.map(x => [x.internalName, x])).values())
  .sort((a, b) => a.internalName.localeCompare(b.internalName));

await writeJson('data/generated/affixes.json', deduped);
await writeJson('data/generated/affixes-report.json', {
  source: 'DiabloTools/d4data',
  gameBuild: build,
  generatedAt: new Date().toISOString(),
  referenced: referenced.size,
  imported: deduped.length,
  localized: deduped.filter(x => x.localizationSource).length,
  withDescription: deduped.filter(x => x.descriptionTemplate).length,
  withStaticValues: deduped.filter(x => x.staticValues.length > 0).length,
  skipped: skipped.length,
  skippedSamples: skipped.slice(0, 100),
});

if (deduped.length < 100) throw new Error(`Affix sanity check failed: only ${deduped.length} referenced affixes imported`);
const harlequin = deduped.find(x => x.internalName === 'Helm_Unique_Generic_002');
if (!harlequin) throw new Error('Affix sanity check failed: Harlequin Crest skill-rank affix missing');
if (!harlequin.staticValues.includes(6)) throw new Error('Affix sanity check failed: Harlequin Crest static value 6 missing');
if (!/rank to all skills/i.test(harlequin.descriptionTemplate ?? '')) {
  throw new Error('Affix sanity check failed: Harlequin Crest description missing');
}

console.log(`Imported ${deduped.length}/${referenced.size} referenced affixes from d4data ${build}`);
