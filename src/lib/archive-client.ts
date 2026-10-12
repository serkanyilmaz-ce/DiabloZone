import { isUuid } from './api-query';
export interface ArchiveSnapshot { id: string; build_id: string; season_id: number; channel: string; }
export interface ArchiveMechanic { slug: string; title: string; status: string; }
export function archiveSnapshot(value: unknown): ArchiveSnapshot | null {
  if (!value || typeof value !== 'object' || !('data' in value) || !Array.isArray(value.data)) throw new Error('Arşiv yanıtı geçersiz.');
  if (!value.data.length) return null;
  const snapshot=value.data[0];
  if (!snapshot || !isUuid(snapshot.id) || typeof snapshot.build_id!=='string' || snapshot.season_id!==15 || snapshot.channel!=='live' || snapshot.manifest?.kind!=='research') throw new Error('Arşiv sürümü veya türü uyuşmuyor.');
  return snapshot as ArchiveSnapshot;
}
export function archiveMechanics(value: unknown, snapshotId: string): ArchiveMechanic[] {
  if (!value || typeof value!=='object' || !('snapshot' in value) || !('data' in value) || !Array.isArray(value.data)) throw new Error('Mekanik yanıtı geçersiz.');
  const snapshot=value.snapshot as {id?:string}|null;
  if (snapshot?.id!==snapshotId) throw new Error('Snapshot kaynakları karıştı.');
  const states=['unknown','hypothesis','datamined','measured','verified','contradicted'];
  if (!value.data.every(record=>record && typeof record.slug==='string' && typeof record.title==='string' && states.includes(record.status))) throw new Error('Mekanik kayıtları geçersiz.');
  return value.data as ArchiveMechanic[];
}
