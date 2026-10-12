import {writeFile} from 'node:fs/promises';
import {formulaRecords} from '../../src/lib/formula-archive.js';
import {metadata} from '../../src/lib/data.js';
import {systemArchive} from '../../src/lib/systems.js';
const groups=[...new Set(formulaRecords.map(r=>r.kind))];
const counts=groups.map(kind=>{const rows=formulaRecords.filter(r=>r.kind===kind);return {kind,nonempty:rows.length,supportedSyntax:rows.filter(r=>r.status==='supported').length,manualSymbols:rows.filter(r=>r.status==='supported'&&r.symbols.length>0).length,unsupportedSyntax:rows.filter(r=>r.status==='unsupported').length};});
await writeFile('data/research/formula-coverage.json',JSON.stringify({sourceVersion:metadata.sourceVersion,gameSnapshot:metadata.snapshotId,systemArchive:systemArchive?.archiveId,counts,verifiedGameMechanics:0,note:'Grammar support does not verify game behavior, units, rounding, coefficients or dependency values.'},null,2)+'\n');
console.log(JSON.stringify(counts));
