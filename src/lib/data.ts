import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SkillSchema, ItemSchema, AspectSchema, AffixSchema } from '../../schemas/domain';

// Missing exports are a valid empty state. Invalid exports fail the build.
export function readGenerated<T>(name: string, fallback: T): T {
  const file = path.resolve('data/generated', name);
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}
export const skills = SkillSchema.array().parse(readGenerated('skills.json', []));
export const items = ItemSchema.array().parse(readGenerated('items.json', []));
export const aspects = AspectSchema.array().parse(readGenerated('aspects.json', []));
export const affixes = AffixSchema.array().parse(readGenerated('affixes.json', []));
export const metadata = readGenerated<{ gameBuild: string | null; generatedAt: string | null; source: string }>('metadata.json', { gameBuild: null, generatedAt: null, source: 'DiabloTools/d4data' });
export const tree = readGenerated<{ gameBuild: string | null; classes: Record<string, unknown> }>('skill-tree.json', { gameBuild: null, classes: {} });
export const hasRecords = skills.length + items.length + aspects.length > 0;
