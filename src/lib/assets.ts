import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
interface GameAsset{handle:number;status:string;path?:string;sha256?:string;width?:number;height?:number;referenceStatus?:string;atlasName?:string}
const file=path.resolve('data/research/assets-manifest.json');
export const assetManifest: {sourceVersion?:string;dataSourceVersion?:string;assetSetId?:string;inputSha256?:string;storageSource?:string;assets:GameAsset[]}=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{assets:[]};
// Handles that resolve into developer test/gray-box atlases or 1px swatches render as
// magenta/blank tiles; they are kept in the manifest but are not shown as record icons.
const displayable=(a:GameAsset)=>(a.width??0)>=24&&(a.height??0)>=24&&!/test|graybox/i.test(a.atlasName??'');
const extracted=assetManifest.assets.filter(a=>a.status==='extracted'&&a.path);
const assets=new Map(extracted.filter(displayable).map(a=>[a.handle,a]));
export const gameAsset=(handle?:number)=>handle?assets.get(handle):undefined;
export const gameAssetPath=(handle?:number)=>gameAsset(handle)?.path;
export const treeAssets=Object.fromEntries(extracted.map(a=>[a.handle,a.path]));
