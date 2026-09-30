import path from 'node:path';
import { walkJson, readBuildVersion, writeJson } from './io.js';
import { probeJsonFile } from './probe-lib.js';
import type { ProbeOutput } from './types.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const datamine = path.resolve(arg('--datamine') ?? process.env.D4DATA_PATH ?? './d4data');
const outputDir = path.resolve(arg('--out') ?? './data/generated');
const gameBuild = await readBuildVersion(datamine);
const matches = [];
let scannedJsonFiles = 0;

console.log(`[probe] datamine=${datamine}`);
for await (const file of walkJson(datamine)) {
  scannedJsonFiles++;
  const found = await probeJsonFile(file, datamine);
  matches.push(...found);
  if (scannedJsonFiles % 500 === 0) console.log(`[probe] scanned ${scannedJsonFiles} JSON files`);
}

const output: ProbeOutput = {
  source: 'DiabloTools/d4data',
  gameBuild,
  scannedJsonFiles,
  generatedAt: new Date().toISOString(),
  matches,
};

await writeJson(path.join(outputDir, 'proof.json'), output);
await writeJson(path.join(outputDir, 'metadata.json'), {
  source: output.source,
  gameBuild,
  generatedAt: output.generatedAt,
  schemaVersion: 1,
});

const summary = ['fireball','harlequin','aspect'].map(target => `${target}=${matches.filter(x => x.target === target).length}`).join(' ');
console.log(`[probe] files=${scannedJsonFiles} ${summary}`);
if (!scannedJsonFiles) {
  console.error('[probe] No JSON files found. Pass --datamine /path/to/d4data or set D4DATA_PATH.');
  process.exitCode = 2;
}
