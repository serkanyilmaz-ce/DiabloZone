import {z} from 'zod';
import {SourceRefSchema,RawFormulaSchema} from './domain.js';
export const systemKinds=['ParagonBoard','ParagonNode','ParagonGlyph','ParagonGlyphAffix','Recipe','Season','GameBalance'] as const;
export const SystemRecordSchema=z.object({
  id:z.string().regex(/^\d+$/),kind:z.enum(systemKinds),slug:z.string().regex(/^[a-z0-9-]+$/),
  name:z.string(),internalName:z.string(),descriptionTemplate:z.string().optional(),
  source:SourceRefSchema,localizationSource:SourceRefSchema.optional(),
  iconHandles:z.array(z.number().int().positive()),rawFormulas:z.array(RawFormulaSchema),
  rawData:z.record(z.string(),z.unknown()),
  references:z.array(z.object({path:z.string(),sno:z.number().int().positive(),kind:z.string().optional(),name:z.string().optional(),file:z.string().optional(),resolution:z.enum(['archive','pinned-reference','unavailable']),targetSlug:z.string().optional()})),
});
export const SystemBundleSchema=z.object({
  sourceVersion:z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),sourceCommit:z.string().regex(/^[a-f0-9]{40}$/),
  season:z.literal(15),channel:z.literal('live'),records:z.array(SystemRecordSchema),
  archiveId:z.uuid().optional(),inputSha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),storageSource:z.literal('DiabloZone PostgreSQL').optional(),
});
export type SystemRecord=z.infer<typeof SystemRecordSchema>;
