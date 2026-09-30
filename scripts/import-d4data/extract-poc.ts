import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AspectSchema, ItemSchema, SkillSchema } from '../../schemas/domain.js';
import { readBuildVersion, writeJson } from './io.js';
import { getString, readStringList } from './string-list.js';

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

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const build = (await readBuildVersion(root)) ?? 'unknown';
const stringsDir = path.join(root, 'json/enUS_Text/meta/StringList');
const baseDir = path.join(root, 'json/base/meta');

// Skill PoC: Fireball
const fireballStringsFile = path.join(stringsDir, 'Power_Sorcerer_Fireball.stl.json');
const fireballPowerFile = path.join(baseDir, 'Power/Sorcerer_Fireball.pow.json');
const fireballStrings = await readStringList(fireballStringsFile);
const fireballPower = await readJson<any>(fireballPowerFile);
const fireballName = getString(fireballStrings, 'name') ?? 'Fireball';
const fireballTags = (fireballPower.arSkillTags ?? [])
  .map((x: any) => x?.gbidSkillTag?.name)
  .filter((x: unknown): x is string => typeof x === 'string');
const fireball = SkillSchema.parse({
  id: 'sorcerer-fireball',
  slug: slugify(fireballName),
  name: fireballName,
  class: 'sorcerer',
  category: fireballPower.tPrimaryTag?.gbidSkillTag?.name === 'Skill_Primary_Core' ? 'core' : undefined,
  type: fireballPower.bIsPassive ? 'passive' : 'active',
  description: getString(fireballStrings, 'desc'),
  tags: fireballTags,
  source: { file: path.relative(root, fireballPowerFile), sno: fireballPower.__snoID__ },
  patch: build,
});

// Item PoC: Harlequin Crest. Exact mythic/unique classification will be resolved from item metadata later.
const harlequinFile = path.join(stringsDir, 'Item_Helm_Unique_Generic_002.stl.json');
const harlequinStrings = await readStringList(harlequinFile);
const harlequinName = getString(harlequinStrings, 'name') ?? 'Harlequin Crest';
const harlequin = ItemSchema.parse({
  id: 'harlequin-crest',
  slug: slugify(harlequinName),
  name: harlequinName,
  rarity: 'unique',
  slot: 'helm',
  classes: [],
  affixIds: [],
  source: { file: path.relative(root, harlequinFile), sno: harlequinStrings.__snoID__ },
  patch: build,
});

// Aspect PoC: explicit Aspect -> Affix -> localization chain.
const aspectFile = path.join(baseDir, 'Aspect/Asp_Legendary_Barb_001.asp.json');
const aspectRaw = await readJson<any>(aspectFile);
const affixTarget = String(aspectRaw.snoAffix?.__targetFileName__ ?? '');
if (!affixTarget) throw new Error('Aspect has no snoAffix target');
const affixFile = path.join(root, 'json', `${affixTarget}.json`);
const affix = await readJson<any>(affixFile);
const affixInternalName = String(aspectRaw.snoAffix?.name ?? affix.name ?? 'legendary_barb_001');
const affixStringsFile = path.join(stringsDir, `Affix_${affixInternalName}.stl.json`);
const affixStrings = await readStringList(affixStringsFile);
const aspectName = getString(affixStrings, 'name') ?? affixInternalName;
const filterTags = (affix.arAffixSkillTags ?? [])
  .map((x: any) => x?.name)
  .filter((x: unknown): x is string => typeof x === 'string');
const category = filterTags.some((x: string) => x === 'FILTER_Legendary_Offensive') ? 'offensive' : 'unknown';
const aspect = AspectSchema.parse({
  id: slugify(affixInternalName),
  slug: slugify(aspectName.replace(/^of\s+/i, '')),
  name: aspectName,
  description: getString(affixStrings, 'desc', 'codexdesc'),
  category,
  classes: ['barbarian'],
  allowedSlots: (affix.arAllowedItemLabels ?? []).map((x: number) => String(x)),
  source: { file: path.relative(root, aspectFile), sno: aspectRaw.__snoID__ },
  patch: build,
});

await writeJson('data/generated/skills.json', [fireball]);
await writeJson('data/generated/items.json', [harlequin]);
await writeJson('data/generated/aspects.json', [aspect]);
await writeJson('data/generated/metadata.json', {
  source: 'DiabloTools/d4data',
  gameBuild: build,
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: 'explicit-poc'
});

console.log(`Extracted ${fireball.name}, ${harlequin.name}, ${aspect.name} from d4data ${build}`);
