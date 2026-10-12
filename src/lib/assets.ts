import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
interface GameAsset{handle:number;status:string;path?:string;sha256?:string;width?:number;height?:number;referenceStatus?:string}
const file=path.resolve('data/research/assets-manifest.json');
export const assetManifest: {sourceVersion?:string;dataSourceVersion?:string;assetSetId?:string;inputSha256?:string;storageSource?:string;assets:GameAsset[]}=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{assets:[]};
const assets=new Map(assetManifest.assets.filter(a=>a.status==='extracted'&&a.path).map(a=>[a.handle,a]));
export const gameAsset=(handle?:number)=>handle?assets.get(handle):undefined;
export const gameAssetPath=(handle?:number)=>gameAsset(handle)?.path;
export const treeAssets=Object.fromEntries([...assets].map(([h,a])=>[h,a.path]));
