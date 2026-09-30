import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function* walkJson(root: string): AsyncGenerator<string> {
  const stack = [root];
  while (stack.length) {
    const current = stack.pop()!;
    let entries;
    try { entries = await fs.readdir(current, { withFileTypes: true }); }
    catch { continue; }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.json')) yield full;
    }
  }
}

export async function readBuildVersion(root: string): Promise<string | null> {
  try { return (await fs.readFile(path.join(root, 'buildVersion.txt'), 'utf8')).trim() || null; }
  catch { return null; }
}

export async function writeJson(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
}
