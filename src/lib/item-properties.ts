import {affixes} from './data';
import {isDeveloperText} from './presentation';

// Readable labels for common source attributes on stat affixes that have no
// description string in the archive. Turkish wording follows the official trTR
// catalogue terms (Maksimum Can, Saldırı Hızı, Kademe…). Values stay unresolved: X.
type Label={en:string;tr:string};
const elements=['Physical','Fire','Lightning','Cold','Poison','Shadow'];
const elementsTr=['Fiziksel','Ateş','Yıldırım','Soğuk','Zehir','Gölge'];
const attributeLabels:Record<string,Label>={
  Plus_All_Stats:{en:'+X All Stats',tr:'Tüm İstatistiklere +X'},
  All_Stats_Percent_Bonus:{en:'+X% All Stats',tr:'Tüm İstatistiklere +%X'},
  Resistance_All_Bonus:{en:'+X Resistance to All Elements',tr:'Tüm Elementlere +X Direnç'},
  Resistance_All:{en:'+X Resistance to All Elements',tr:'Tüm Elementlere +X Direnç'},
  Attack_Speed_Percent_Bonus:{en:'+X% Attack Speed',tr:'+%X Saldırı Hızı'},
  Attack_Speed_Percent_Bonus_Per_Skill_Tag:{en:'+X% Attack Speed for tagged Skills',tr:'Etiketli Yeteneklere +%X Saldırı Hızı'},
  Skill_Rank_Skill_Tag_Bonus:{en:'+X Ranks to tagged Skills',tr:'Etiketli Yeteneklere +X Kademe'},
  Skill_Rank_All_Bonus:{en:'+X Ranks to all Skills',tr:'Tüm Yeteneklere +X Kademe'},
  Skill_Rank_Bonus:{en:'+X Ranks to a Skill',tr:'Bir Yeteneğe +X Kademe'},
  Block_Chance:{en:'+X% Block Chance',tr:'+%X Engelleme İhtimali'},
  Flat_Hitpoints_Max_Bonus_Unscaled_By_Player_Health:{en:'+X Maximum Life',tr:'+X Maksimum Can'},
  Flat_Hitpoints_Max_Bonus:{en:'+X Maximum Life',tr:'+X Maksimum Can'},
  Hitpoints_Max_Percent_Bonus:{en:'+X% Maximum Life',tr:'+%X Maksimum Can'},
  Crit_Percent_Bonus:{en:'+X% Critical Strike Chance',tr:'+%X Kritik Vuruş İhtimali'},
  Crit_Damage_Percent:{en:'+X% Critical Strike Damage',tr:'+%X Kritik Vuruş Hasarı'},
  Bucketed_Multiplicative_Crit_Damage:{en:'×X% Critical Strike Damage',tr:'×%X Kritik Vuruş Hasarı'},
  Movement_Bonus_Run_Speed:{en:'+X% Movement Speed',tr:'+%X Hareket Hızı'},
  Main_Hand_Damage_Percent_Bonus:{en:'+X% Weapon Damage',tr:'+%X Silah Hasarı'},
  Combat_Effect_Chance_Bonus:{en:'+X% Lucky Hit Chance',tr:'+%X Şanslı Vuruş İhtimali'},
  Intelligence:{en:'+X Intelligence',tr:'+X Zekâ'},Intelligence_Percent_Bonus:{en:'+X% Intelligence',tr:'+%X Zekâ'},
  Strength:{en:'+X Strength',tr:'+X Kuvvet'},Strength_Percent_Bonus:{en:'+X% Strength',tr:'+%X Kuvvet'},
  Dexterity:{en:'+X Dexterity',tr:'+X Maharet'},Dexterity_Percent_Bonus:{en:'+X% Dexterity',tr:'+%X Maharet'},
  Willpower:{en:'+X Willpower',tr:'+X İrade'},Willpower_Percent_Bonus:{en:'+X% Willpower',tr:'+%X İrade'},
  Bucketed_Multiplicative_Damage:{en:'×X% Damage',tr:'×%X Hasar'},
  Damage_Percent_All_From_Skills:{en:'+X% Damage',tr:'+%X Hasar'},
  Resource_All_Primary_Max_Bonus:{en:'+X Maximum Resource',tr:'+X Maksimum Kaynak'},
  Armor_Bonus:{en:'+X Armor',tr:'+X Zırh'},Armor_Percent:{en:'+X% Armor',tr:'+%X Zırh'},
  Power_Cooldown_Reduction_Percent_All:{en:'X% Cooldown Reduction',tr:'%X Bekleme Süresi Azaltma'},
  Skill_Tag_Cooldown_Reduction_Percent:{en:'X% Cooldown Reduction for tagged Skills',tr:'Etiketli Yeteneklerde %X Bekleme Süresi Azaltma'},
  Thorns_Flat:{en:'+X Thorns',tr:'+X Diken'},
  Vulnerable_Health_Damage_Bonus:{en:'+X% Vulnerable Damage',tr:'+%X Savunmasız Hasarı'},
  Global_CrushingBlowChance:{en:'+X% Crushing Blow Chance',tr:'+%X Ezici Darbe İhtimali'},
  Global_DeadlyStrikeChance:{en:'+X% Deadly Strike Chance',tr:'+%X Ölümcül Vuruş İhtimali'},
  NonPhysical_Damage_Percent_Bonus:{en:'+X% Non-Physical Damage',tr:'+%X Fiziksel Olmayan Hasar'},
  Damage_Reduction:{en:'X% Damage Reduction',tr:'%X Hasar Azaltma'},
  Damage_Bonus_To_Near:{en:'+X% Damage to Close Enemies',tr:'Yakındaki Düşmanlara +%X Hasar'},
  Damage_Bonus_To_Low_Health:{en:'+X% Damage to Injured Enemies',tr:'Yaralı Düşmanlara +%X Hasar'},
  Damage_Percent_Bonus_Per_Skill_Tag:{en:'+X% Damage for tagged Skills',tr:'Etiketli Yeteneklere +%X Hasar'},
  Overpower_Crit_Damage_Bonus_Percent:{en:'+X% Overpower Damage',tr:'+%X Aşırı Güç Hasarı'},
  Flat_Hitpoints_On_Hit_Unscaled_By_Player_Health:{en:'+X Life On Hit',tr:'+X Vuruşta Can'},Flat_Hitpoints_On_Hit:{en:'+X Life On Hit',tr:'+X Vuruşta Can'},
  Flat_Hitpoints_On_Kill_Unscaled_By_Player_Health:{en:'+X Life On Kill',tr:'+X Öldürmede Can'},
  Global_Resource_On_Kill:{en:'+X Resource On Kill',tr:'+X Öldürmede Kaynak'},
  Resource_Cost_Reduction_Percent_All:{en:'X% Resource Cost Reduction',tr:'%X Kaynak Maliyeti Azaltma'},
  Resource_Gain_And_Regen_Bonus_Percent_All_Primary:{en:'+X% Resource Generation',tr:'+%X Kaynak Üretimi'},
  CC_Duration_Reduction:{en:'X% Crowd Control Duration Reduction',tr:'%X Kitle Kontrolü Süresi Azaltma'},
  Dodge_Chance_Bonus:{en:'+X% Dodge Chance',tr:'+%X Sıyrılma İhtimali'},
  Gold_Find:{en:'+X% Gold Find',tr:'+%X Altın Bulma'},
  DOT_DPS_Bonus_Percent:{en:'+X% Damage Over Time',tr:'+%X Zamanla Hasar'},
  Damage_Percent_Bonus_Vs_CC_All:{en:'+X% Damage to Crowd Controlled Enemies',tr:'Kitle Kontrolü Altındaki Düşmanlara +%X Hasar'},
  Weapon_Damage_Min:{en:'X Weapon Damage',tr:'X Silah Hasarı'},
  Ignore_Durability_Loss:{en:'Ignores durability loss',tr:'Dayanıklılık kaybetmez'},
};
function labelFor(attribute:{name:string;param:number}):Label|undefined{
  if(attribute.name==='Resistance'&&elements[attribute.param])return {en:`+X% ${elements[attribute.param]} Resistance`,tr:`+%X ${elementsTr[attribute.param]} Direnci`};
  if(attribute.name==='Damage_Type_Percent_Bonus'&&elements[attribute.param])return {en:`+X% ${elements[attribute.param]} Damage`,tr:`+%X ${elementsTr[attribute.param]} Hasarı`};
  return attributeLabels[attribute.name];
}

