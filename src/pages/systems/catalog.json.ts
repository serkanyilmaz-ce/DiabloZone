import {systemArchive,systemCards} from '../../lib/systems';
export function GET(){return new Response(JSON.stringify({snapshotId:systemArchive?.archiveId??'',records:systemCards}),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
