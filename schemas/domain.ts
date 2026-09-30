import { z } from 'zod';

export const D4ClassSchema = z.enum([
  'barbarian',
  'druid',
  'necromancer',
  'rogue',
  'sorcerer',
  'spiritborn',
  'paladin',
  'warlock',
  'unknown'
]);

export const SourceRefSchema = z.object({
  file: z.string(),
  sourceId: z.union([z.string(), z.number()]).optional(),
  sno: z.union([z.string(), z.number()]).optional(),
  gbid: z.union([z.string(), z.number()]).optional(),
});

export const SkillSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  class: D4ClassSchema,
  category: z.string().optional(),
  type: z.enum(['active', 'passive', 'modifier', 'unknown']).default('unknown'),
  parentId: z.string().optional(),
  description: z.string().optional(),
  descriptionTemplate: z.string().optional(),
  maxRank: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  cooldown: z.number().nonnegative().optional(),
  resourceCost: z.number().nonnegative().optional(),
  icon: z.string().optional(),
  source: SourceRefSchema,
  localizationSource: SourceRefSchema.optional(),
  patch: z.string(),
});

export const ItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  rarity: z.enum(['common','magic','rare','legendary','unique','mythic','unknown']),
  slot: z.string().optional(),
  classes: z.array(D4ClassSchema).default([]),
  affixIds: z.array(z.string()).default([]),
  uniquePowerId: z.string().optional(),
  flavor: z.string().optional(),
  requiredLevel: z.number().int().nonnegative().optional(),
  fixedPowerLevel: z.number().int().nonnegative().optional(),
  icon: z.string().optional(),
  source: SourceRefSchema,
  localizationSource: SourceRefSchema.optional(),
  patch: z.string(),
});

export const AspectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  descriptionTemplate: z.string().optional(),
  category: z.enum(['offensive','defensive','utility','resource','mobility','unknown']),
  classes: z.array(D4ClassSchema).default([]),
  allowedSlots: z.array(z.string()).default([]),
  rawAllowedItemLabels: z.array(z.number()).default([]),
  tags: z.array(z.string()).default([]),
  source: SourceRefSchema,
  affixSource: SourceRefSchema.optional(),
  localizationSource: SourceRefSchema.optional(),
  patch: z.string(),
});

export type Skill = z.infer<typeof SkillSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Aspect = z.infer<typeof AspectSchema>;