export interface ItemProperty{affixId:string;slug?:string;kind:'power'|'stat';en:string;tr?:string}
const affixById=new Map(affixes.map(affix=>[affix.id,affix]));
function sourceAttributes(raw:Record<string,unknown>|undefined){
  const list=Array.isArray(raw?.ptItemAffixAttributes)?raw!.ptItemAffixAttributes as Array<{tAttribute?:{__eAttribute_name__?:string;nParam?:number}}>:[];
  return list.map(entry=>({name:entry.tAttribute?.__eAttribute_name__??'',param:entry.tAttribute?.nParam??-1})).filter(a=>a.name);
}
// Returns readable affix lines for an item. A unique power keeps its archived
// description (localized on the client by affix key); stat affixes use labels above.
export function itemProperties(affixIds:string[]):{lines:ItemProperty[];unresolved:number}{
  const lines:ItemProperty[]=[];let unresolved=0;
  // Inherent and explicit lists can repeat the same affix (e.g. Indestructible).
  for(const id of new Set(affixIds)){
    const affix=affixById.get(id);if(!affix){unresolved++;continue;}
    if(affix.description&&!isDeveloperText(affix.description)){lines.push({affixId:id,slug:affix.slug,kind:'power',en:affix.description});continue;}
    const labels=sourceAttributes(affix.rawData).map(labelFor);
    if(labels.length&&labels.every(Boolean)){const first=labels[0]!;lines.push({affixId:id,slug:affix.slug,kind:'stat',en:first.en,tr:first.tr});}
    else unresolved++;
  }
  // Stats first, then the unique power, matching the in-game tooltip order.
  lines.sort((a,b)=>(a.kind==='power'?1:0)-(b.kind==='power'?1:0));
  return {lines,unresolved};
}
