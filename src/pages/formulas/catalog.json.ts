import {formulaManifest} from '../../lib/formula-archive';
export function GET(){return new Response(JSON.stringify(formulaManifest()),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
