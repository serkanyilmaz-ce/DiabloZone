const labels: Record<string, string> = {
  barbarian: 'Barbar', druid: 'Druid', necromancer: 'Nekromant', rogue: 'Rogue',
  sorcerer: 'Büyücü', spiritborn: 'Spiritborn', paladin: 'Paladin', warlock: 'Warlock',
  unknown: 'Bilinmiyor', uncategorized: 'Kategorisiz', basic: 'Temel', core: 'Çekirdek',
  active: 'Aktif', passive: 'Pasif', modifier: 'Geliştirme', offensive: 'Saldırı',
  defensive: 'Savunma', utility: 'Destek', resource: 'Kaynak', mobility: 'Hareket',
  unique: 'Benzersiz', mythic: 'Mitik', legendary: 'Efsanevi', rare: 'Nadir',
  magic: 'Büyülü', common: 'Sıradan', helm: 'Miğfer', chestarmor: 'Göğüslük',
  gloves: 'Eldiven', legs: 'Bacak zırhı', boots: 'Çizme', amulet: 'Muska', ring: 'Yüzük', shield: 'Kalkan',
};
export const term = (value?: string) => value ? labels[value.toLowerCase()] ?? value : '—';
