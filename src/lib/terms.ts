const labels: Record<string, string> = {
  barbarian: 'Barbar', druid: 'Druid', necromancer: 'Ölüm Büyücüsü', rogue: 'Haydut',
  sorcerer: 'Büyücü', spiritborn: 'Ruhdoğumlu', paladin: 'Paladin', warlock: 'Kara Büyücü',
  unknown: 'Bilinmiyor', uncategorized: 'Kategorisiz', basic: 'Temel', core: 'Çekirdek',
  active: 'Aktif', passive: 'Pasif', modifier: 'Geliştirme', offensive: 'Saldırı',
  defensive: 'Savunma', utility: 'Destek', resource: 'Kaynak', mobility: 'Hareket',
  unique: 'Benzersiz', mythic: 'Mitik', legendary: 'Efsanevi', rare: 'Nadir',
  magic: 'Büyülü', common: 'Sıradan', helm: 'Miğfer', chestarmor: 'Göğüslük',
  gloves: 'Eldiven', legs: 'Bacak zırhı', boots: 'Çizme', amulet: 'Muska', ring: 'Yüzük', shield: 'Kalkan',
  conjuration:'Çağırma',mastery:'Ustalık',ultimate:'Ulti',brawling:'Dövüş',weaponmastery:'Silah ustalığı',wrath:'Gazap',companion:'Yoldaş',agility:'Çeviklik',subterfuge:'Hile',imbuement:'Aşılama',macabre:'Dehşet',curse:'Lanet',summoning:'Çağırma',
};
export const term = (value?: string) => value ? labels[value.toLowerCase()] ?? value : '—';
