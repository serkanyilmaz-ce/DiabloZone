import { z } from 'zod';

export const D4ClassSchema = z.enum(['barbarian','druid','necromancer','rogue','sorcerer','spiritborn','paladin','warlock','unknown']);
export const SourceRefSchema = z.object({ file:z.string(), sourceId:z.union([z.string(),z.number()]).optional(), sno:z.union([z.string(),z.number()]).optional(), gbid:z.union([z.string(),z.number()]).optional() });
export const SkillIconRefSchema = z.object({ normalHandle:z.number().int().positive(), mouseoverHandle:z.number().int().positive().optional(), pushedHandle:z.number().int().positive().optional(), inactiveHandle:z.number().int().positive().optional() });
export const ItemIconRefSchema = z.object({ inventoryImageHandles:z.array(z.number().int().positive()).default([]), actorSno:z.number().int().positive().optional() });
export const AspectIconRefSchema = z.object({ overrideHandle:z.number().int().positive() });

export const SkillSchema = z.object({
  id:z.string(), slug:z.string(), name:z.string(), class:D4ClassSchema, category:z.string().optional(),
  type:z.enum(['active','passive','modifier','unknown']).default('unknown'), parentId:z.string().optional(),
  description:z.string().optional(), descriptionTemplate:z.string().optional(), maxRank:z.number().int().positive().optional(),
  tags:z.array(z.string()).default([]), cooldown:z.number().nonnegative().optional(), resourceCost:z.number().nonnegative().optional(),
  icon:z.string().optional(), iconRef:SkillIconRefSchema.optional(), source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const ItemSchema = z.object({
  id:z.string(), slug:z.string(), name:z.string(), rarity:z.enum(['common','magic','rare','legendary','unique','mythic','unknown']),
  slot:z.string().optional(), classes:z.array(D4ClassSchema).default([]), affixIds:z.array(z.string()).default([]), uniquePowerId:z.string().optional(),
  flavor:z.string().optional(), requiredLevel:z.number().int().nonnegative().optional(), fixedPowerLevel:z.number().int().nonnegative().optional(),
  icon:z.string().optional(), iconRef:ItemIconRefSchema.optional(), source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const AspectSchema = z.object({
  id:z.string(), slug:z.string(), name:z.string(), description:z.string().optional(), descriptionTemplate:z.string().optional(),
  category:z.enum(['offensive','defensive','utility','resource','mobility','unknown']), classes:z.array(D4ClassSchema).default([]),
  allowedSlots:z.array(z.string()).default([]), rawAllowedItemLabels:z.array(z.number()).default([]), tags:z.array(z.string()).default([]),
  icon:z.string().optional(), iconRef:AspectIconRefSchema.optional(), source:SourceRefSchema, affixSource:SourceRefSchema.optional(), localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const AffixSchema = z.object({
  id:z.string(), internalName:z.string(), name:z.string().optional(), description:z.string().optional(), descriptionTemplate:z.string().optional(),
  staticValues:z.array(z.number()).default([]), itemPowerMin:z.number().optional(), itemPowerMax:z.number().optional(), tags:z.array(z.string()).default([]),
  source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), passivePowerSource:SourceRefSchema.optional(), patch:z.string(),
});

export type Skill = z.infer<typeof SkillSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Aspect = z.infer<typeof AspectSchema>;
export type Affix = z.infer<typeof AffixSchema>;
