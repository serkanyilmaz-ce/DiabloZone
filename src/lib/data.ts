import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SkillSchema, ItemSchema, AspectSchema, AffixSchema,ClassSchema,TreeRecordSchema } from '../../schemas/domain';
import {gameAssetPath} from './assets';

// Missing exports are a valid empty state. Invalid exports fail the build.
export function readGenerated<T>(name: string, fallback: T): T {
  const file = path.resolve('data/generated', name);
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}
export const skills = SkillSchema.array().parse(readGenerated('skills.json', [])).map(record=>({...record,icon:gameAssetPath(record.iconRef?.normalHandle)??record.icon}));
export const items = ItemSchema.array().parse(readGenerated('items.json', [])).map(record=>({...record,icon:gameAssetPath(record.iconRef?.inventoryImageHandles[0])??record.icon}));
export const aspects = AspectSchema.array().parse(readGenerated('aspects.json', [])).map(record=>({...record,icon:gameAssetPath(record.iconRef?.overrideHandle)??record.icon}));
export const affixes = AffixSchema.array().parse(readGenerated('affixes.json', []));
export const gameClasses=ClassSchema.array().parse(readGenerated('classes.json',[]));
export const metadata = readGenerated<{ gameBuild: string | null; generatedAt: string | null; source: string;sourceVersion?:string;season?:number;channel?:string;sourceCommit?:string;snapshotId?:string;inputSha256?:string;sample?:boolean }>('metadata.json', { gameBuild: null, generatedAt: null, source: 'DiabloTools/d4data' });
export const tree = readGenerated<{ gameBuild: string | null; classes: Record<string, unknown> }>('skill-tree.json', { gameBuild: null, classes: {} });
if(metadata.inputSha256){
  Object.values(tree.classes).forEach(board=>TreeRecordSchema.parse(board));
  const records=[...skills,...items,...aspects,...affixes,...gameClasses];
  if(!metadata.snapshotId||records.some(record=>record.patch!==metadata.sourceVersion))throw new Error('Published static catalogue has mismatched snapshot/build context');
}
export const hasRecords = skills.length + items.length + aspects.length > 0;
