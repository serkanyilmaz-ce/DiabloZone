import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (file:string) => JSON.parse(await readFile(file,'utf8'));
// Compare normalized or DB-exported boards against every original source coordinate.
const directory=process.env.D4_CATALOG_DIR??'data/generated';
const tree = await read(`${directory}/skill-tree.json`);
const classes = ['barbarian','druid','necromancer','rogue','sorcerer','spiritborn','paladin','warlock'];
test('all eight classes have complete game boards', () => {
  assert.deepEqual(Object.keys(tree.classes).sort(), [...classes].sort());
  assert(Object.values(tree.classes).every((board:any)=>board.scope==='full'));
});
for (const cls of classes) test(`${cls}: preserve every game node and path; resolve all skill names`, async () => {
  const board=tree.classes[cls];
  const source=await read(`.tmp/d4data/${board.source.file}`);
  assert.equal(board.nodes.length,source.arNodes.length);
  assert.equal(board.edges.length,source.arConnections.length);
  assert.ok(board.nodes.filter((n:any)=>n.kind==='active').length>=20);
  const ids = new Set(board.nodes.map((n:any)=>n.id));
  assert.equal(ids.size,board.nodes.length);
  board.nodes.forEach((node:any,index:number)=>{
    assert.equal(node.x,source.arNodes[index].vPosition.x);
    assert.equal(node.y,source.arNodes[index].vPosition.y);
    assert.ok(node.name);
    if(node.rewardName) assert.ok(node.skillSlug && node.powerSno);
  });
  board.edges.forEach((edge:any,index:number)=>{
    assert.ok(ids.has(edge.from)&&ids.has(edge.to));
    assert.deepEqual(edge.points.slice(1,-1),source.arConnections[index].arCustomPathPositions);
  });
});
test('expansion powers and case-sensitive Landslide are included',()=>{
  for(const [cls,name] of [['barbarian','Mighty Throw'],['necromancer','Soulrift'],['sorcerer','Familiar'],['druid','Landslide']]){
    assert.ok(tree.classes[cls].nodes.some((n:any)=>n.name===name),`${cls} ${name}`);
  }
});
