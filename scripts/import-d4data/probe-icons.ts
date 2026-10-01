import { promises as fs } from 'node:fs';
import path from 'node:path';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const skills = await readJson<any[]>(path.resolve('data/generated/skills.json'));
const items = await readJson<any[]>(path.resolve('data/generated/items.json'));

const skillRows: any[] = [];
for (const skill of skills) {
  const file = path.join(root, skill.source.file);
  const raw = await readJson<any>(file);
  const iconHandle = Number(raw.hIconNormal ?? 0);
  skillRows.push({
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    class: skill.class,
    sourceSno: skill.source?.sno,
    iconHandle: iconHandle > 0 ? iconHandle : null,
    mouseoverHandle: Number(raw.hIconMouseover ?? 0) || null,
    pushedHandle: Number(raw.hIconPushed ?? 0) || null,
    inactiveHandle: Number(raw.hIconInactive ?? 0) || null,
  });
}

const itemRows: any[] = [];
for (const item of items) {
  const file = path.join(root, item.source.file);
  const raw = await readJson<any>(file);
  const imageHandles = (Array.isArray(raw.tInvImages) ? raw.tInvImages : [])
    .flatMap((x: any) => [Number(x?.hDefaultImage ?? 0), Number(x?.hFemaleImage ?? 0)])
    .filter((x: number) => x > 0);
  const actorSno = Number(raw.snoActor?.__raw__ ?? 0);
  itemRows.push({
    id: item.id,
    slug: item.slug,
    name: item.name,
    slot: item.slot,
    sourceSno: item.source?.sno,
    actorSno: actorSno > 0 ? actorSno : null,
    inventoryImageHandles: [...new Set(imageHandles)],
  });
}

const fireball = skillRows.find(x => x.name === 'Fireball' && x.class === 'sorcerer');
const harlequin = itemRows.find(x => x.name === 'Harlequin Crest');

if (fireball?.iconHandle !== 2402480109) {
  throw new Error(`Fireball icon sanity check failed: ${fireball?.iconHandle}`);
}
if (harlequin?.actorSno !== 1089568 || !harlequin?.inventoryImageHandles?.includes(4259099416)) {
  throw new Error(`Harlequin icon sanity check failed: ${JSON.stringify(harlequin)}`);
}

const report = {
  source: 'DiabloTools/d4data',
  generatedAt: new Date().toISOString(),
  skills: {
    total: skillRows.length,
    withIconHandle: skillRows.filter(x => x.iconHandle).length,
    missing: skillRows.filter(x => !x.iconHandle).map(x => ({ id: x.id, name: x.name })).slice(0, 100),
  },
  items: {
    total: itemRows.length,
    withActorSno: itemRows.filter(x => x.actorSno).length,
    withInventoryImageHandle: itemRows.filter(x => x.inventoryImageHandles.length).length,
    missingActor: itemRows.filter(x => !x.actorSno).map(x => ({ id: x.id, name: x.name })).slice(0, 100),
    missingInventoryImage: itemRows.filter(x => !x.inventoryImageHandles.length).map(x => ({ id: x.id, name: x.name })).slice(0, 100),
  },
  proof: { fireball, harlequin },
};

await fs.writeFile(path.resolve('data/generated/icon-reference-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Icon refs: skills ${report.skills.withIconHandle}/${report.skills.total}; items actor ${report.items.withActorSno}/${report.items.total}; inventory ${report.items.withInventoryImageHandle}/${report.items.total}`);
