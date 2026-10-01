import { promises as fs } from 'node:fs';
import path from 'node:path';
import { writeJson } from './io.js';

type SkillRecord = {
  id: string;
  slug: string;
  name: string;
  class: string;
  iconRef?: {
    normalHandle: number;
    mouseoverHandle?: number;
    pushedHandle?: number;
    inactiveHandle?: number;
  };
};

type ItemRecord = {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  slot?: string;
  iconRef?: {
    inventoryImageHandles: number[];
    actorSno?: number;
  };
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, 'utf8')) as T;
}

const generatedDir = path.resolve('data/generated');
const skills = await readJson<SkillRecord[]>(path.join(generatedDir, 'skills.json'));
const items = await readJson<ItemRecord[]>(path.join(generatedDir, 'items.json'));

const skillAssets = skills.map(skill => ({
  id: skill.id,
  slug: skill.slug,
  name: skill.name,
  class: skill.class,
  handles: skill.iconRef ?? null,
  preferredSourceHandle: skill.iconRef?.normalHandle ?? null,
  output: `public/assets/skills/${skill.slug}.webp`,
  status: skill.iconRef?.normalHandle ? 'ready-to-resolve' : 'missing-handle',
}));

const itemAssets = items.map(item => ({
  id: item.id,
  slug: item.slug,
  name: item.name,
  rarity: item.rarity,
  slot: item.slot ?? null,
  inventoryImageHandles: item.iconRef?.inventoryImageHandles ?? [],
  actorSno: item.iconRef?.actorSno ?? null,
  output: `public/assets/items/${item.slug}.webp`,
  status: (item.iconRef?.inventoryImageHandles.length ?? 0) > 0
    ? 'needs-texture-handle-resolution'
    : 'missing-inventory-image-handle',
  note: 'actorSno is provenance only and must not be treated as the icon asset id',
}));

const manifest = {
  generatedAt: new Date().toISOString(),
  skills: skillAssets,
  items: itemAssets,
  summary: {
    skills: {
      total: skillAssets.length,
      withHandle: skillAssets.filter(x => x.preferredSourceHandle).length,
    },
    items: {
      total: itemAssets.length,
      withInventoryImageHandle: itemAssets.filter(x => x.inventoryImageHandles.length > 0).length,
      withActorSno: itemAssets.filter(x => x.actorSno).length,
    },
  },
};

await writeJson(path.join(generatedDir, 'icon-manifest.json'), manifest);
console.log(`Icon manifest: skills ${manifest.summary.skills.withHandle}/${manifest.summary.skills.total}; items ${manifest.summary.items.withInventoryImageHandle}/${manifest.summary.items.total} inventory handles`);
