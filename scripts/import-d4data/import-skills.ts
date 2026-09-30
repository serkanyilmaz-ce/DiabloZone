import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SkillSchema, type Skill } from '../../schemas/domain.js';
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

const classMap: Record<string, Skill['class']> = {
  Barbarian: 'barbarian',
  Druid: 'druid',
  Necromancer: 'necromancer',
  Rogue: 'rogue',
  Sorcerer: 'sorcerer',
  Spiritborn: 'spiritborn',
  Paladin: 'paladin',
  Warlock: 'warlock',
};

const root = path.resolve(arg('--datamine') ?? '.tmp/d4data');
const build = (await readBuildVersion(root)) ?? 'unknown';
const stringsDir = path.join(root, 'json/enUS_Text/meta/StringList');
const powersDir = path.join(root, 'json/base/meta/Power');

const entries = await fs.readdir(stringsDir, { withFileTypes: true });
const skills: Skill[] = [];
const skipped: Array<{ file: string; reason: string }> = [];

for (const entry of entries) {
  if (!entry.isFile()) continue;
  const match = /^Power_(Barbarian|Druid|Necromancer|Rogue|Sorcerer|Spiritborn|Paladin|Warlock)_(.+)\.stl\.json$/i.exec(entry.name);
  if (!match) continue;

  const classToken = Object.keys(classMap).find(x => x.toLowerCase() === match[1].toLowerCase());
  if (!classToken) continue;
  const d4class = classMap[classToken];
  const internalPowerName = `${classToken}_${match[2]}`;
  const powerFile = path.join(powersDir, `${internalPowerName}.pow.json`);
  const stringsFile = path.join(stringsDir, entry.name);

  try {
    await fs.access(powerFile);
  } catch {
    skipped.push({ file: entry.name, reason: 'matching power file not found' });
    continue;
  }

  try {
    const strings = await readStringList(stringsFile);
    const power = await readJson<any>(powerFile);
    const name = getString(strings, 'name');
    const descriptionTemplate = getString(strings, 'desc');

    if (!name) {
      skipped.push({ file: entry.name, reason: 'missing localized name' });
      continue;
    }

    if (power.bMustBeLearned !== true) {
      skipped.push({ file: entry.name, reason: 'not a learnable player skill' });
      continue;
    }

    const tags = (power.arSkillTags ?? [])
      .filter((x: any) => x?.bSearchOnly !== true)
      .map((x: any) => x?.gbidSkillTag?.name)
      .filter((x: unknown): x is string => typeof x === 'string');

    const primaryTag = String(power.tPrimaryTag?.gbidSkillTag?.name ?? '');
    const category = primaryTag.startsWith('Skill_Primary_')
      ? primaryTag.slice('Skill_Primary_'.length).toLowerCase()
      : undefined;

    const skill = SkillSchema.parse({
      id: `${d4class}-${slugify(name)}`,
      slug: slugify(name),
      name,
      class: d4class,
      category,
      type: power.bIsPassive ? 'passive' : 'active',
      description: cleanTooltipText(descriptionTemplate),
      descriptionTemplate,
      tags,
      source: {
        file: path.relative(root, powerFile),
        sno: power.__snoID__,
      },
      localizationSource: {
        file: path.relative(root, stringsFile),
        sno: strings.__snoID__,
      },
      patch: build,
    });

    skills.push(skill);
  } catch (error) {
    skipped.push({
      file: entry.name,
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

skills.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name));

await writeJson('data/generated/skills.json', skills);
await writeJson('data/generated/skills-report.json', {
  source: 'DiabloTools/d4data',
  gameBuild: build,
  generatedAt: new Date().toISOString(),
  imported: skills.length,
  byClass: Object.fromEntries(
    Object.keys(classMap).map(key => {
      const cls = classMap[key];
      return [cls, skills.filter(skill => skill.class === cls).length];
    })
  ),
  skipped: skipped.length,
  skippedSamples: skipped.slice(0, 100),
});

console.log(`Imported ${skills.length} learnable skills from d4data ${build}`);
