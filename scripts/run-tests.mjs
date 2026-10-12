import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const directory = process.argv.includes('--integration') ? 'tests/integration' : 'tests';
const files = readdirSync(directory).filter(name => name.endsWith('.test.ts')).map(name => path.join(directory,name));
if (!files.length) throw new Error('No test files found');
const result = spawnSync(process.execPath,['--import','tsx','--test',...files],{stdio:'inherit'});
process.exitCode = result.status ?? 1;
