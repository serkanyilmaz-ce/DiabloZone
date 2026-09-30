import { promises as fs } from 'node:fs';

export interface StringTableEntry {
  szLabel?: string;
  szText?: string;
}

export interface StringListDefinition {
  __fileName__?: string;
  __snoID__?: number;
  __type__?: string;
  arStrings?: StringTableEntry[];
}

export async function readStringList(file: string): Promise<StringListDefinition> {
  const raw = JSON.parse(await fs.readFile(file, 'utf8')) as StringListDefinition;
  if (raw.__type__ !== 'StringListDefinition' || !Array.isArray(raw.arStrings)) {
    throw new Error(`Not a d4data StringListDefinition: ${file}`);
  }
  return raw;
}

export function stringMap(list: StringListDefinition): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of list.arStrings ?? []) {
    if (!entry.szLabel || typeof entry.szText !== 'string') continue;
    map.set(entry.szLabel.toLowerCase(), entry.szText);
  }
  return map;
}

export function getString(list: StringListDefinition, ...labels: string[]): string | undefined {
  const map = stringMap(list);
  for (const label of labels) {
    const value = map.get(label.toLowerCase());
    if (value) return value;
  }
  return undefined;
}

export function cleanTooltipText(value?: string): string | undefined {
  if (!value) return undefined;

  return value
    .replace(/\{if:[^}]+\}/gi, '')
    .replace(/\{\/if\}/gi, '')
    .replace(/\{c_[^}]+\}/gi, '')
    .replace(/\{\/c(?:_[^}]+)?\}/gi, '')
    .replace(/\{u\}|\{\/u\}/gi, '')
    .replace(/\{icon:[^}]+\}/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
