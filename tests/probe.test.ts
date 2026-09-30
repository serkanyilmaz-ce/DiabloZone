import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { probeJsonFile } from '../scripts/import-d4data/probe-lib.js';

const root = path.resolve('tests/fixtures');
const file = path.join(root, 'json/sample.json');

test('probe discovers PoC targets without relying on fixed d4data paths', async () => {
  const matches = await probeJsonFile(file, root);
  assert.ok(matches.some(x => x.target === 'fireball'));
  assert.ok(matches.some(x => x.target === 'harlequin'));
  assert.ok(matches.some(x => x.target === 'aspect'));
});
