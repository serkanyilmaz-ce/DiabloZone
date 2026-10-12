# F01 — Sezon 15 kaynak denetimi

12 Ekim 2026 · F01 teslimi

## Seçilen başlangıç kaynağı

- Repo: https://github.com/DiabloTools/d4data .
- Sabit commit: 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0 .
- buildVersion.txt: 3.2.1.73552; patch3.2.1, build73552.
- Kullanım: sezon15 canlı başlangıç snapshot'ı. Güncel kurulumla aynı build iddiası yok.
- [Resmî sezon duyurusu](https://news.blizzard.com/en-us/article/24295394/celebrate-30-years-of-diablo-in-season-of-hell-s-legacy)
  sezon geçişini ve başlangıç 3.2.1/build73552 bağlamını destekliyor.
- Yerel .build.info yalnızca okundu: 3.2.2.73764.
  [Resmî yama kaydı](https://news.blizzard.com/en-us/article/24295395/diablo-iv-patch-notes)
  3.2.2/build73764 için 30 Eylül 2026 tarihini gösteriyor.
- Yama sayfasında 14 Ekim2026 tarihli 3.2.3/build73883 de listeleniyor; çalışma
  tarihi12Ekim olduğundan bunu bugün yayındaki sürüm olarak kabul etmedik.
- Başlangıç dökümü ile sonraki patch verisi ayrı kalacak. 3.2.2 çıkarımı/yama farkı
  ileride yeni kaynak/snapshot; 3.2.1 kayıtları sessizce 3.2.2 diye etiketlenmez.

## Gerçek envanter

Pinned Git ağacındaki bütün JSON dosyalarının adları ve Git blob kimlikleri çıkarıldı.
867.510 JSON dosyası; base locale'de797.952 dosya ve134 tür var. Büyük actor/texture/
dünya metadatası bu toplama dahil; bütün blob'lar indirilmedi.

| Tür | Ham kaynak dosyası |
| --- | ---: |
| PlayerClass | 9 |
| SkillKit | 20 |
| Power | 10.277 |
| PowerModifier | 44 |
| Item | 12.117 |
| ItemType | 161 |
| Affix | 6.329 |
| Aspect | 608 |
| GameBalance | 221 |
| ParagonBoard | 81 |
| ParagonGlyph | 162 |
| ParagonNode | 567 |
| Recipe | 2.355 |
| Season | 18 |

Bunlar oynanabilir/içe alınmış kayıt sayısı değildir. Test/placeholder/tarihsel
varyantlar dahil. İsimden yapılan işaretleme sadece inceleme adayı üretir; kayıt
silmez veya shipping durumunu doğrulamaz. class adayları ve SkillKit ilişkileri
kaynak SNO'larıyla doğrulandı; ayrı test adayı Axe Bad Data da envanterde korundu.

## İndirilen ve hash'i tutulan örnekler

47 JSON dosyası, canonical Git blob içeriğiyle toplam6.335.815bayt:
class/kit dosyaları, SkillTreeRewards, Fireball ve enchantment Power'ı,
Harlequin Crest Item/Affix/ItemType/güç referansları, bir Sorcerer Aspect
ve ilgili affix/yerelleştirme örnekleri.

Her dosyada canonical SHA256, Git blob ID, boyut, SNO, definition type ve
referans kapsamı tutuldu. İndirilen hedefe giden SNO eşleşmeleri kontrol edildi.
Geniş metadata referans listesi sadece örnekli özet olarak Git manifestine girer;
tam referans/ağaç listesi yerel ignored evidence çıktısında tutulur.

definitions.json, attributes.json, attributeList.json, buildVersion.txt,
LICENSE ve upstream readme için de Git blob ID/SHA256 tutuldu.
İki resmî sayfa yerelde dondurulup hash'lendi; JSON manifeste locator/hash/boyut
girdi. Oyun dosyasının yalnızca hash ve sürüm gözlemi çıktı; içerik Git'e girmedi.

## Teslim dosyaları

- data/research/source-manifest.json: Git'e giren kaynak/hash/kapsam manifesti.
- data/research/poc-plan.json: F02'de içe alınacak gerçek örnek ve kaynak kimlikleri.
- scripts/source/inventory.mjs: tekrar çalıştırılabilir kaynak denetimi.
- .tmp/d4data: salt okunur kullanılan pinned sparse checkout; upstream kod çalıştırılmadı.
- .tmp/source-evidence/*-inventory.json: bütün path/blob envanteri.
- .tmp/source-evidence/*-samples.json: örneklerin tam bağımlılık listesi.
- .tmp/source-evidence/official-*.html: dondurulmuş resmî belge baytları.
- tests/source.test.ts: belirsiz build ve güvensiz referans/path reddi.

## Tekrar üretme

Kaynak ve seçilen sparse dosyalar aynı commit'te, iki resmî belge evidence cache'inde
ve yerel oyun manifesti erişilebilirken:

```powershell
pnpm.cmd source:inventory .tmp/d4data 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0
```

Komut değişmiş checkout'u, farklı commit'i, bozuk JSON'u, kaynakta olmayan dosyayı,
içerik/SNO uyuşmazlığını veya beklenen içerikle eşleşmeyen resmî belgeyi reddeder.
Envanter Git tree'den üretilir; ilgisiz bütün asset blob'larını indirmez.

## Doğrulama sınırı ve F02'ye aktarım

Sabit kaynak/build, kayıt envanteri, canonical hash'ler ve ilk gerçek örnek
referansları hazır. Source→DB→site içe aktarımı henüz yapılmadı.
Array biçimindeki fUsableByClass/fAllowedForPlayerClass index sırası kaynak
şemasından kesin çözülemedi; eski hardcoded sıraya güvenilmeyecek. Açık class
SNO referansı varsa kullanılacak; çözülemeyen uygunluk unknown kalacak.
GBID/curve/formül çözümü ve bütün transitif grafik sonraki fazlarda yapılacak.

F02 örneği kaynakta bulunan Sorcerer/Fireball, Harlequin Crest ve
Asp_Legendary_Sorc_004 kaydından başlar. Birbirinden bağımsız bu örnekler
bir önerilen build veya denge/hasar iddiası değildir.
