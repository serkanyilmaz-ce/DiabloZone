export interface SearchEntry { text: string; filters: Record<string, string>; }
export function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}
export function matchesEntry(entry: SearchEntry, query: string, filters: Record<string, string>): boolean {
  const words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const haystack = normalizeSearch(entry.text);
  return words.every(word => haystack.includes(word)) && Object.entries(filters).every(([key, value]) => !value || entry.filters[key] === value);
}
export function pageSlice<T>(entries: T[], requestedPage: number, pageSize = 24) {
  const pages = Math.max(1, Math.ceil(entries.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  return { page, pages, entries: entries.slice((page - 1) * pageSize, page * pageSize) };
}
