import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readBuildVersion, writeJson } from './io.js';
import { readStringList, getString, cleanTooltipText } from './string-list.js';

const kits = { barbarian:'Barbarian', druid:'Druid', necromancer:'Necromancer', rogue:'Rogue', sorcerer:'Sorcerer', spiritborn:'Spiritborn', paladin:'Paladin_NEW', warlock:'Warlock' };
const index = process.argv.indexOf('--datamine');
const root = path.resolve(index < 0 ? '.tmp/d4data' : process.argv[index + 1]);
const read = async (file:string) => JSON.parse(await fs.readFile(file, 'utf8'));
const build = await readBuildVersion(root);
const rewardsFile = 'json/base/meta/GameBalance/SkillTreeRewards.gam.json';
const raw = await read(path.join(root, rewardsFile));
const rewards = new Map<string,any>(raw.ptData.flatMap((t:any) => t.tEntries ?? []).map((r:any) => [r.tHeader.szName,r]));
const skills = await read('data/generated/skills.json');
const bySno = new Map<number,any>(skills.map((s:any) => [Number(s.source.sno),s]));
const classes:Record<string,any> = {};
const report:Record<string,any> = {};
for (const [cls,kitName] of Object.entries(kits)) {
  const sourceFile = `json/base/meta/SkillKit/${kitName}.skl.json`;
  const kit = await read(path.join(root,sourceFile));
  const details = new Map<number,any>();
  const nodes = [];
  for (const node of kit.arNodes) {
    const reward = node.gbidReward ? rewards.get(node.gbidReward.name) : undefined;
    if (node.gbidReward && !reward) throw new Error(`${cls}: unresolved reward ${node.gbidReward.name}`);
    const sno = Number(reward?.snoPower?.__raw__ ?? 0);
    const skill = bySno.get(sno);
    if (sno && !skill) throw new Error(`${cls}: missing imported power ${sno} (${reward.snoPower.name})`);
    if (skill && !details.has(sno)) details.set(sno, {
      power: await read(path.join(root,skill.source.file)),
      strings: await readStringList(path.join(root,skill.localizationSource.file)),
    });
    const detail = details.get(sno);
    const mod = reward?.szPowerMod ? detail?.power.arMods.find((m:any) => m.szName === reward.szPowerMod) : undefined;
    if (reward?.eType === 1 && !mod) throw new Error(`${cls}: unresolved modifier ${node.gbidReward.name}`);
    const kind = !reward ? (node.eRootNodeType === 1 ? 'hub' : 'gate') : mod ? 'modifier' : skill.type;
    // Hubs and level gates are real board nodes, not synthetic category containers.
    const connected = node.arConnections.map((c:any) => kit.arNodes[c.nIndexNode]);
    const categories = connected.map((n:any) => bySno.get(Number(rewards.get(n.gbidReward?.name)?.snoPower?.__raw__))?.category).filter(Boolean);
    const name = mod ? getString(detail.strings, `Mod${mod.dwModId}_Name`) : skill?.name;
    if (reward && !name) throw new Error(`${cls}: missing localized node name ${node.dwID}`);
    nodes.push({
      id:node.dwID, x:node.vPosition.x, y:node.vPosition.y, kind,
      name:name ?? (kind === 'hub' ? categories[0] ?? 'Skills' : `Level ${node.dwNodeRequiredPlayerLevel}`),
      description:mod ? cleanTooltipText(getString(detail.strings,`Mod${mod.dwModId}_Description`)) : skill?.description,
      powerSno:sno || undefined, skillSlug:skill?.slug, category:skill?.category,
      iconHandle:mod?.hIconNormalOverride || detail?.power.hIconNormal || undefined,
      maxRanks:reward?.dwMaxTalentRanks || undefined, requiredLevel:node.dwNodeRequiredPlayerLevel,
      exclusiveGroup:node.nExclusiveGroupId < 0 ? undefined : node.nExclusiveGroupId,
      defining:reward?.unk_94e270e ?? false, rewardName:node.gbidReward?.name,
    });
  }
  const ids = new Set(nodes.map(n => n.id));
  const edges = kit.arConnections.map((edge:any) => {
    const from = kit.arNodes[edge.nIndexNodeA];
    const to = kit.arNodes[edge.nIndexNodeB];
    if (!from || !to || !ids.has(edge.dwSourceId) || !ids.has(edge.dwDestinationId) || from.dwID !== edge.dwSourceId || to.dwID !== edge.dwDestinationId) throw new Error(`${cls}: invalid board edge`);
    return {from:from.dwID,to:to.dwID,points:[from.vPosition,...edge.arCustomPathPositions,to.vPosition]};
  });
  const points = [...nodes,...edges.flatMap((e:any) => e.points)];
  const bounds = {minX:Math.min(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxX:Math.max(...points.map(p=>p.x)),maxY:Math.max(...points.map(p=>p.y))};
  classes[cls] = {sourceFile,sourceSno:kit.__snoID__,bounds,nodes,edges};
  report[cls] = {nodes:nodes.length,edges:edges.length,skills:nodes.filter(n=>n.kind==='active'||n.kind==='passive').length,modifiers:nodes.filter(n=>n.kind==='modifier').length};
}
await writeJson('data/generated/skill-tree.json',{source:'DiabloTools/d4data',gameBuild:build,generatedAt:new Date().toISOString(),layout:'game-coordinates',classes});
await writeJson('data/generated/skill-tree-report.json',{gameBuild:build,byClass:report});
console.log(`Imported all ${Object.keys(classes).length} class boards with original game coordinates and paths: ${JSON.stringify(report)}`);
