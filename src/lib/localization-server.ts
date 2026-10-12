import {readFileSync} from 'node:fs';
import path from 'node:path';
import manifest from '../../data/research/localization-manifest.json';
import {metadata} from './data';
const bundle=JSON.parse(readFileSync(path.resolve('public',manifest.url),'utf8'));
if(bundle.localeSetId!==manifest.localeSetId||bundle.gameSnapshotId!==metadata.snapshotId)throw new Error('Localization source snapshot mismatch');
export function originalTurkish(key:string,field:string):string|undefined{return bundle.records[key]?.[field]?.tr;}
