import { z } from 'zod';

export const D4ClassSchema = z.enum(['barbarian','druid','necromancer','rogue','sorcerer','spiritborn','paladin','warlock','unknown']);
export const SourceRefSchema = z.object({ file:z.string(), sourceId:z.union([z.string(),z.number()]).optional(), sno:z.union([z.string(),z.number()]).optional(), gbid:z.union([z.string(),z.number()]).optional(), sha256:z.string().regex(/^[a-f0-9]{64}$/).optional(), gitBlob:z.string().regex(/^[a-f0-9]{40}$/).optional(), commit:z.string().regex(/^[a-f0-9]{40}$/).optional() });
export const RawFormulaSchema = z.object({path:z.string(),expression:z.string()});
const evidenceFields={rawFormulas:z.array(RawFormulaSchema).default([]),classId:z.string().optional()};
export const SkillIconRefSchema = z.object({ normalHandle:z.number().int().positive(), mouseoverHandle:z.number().int().positive().optional(), pushedHandle:z.number().int().positive().optional(), inactiveHandle:z.number().int().positive().optional() });
export const ItemIconRefSchema = z.object({ inventoryImageHandles:z.array(z.number().int().positive()).default([]), actorSno:z.number().int().positive().optional() });
export const AspectIconRefSchema = z.object({ overrideHandle:z.number().int().positive() });

export const SkillSchema = z.object({
  ...evidenceFields,
  id:z.string(), slug:z.string(), name:z.string(), class:D4ClassSchema, category:z.string().optional(),
  type:z.enum(['active','passive','modifier','unknown']).default('unknown'), parentId:z.string().optional(),
  description:z.string().optional(), descriptionTemplate:z.string().optional(), maxRank:z.number().int().positive().optional(),
  tags:z.array(z.string()).default([]), cooldown:z.number().nonnegative().optional(), resourceCost:z.number().nonnegative().optional(),
  icon:z.string().optional(), iconRef:SkillIconRefSchema.optional(), source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const ItemSchema = z.object({
  ...evidenceFields,
  classRestrictionStatus:z.enum(['explicit','unknown']).default('unknown'),
  id:z.string(), slug:z.string(), name:z.string(), rarity:z.enum(['common','magic','rare','legendary','unique','mythic','unknown']),
  slot:z.string().optional(), classes:z.array(D4ClassSchema).default([]), affixIds:z.array(z.string()).default([]), uniquePowerId:z.string().optional(),
  flavor:z.string().optional(), requiredLevel:z.number().int().nonnegative().optional(), fixedPowerLevel:z.number().int().nonnegative().optional(),
  icon:z.string().optional(), iconRef:ItemIconRefSchema.optional(), source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const AspectSchema = z.object({
  ...evidenceFields,
  affixId:z.string().optional(),
  id:z.string(), slug:z.string(), name:z.string(), description:z.string().optional(), descriptionTemplate:z.string().optional(),
  category:z.enum(['offensive','defensive','utility','resource','mobility','unknown']), classes:z.array(D4ClassSchema).default([]),
  allowedSlots:z.array(z.string()).default([]), rawAllowedItemLabels:z.array(z.number()).default([]), tags:z.array(z.string()).default([]),
  icon:z.string().optional(), iconRef:AspectIconRefSchema.optional(), source:SourceRefSchema, affixSource:SourceRefSchema.optional(), localizationSource:SourceRefSchema.optional(), patch:z.string(),
});

export const AffixSchema = z.object({
  ...evidenceFields,
  slug:z.string().optional(),rawAllowedItemLabels:z.array(z.number()).default([]),
  id:z.string(), internalName:z.string(), name:z.string().optional(), description:z.string().optional(), descriptionTemplate:z.string().optional(),
  staticValues:z.array(z.number()).default([]), itemPowerMin:z.number().optional(), itemPowerMax:z.number().optional(), tags:z.array(z.string()).default([]),
  source:SourceRefSchema, localizationSource:SourceRefSchema.optional(), passivePowerSource:SourceRefSchema.optional(), patch:z.string(),
});

export type Skill = z.infer<typeof SkillSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Aspect = z.infer<typeof AspectSchema>;
export type Affix = z.infer<typeof AffixSchema>;

export const ClassSchema=z.object({
  id:z.string(),slug:z.string(),name:z.string(),code:D4ClassSchema,
  skillKitId:z.string(),skillIds:z.array(z.string()),source:SourceRefSchema,
  rawData:z.record(z.string(),z.unknown()).default({}),patch:z.string(),
});
export const TreeNodeSchema=z.object({
  id:z.number().int(),x:z.number(),y:z.number(),kind:z.enum(['active','passive','modifier','hub','gate']),
  name:z.string(),description:z.string().optional(),powerSno:z.number().int().optional(),skillId:z.string().optional(),skillSlug:z.string().optional(),
  category:z.string().optional(),maxRanks:z.number().int().positive().optional(),requiredLevel:z.number().nonnegative(),exclusiveGroup:z.number().optional(),rewardName:z.string().optional(),
});
export const TreeRecordSchema=z.object({
  id:z.string(),slug:z.string(),name:z.string(),classCode:D4ClassSchema,classId:z.string(),patch:z.string(),source:SourceRefSchema,
  scope:z.enum(['excerpt','full']),sourceNodeCount:z.number().int().positive(),sourceEdgeCount:z.number().int().nonnegative(),
  bounds:z.object({minX:z.number(),minY:z.number(),maxX:z.number(),maxY:z.number()}),
  nodes:z.array(TreeNodeSchema).min(1),edges:z.array(z.object({from:z.number().int(),to:z.number().int(),points:z.array(z.object({x:z.number(),y:z.number()})).min(2)})),
}).superRefine((tree,context)=>{
  const ids=new Set(tree.nodes.map(node=>node.id));
  if(ids.size!==tree.nodes.length || tree.edges.some(edge=>!ids.has(edge.from)||!ids.has(edge.to))) context.addIssue({code:'custom',message:'Invalid tree node identity or edge endpoint'});
});
export type GameClass=z.infer<typeof ClassSchema>;
export type TreeRecord=z.infer<typeof TreeRecordSchema>;
