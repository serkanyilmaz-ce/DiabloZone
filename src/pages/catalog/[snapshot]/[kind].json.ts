import {cardManifest} from '../../../lib/catalogue-cards';
import {metadata} from '../../../lib/data';
export function getStaticPaths(){return ['skills','items','aspects','affixes','all'].map(kind=>({params:{snapshot:metadata.snapshotId??'unpublished',kind}}));}
export function GET({params}:any){return new Response(JSON.stringify(cardManifest(params.kind)),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
