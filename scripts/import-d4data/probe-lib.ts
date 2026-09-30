import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { ProbeMatch, ProbeTarget } from './types.js';

const needles: Record<ProbeTarget, RegExp> = {
  fireball: /\bfireball\b/i,
  harlequin: /\bharlequin(?:\s+crest)?\b/i,
  aspect: /\baspect\b/i,
};

const idKeys = ['id', 'Id', 'ID', 'snoId', 'SNOId', 'SnoId', '__snoID__'];
const snoKeys = ['sno', 'SNO', 'snoId', 'SNOId', 'SnoId', '__snoID__'];
const gbidKeys = ['gbid', 'GBID', 'Gbid', 'gameBalanceId', 'GameBalanceId'];

function pick(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
}

function stringifyPreview(value: unknown): string {
  let text: string;
  try { text = JSON.stringify(value); } catch { text = String(value); }
  return text.length > 520 ? text.slice(0, 520) + '…' : text;
}

export function findMatches(value: unknown, file: string, root: string, maxPerTarget = 30): ProbeMatch[] {
  const out: ProbeMatch[] = [];
  const counts = new Map<ProbeTarget, number>();
  const seen = new WeakSet<object>();

  function visit(node: unknown, jsonPath: string) {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node as object)) return;
    seen.add(node as object);

    const text = stringifyPreview(node);
    for (const target of Object.keys(needles) as ProbeTarget[]) {
      if ((counts.get(target) ?? 0) >= maxPerTarget) continue;
      if (needles[target].test(text)) {
        const record = node as Record<string, unknown>;
        out.push({
          target,
          file: path.relative(root, file).replaceAll('\\', '/'),
          path: jsonPath,
          preview: text,
          sourceId: pick(record, idKeys),
          sno: pick(record, snoKeys),
          gbid: pick(record, gbidKeys),
        });
        counts.set(target, (counts.get(target) ?? 0) + 1);
      }
    }

    if (Array.isArray(node)) node.forEach((child, i) => visit(child, `${jsonPath}[${i}]`));
    else Object.entries(node as Record<string, unknown>).forEach(([k, child]) => visit(child, `${jsonPath}.${k}`));
  }

  visit(value, '$');
  return out;
}

export async function probeJsonFile(file: string, root: string): Promise<ProbeMatch[]> {
  const raw = await fs.readFile(file, 'utf8');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return []; }
  return findMatches(parsed, file, root);
}
