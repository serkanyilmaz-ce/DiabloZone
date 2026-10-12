# Diablo IV veri kataloğu ve tamamlama planı

İlk hedef sezon 15'in kaynağı doğrulanmış canlı build'idir. Kapsam oyunun tüm
varlıkları ve matematiksel ilişkileridir. Bu belge hedefi tarif eder;
listedeki alanların veritabanında veya arayüzde bugün tamamlandığı anlamına gelmez.

## Varlık kapsamı

| Alan | Arşivlenecek içerik ve ilişkiler |
| --- | --- |
| Sınıflar | Build'de bulunan tüm sınıflar, temel statlar, sınıfa özel kaynak/sistem, sınıf-yetenek-eşya uygunluğu |
| Yetenekler | Aktif/pasif/geliştirme, rank ve ölçekleme, etiket, hasar türü, maliyet, cooldown, Lucky Hit, bağlı güçler ve yetenek ağacı |
| Eşyalar | Temel eşya/slot, rarity/unique/mythic, sınıf/seviye/eşya gücü koşulları, implicit/explicit affix, varyant, roll aralığı, unique güç ve düşme kaynakları |
| Affix ve aspektler | İzinli slot/sınıf/etiket, aralık/ağırlık, greater affix, koşullu etkinlik, stacking grubu, ham ifade, rank/eşya gücü ölçeklemesi ve ilişkili güç |
| Paragon | Board/node/glyph, bağlantı/eşik, rank/radius/stat gereksinimi, uygulanan bonus ve sınırlar |
| Diğer karakter sistemleri | Kaynakta mevcut gem/rune/consumable, buff/debuff, minyon/companion ve sınıfa özel sistemler |
| Dünya ve hedefler | Canavar/boss ailesi, seviye/zorluk, sağlık/savunma, aktivite/dungeon, hedef koşulları, loot havuzları ve ödüller |
| İlerleme ve üretim | XP/seviye, materyal/maliyet, upgrade/tempering/masterworking/enchanting gibi build'de bulunan sistemlerin havuz/kuralları |
| Sezon | Sezon gücü/etkinliği, sezon kuralları, canlı/PTR ve önceki build'e göre eklenen/değişen/kalkan kayıtlar |

Yeni tür önce gerçek kaynaktan tanımlanır; şema/API/export/arayüz birlikte genişletilir.
Importer skills/items/aspects/affixes/classes/skill-tree alır. F04'te sekiz tam
ağaç ve bütün12.117Item/6.329Affix/608Aspect kaynak kaydı DB/export akışındadır.
Paragon/loot ve diğer entity adaptörleri sıradadır; sezon/loot uygunluğu henüz kesinleşmedi.

## Matematik kapsamı

| Alan | İncelenecek kurallar |
| --- | --- |
| Hasar | Baz hasar, silah aralığı, ana stat/rank, toplamsal havuz, ayrı çarpan, koşul/sıra, kritik/savunmasızlık/overpower, DoT, minyon, double-dip |
| Savunma | Zırh/direnç, hasar azaltma grupları, dodge/block, barrier/fortify, sağlık/heal, tavanlar ve hedef seviye |
| Zaman ve kaynak | Attack/cast hızı, breakpoint/frame/tick, cooldown/iç cooldown, maliyet/üretim, eşik, uptime ve kaynak dengesi |
| Proc | Lucky Hit, olay/hit/tick başına tetik, uygunluk filtresi, proc zinciri, bağımlılık ve istisnalar |
| Loot ve RNG | Kaynak/havuz/uygunluk, ağırlıklı seçim, koşullu olasılık, roll dağılımı, bağımlılık, doğrulanırsa pity/garanti |
| Crafting | Roll/tekrar seçim havuzu, materyal/gold maliyeti, olası sonuçlar, başarı dağılımı, beklenen maliyet/belirsizlik |
| İlerleme/sezon | XP eğrisi, ödül/stat ölçeklemesi, paragon/glyph, sezon çarpanları ve etkileşimleri |

Her formülde sembol, birim, giriş aralığı, koşul, uygulama sırası, cap/floor,
yuvarlama, çözülmeyen bağımlılık ve build geçerliliği kaydedilir. RNG havuz,
ağırlık, eligibility, dağılım ve bağımsızlık durumuyla saklanır. Bilinmeyen
olasılık NULL'dır. Eğitim modeli gerçek oyun mekaniğinin doğrulaması değildir.

## Tamamlama ölçütü

1. Kaynak build/kanal ve ham dosya/ID/hash belli; kaynağın kayıt envanteri çıkarılmıştır.
2. Normalize kayıt eşleşmiş; referanslar çözümlenmiş veya unresolved işaretlenmiştir.
3. Tooltip, ham formül, yorum ve ölçüm ayrı tutulur; ad/çeviri eksikliği gizlenmez.
4. DB → API/export → liste/detay akışı aynı snapshot'tan doğrulanır.
5. Formül girdileri/koşulları ve RNG belirsizliği görünür; kanıt düzeyi korunur.
6. Verified için bağımsız kanıt veya tekrarlanabilir oyun ölçümü vardır.

Tür başına kaynakta bulunan, içe alınan, çözümlenen, gösterilebilen ve verified
kayıt sayısı ayrı raporlanır. Kaynak toplamı bilinmiyorsa yüzde hesaplanmaz.
Boş içerik, drop oranının sıfır veya sistemin oyunda yok olması anlamına gelmez.
Çelişkiler ve kaynakta bulunamayan kayıtlar raporlanır.

## Sıra ve mevcut durum

12 Ekim 2026 F04:20.670 gerçek kaynak kaydı/9.522 ilişki;19.375 ham affix ifadesi.
Özgün grafik arşivi ayrıDBset'inde10.098PNG taşır; docs/phase4.md.
Araştırma planı8alan unknown, verified mekanik0; ham ifade runtime doğrulaması değildir.
Önce build'i doğrulanmış küçük yetenek/eşya/affix/aspekt örneğiyle uçtan uca akış;
ardından tüm sınıflar/ilişkiler, paragon/diğer sistemler, hasar/savunma/zamanlama
ve loot/crafting RNG genişletilir. Kaynak tamlığı ve yamalar arası fark izlenir.
Forum ertelenmiştir.
