// Turkish UI labels; skill categories and item slots follow official trTR catalogue terms.
// English equivalents live in ui-translations.ts so the EN view reverses them.
const labels: Record<string, string> = {
  barbarian: 'Barbar', druid: 'Druid', necromancer: 'Ölüm Büyücüsü', rogue: 'Haydut',
  sorcerer: 'Büyücü', spiritborn: 'Ruhdoğumlu', paladin: 'Paladin', warlock: 'Kara Büyücü',
  unknown: 'Bilinmiyor', uncategorized: 'Kategorisiz', basic: 'Temel', core: 'Çekirdek',
  active: 'Aktif', passive: 'Pasif', modifier: 'Geliştirme', offensive: 'Saldırı',
  defensive: 'Savunma', utility: 'Destek', resource: 'Kaynak', mobility: 'Hareket',
  unique: 'Benzersiz', mythic: 'Mitik', legendary: 'Efsanevi', rare: 'Nadir',
  magic: 'Büyülü', common: 'Sıradan', helm: 'Miğfer', chestarmor: 'Göğüs Zırhı',
  gloves: 'Eldiven', legs: 'Pantolon', boots: 'Çizme', amulet: 'Muska', ring: 'Yüzük', shield: 'Kalkan',
  conjuration:'Çağırma',mastery:'Ustalık',ultimate:'Ulti',brawling:'Kapışma',weaponmastery:'Silah Ustalığı',weapon_mastery:'Silah Ustalığı',wrath:'Gazap',companion:'Yoldaş',agility:'Çeviklik',subterfuge:'Hile',imbuement:'Aşılama',imbuements:'Aşılama',macabre:'Dehşet',curse:'Lanet',summoning:'Çağırma',
  focus:'Odak',potency:'Tesir',justice:'Adalet',valor:'Cesaret',aura:'Hare',archfiend:'Baş Şeytan',sigil:'Mühür',soulshard:'Ruh Parçası',corpse:'Ceset',minion:'Minyon',
  sword:'Kılıç',sword2h:'Çift El Kılıcı',axe:'Balta',axe2h:'Çift El Baltası',mace:'Gürz',mace2h:'Çift El Gürzü',dagger:'Hançer',polearm:'Gönderli Silah',
  scythe:'Tırpan',scythe2h:'Çift El Tırpanı',staff:'Asa',wand:'Değnek',bow:'Yay',crossbow:'Arbalet',crossbow2h:'Arbalet',glaive:'Kılıçlı Mızrak',flail:'Zincirli Gürz',quarterstaff:'Dövüş Asası',
  offhandtotem:'Totem',charm:'Tılsım',elixir:'İksir',quest:'Görev eşyası',lorebook:'İrfan',trophy:'Ganimet',tempermanual:'Tavlama kılavuzu',craftingrecipe:'Üretim tarifi',paragonglyph:'Paragon glyph',
  gearitem:'Ekipman',mountitem:'Binek',horsearmor:'At zırhı',fish:'Balık',cosmeticback:'Kozmetik',
};
const humanize=(value:string)=>value.replace(/[_-]+/g,' ').replace(/([a-z])([A-Z0-9])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
export const term = (value?: string) => value ? labels[value.toLowerCase()] ?? humanize(value) : '—';
