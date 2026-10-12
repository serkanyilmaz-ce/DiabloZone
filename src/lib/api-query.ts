export const recordKinds = ['skills','items','aspects','affixes','skill-tree'] as const;
export function parseRecordQuery(params: URLSearchParams) {
  const kind=params.get('kind') ?? 'skills';
  const query=params.get('q') ?? '';
  const pageText=params.get('page') ?? '1';
  if(!recordKinds.includes(kind as typeof recordKinds[number]) || query.length>120 || !/^\d{1,6}$/.test(pageText) || Number(pageText)<1) throw new RangeError('Geçersiz sorgu.');
  return {kind,query,page:Number(pageText),limit:24,offset:(Number(pageText)-1)*24};
}
export const isUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const escapeLike=(value:string)=>value.replace(/[\\%_]/g,'\\$&');
