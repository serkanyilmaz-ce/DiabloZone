import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ItemSchema, type Item } from '../../schemas/domain.js';
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

function positiveHandle(value: unknown): number | undefined {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

const classes: Item['classes'] = [
  'barbarian','druid','necromancer','rogue','sorcerer','spiritborn','paladin','warlock'
];

const equipableSlots = new Set([
  'amulet','axe','axe2h','boots','bow','chestarmor','crossbow2h','dagger','flail',
  'focus','focusbookoffhand','glaive','gloves','helm','legs','mace','mace2h',
  'offhandtotem','polearm','quarterstaff','ring','scythe','scythe2h','shield',
  'staff','sword','sword2h','wand'
]);

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const build = (await readBuildVersion(root)) ?? 'unknown';
const itemsDir = path.join(root, 'json/base/meta/Item');
const stringsDir = path.join(root, 'json/enUS_Text/meta/StringList');

const entries = await fs.readdir(itemsDir, { withFileTypes: true });
const items: Array<Item & { _internalName: string; _seasonal: boolean }> = [];
const skipped: Array<{ file: string; reason: string }> = [];

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.itm.json')) continue;
  const internalName = entry.name.replace(/\.itm\.json$/, '');
  if (!/_Unique_/i.test(internalName)) continue;
  if (/Talisman_Charm|Test|PH_|Placeholder|DoNotShip/i.test(internalName)) continue;

  const itemFile = path.join(itemsDir, entry.name);
  const stringsFile = path.join(stringsDir, `Item_${internalName}.stl.json`);

  try {
    const raw = await readJson<any>(itemFile);
    const slot = String(raw.snoItemType?.name ?? '').toLowerCase();
    if (!equipableSlots.has(slot)) {
      skipped.push({ file: entry.name, reason: `non-equipment item type: ${slot || 'unknown'}` });
      continue;
    }

    let strings;
    try {
      strings = await readStringList(stringsFile);
    } catch {
      skipped.push({ file: entry.name, reason: 'missing localized item string list' });
      continue;
    }

    const name = getString(strings, 'name');
    if (!name || /^\s*(?:\(?(?:DNS|PH)\)?|DO NOT SHIP)/i.test(name)) {
      skipped.push({ file: entry.name, reason: 'missing or non-shipping localized item name' });
      continue;
    }

    const usable = Array.isArray(raw.fUsableByClass) ? raw.fUsableByClass : [];
    const itemClasses = classes.filter((_, index) => Number(usable[index] ?? 0) !== 0);
    const forcedAffixes = Array.isArray(raw.arForcedAffixes) ? raw.arForcedAffixes : [];
    const affixIds = forcedAffixes
      .map((x: any) => String(x?.name ?? ''))
      .filter(Boolean);

    const isMythic = raw.snoSalvageTreasureClassMythic != null ||
      affixIds.some((x: string) => /UBERUNIQUE/i.test(x));

    const inventoryImageHandles = Array.from(new Set(
      (Array.isArray(raw.tInvImages) ? raw.tInvImages : [])
        .flatMap((x: any) => [positiveHandle(x?.hDefaultImage), positiveHandle(x?.hFemaleImage)])
        .filter((x: number | undefined): x is number => typeof x === 'number')
    ));
    const actorSno = positiveHandle(raw.snoActor?.__raw__);
    const iconRef = inventoryImageHandles.length || actorSno
      ? { inventoryImageHandles, actorSno }
      : undefined;

    const item = ItemSchema.parse({
      id: slugify(internalName),
      slug: slugify(name),
      name,
      rarity: isMythic ? 'mythic' : 'unique',
      slot,
      classes: itemClasses,
      affixIds,
      flavor: getString(strings, 'flavor'),
      requiredLevel: typeof raw.nExplicitRequiredLevel === 'number' && raw.nExplicitRequiredLevel > 0
        ? raw.nExplicitRequiredLevel
        : undefined,
      fixedPowerLevel: typeof raw.nFixedIPowerLevel === 'number' && raw.nFixedIPowerLevel > 0
        ? raw.nFixedIPowerLevel
        : undefined,
      iconRef,
      source: {
        file: path.relative(root, itemFile),
        sno: raw.__snoID__,
      },
      localizationSource: {
        file: path.relative(root, stringsFile),
        sno: strings.__snoID__,
      },
      patch: build,
    });

    items.push({
      ...item,
      _internalName: internalName,
      _seasonal: /^S\d+_/i.test(internalName),
    });
  } catch (error) {
    skipped.push({
      file: entry.name,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

items.sort((a, b) => Number(a._seasonal) - Number(b._seasonal) || a._internalName.localeCompare(b._internalName));

const canonical = new Map<string, Item>();
for (const item of items) {
  const key = `${item.slug}|${item.slot}|${item.rarity}`;
  if (canonical.has(key)) {
    skipped.push({ file: item.source.file, reason: `duplicate canonical item: ${item.name}` });
    continue;
  }
  const { _internalName, _seasonal, ...clean } = item;
  canonical.set(key, clean);
}

const deduped = Array.from(canonical.values())
  .sort((a, b) => a.rarity.localeCompare(b.rarity) || a.name.localeCompare(b.name));
const withInventoryImageHandle = deduped.filter(x => (x.iconRef?.inventoryImageHandles.length ?? 0) > 0).length;
const withActorSno = deduped.filter(x => x.iconRef?.actorSno).length;

await writeJson('data/generated/items.json', deduped);
await writeJson('data/generated/items-report.json', {
  source: 'DiabloTools/d4data',
  gameBuild: build,
  generatedAt: new Date().toISOString(),
  imported: deduped.length,
  withInventoryImageHandle,
  inventoryImageCoverage: deduped.length ? withInventoryImageHandle / deduped.length : 0,
  withActorSno,
  actorSnoCoverage: deduped.length ? withActorSno / deduped.length : 0,
  byRarity: {
    mythic: deduped.filter(x => x.rarity === 'mythic').length,
    unique: deduped.filter(x => x.rarity === 'unique').length,
  },
  bySlot: Object.fromEntries(
    Array.from(new Set(deduped.map(x => x.slot ?? 'unknown'))).sort().map(slot => [
      slot,
      deduped.filter(x => (x.slot ?? 'unknown') === slot).length,
    ])
  ),
  skipped: skipped.length,
  skippedSamples: skipped.slice(0, 100),
});

if (deduped.length < 50) throw new Error(`Item sanity check failed: only ${deduped.length} unique/mythic items imported`);
const harlequins = deduped.filter(x => x.name === 'Harlequin Crest');
if (harlequins.length !== 1) throw new Error(`Item sanity check failed: expected exactly one Harlequin Crest, got ${harlequins.length}`);
if (harlequins[0].rarity !== 'mythic' || harlequins[0].slot !== 'helm') {
  throw new Error('Item sanity check failed: Harlequin Crest canonical metadata mismatch');
}
if (!harlequins[0].iconRef?.inventoryImageHandles.includes(4259099416)) {
  throw new Error('Item icon sanity check failed: Harlequin Crest inventory image handle missing');
}

console.log(`Imported ${deduped.length} canonical unique/mythic equipment items from d4data ${build}`);
console.log(`Item inventory image refs: ${withInventoryImageHandle}/${deduped.length}; actor SNO refs: ${withActorSno}/${deduped.length}`);
