# DiabloZone — Fazlar, yürütme ve kısıtlar

Bu dosya aktif çalışma planının ana kaynağıdır. İsim DiabloZone; hedef Diablo IV'ün
bütün oyun verilerini ve matematik/RNG ilişkilerini kendi DB'mizde arşivlemek.
İlk hedef sezon15. Kullanıcı fazların sırayla yürütülmesini istedi.

## Kesintisiz çalışma talimatı — 12 Ekim 2026

Kullanıcı bilgisayar başında değil. Bu oturumda soru sormadan fazları sırayla ilerlet;
rutin kaynak incelemesi, geliştirme, test, GitHub main ve native yayın yetkilidir.
Beş saatlik çalışma penceresi: 06:25:24–11:25:24 Europe/Istanbul
(03:25:24–08:25:24 UTC). Bir faz tesliminde durma; sonraki bağımsız işe geç.
Gerçek erişim/ölçüm engellerini kanıtıyla kaydet ve yapılabilen işlerde ilerle.

Her sunucu işi kısa SSH komutuyla yürütülür; iş bitince SSH bağlantısı kapatılır.
Site SSH oturumuna bağlı çalıştırılmaz: Caddy ve enabled systemd servisi sürekli
ayakta kalır. Çalışma sonunda servis/HTTPS kontrolü yapılır, site durdurulmaz.

## Faz haritası ve durum

| ID | Faz | Durum | Temel teslim |
| --- | --- | --- | --- |
| F00 | Native altyapı/yayın | Tamamlandı | HTTPS, API, PostgreSQL, Git; docs/progress.md |
| F01 | Kaynak/build doğrulaması | Tamamlandı | docs/source-audit.md; pinned 3.2.1.73552, hash/envanter |
| F02 | Küçük gerçek veri akışı | Tamamlandı | docs/phase2.md; 34 kayıt/76 ilişki, DB/export/API/HTTPS |
| F03 | Tüm sınıflar/yetenekler/ağaç | Veri/ikon hazır; görsel eşleme sürüyor | docs/phase3.md; 8 sınıf/1600 kayıt, tam kaynak ağaçları |
| F04 | Tüm eşyalar/affix/aspekt | Kaynak/DB hazır; yayın doğrulanıyor | docs/phase4.md; 12117/6329/608 kaynak kaydı |
| F05 | Diğer karakter sistemleri | Bekliyor | Paragon/glyph, sınıf özel, gem/rune/minyon |
| F06 | Formül/genel hasar | Bekliyor | Ham ifadeler, bağımlılık, ilk hasar modeli |
| F07 | Savunma/zaman/kaynak/proc | Bekliyor | Koşul/sınırı belli mekanik modelleri |
| F08 | Loot/crafting/RNG | Bekliyor | Havuz/ağırlık/dağılım ve belirsizlik |
| F09 | Dünya/ilerleme/sezon | Bekliyor | Boss/aktivite/XP/ödül/sezon ilişkileri |
| F10 | Ölçüm/tamlık/güncelleme/işletim | Bekliyor | Kanıt raporu, build farkı, test edilmiş yedek |

## Fazları yürütme

- F01'den başlayarak fazları sırayla çalıştır. Fazın gerekli teslim ve bitiş ölçütü
  sağlanmadan tamamlandı yazma. Kanıt, dosya/commit/snapshot ve eksikler kayıtlı olsun.
- Tamamlanan fazın durumunu bu tabloda güncelle; sonraki faza geç. Rutin teknik
  adımlar için tekrar onay isteme; kullanıcı geliştirme/Git/native yayın akışını yetkilendirdi.
- Gerçek ölçüm, erişim veya bilinmeyen kaynak gerektiren kısmı somut eksik olarak
  kaydet; bağımsız işlerde ilerle. Sentetik testle gerçek oyun doğrulamasını kapatma.
- Her teslim: kaynak→normalizasyon→taslak DB→doğrulama→arayüz→kontroller→Git→
  gerektiğinde native yayın→docs/progress.md ve ../Notlar.md kaydı.
- Güncel araçlar: pnpm.cmd lint, check, test, build, api:build; gerçek kaynak varsa
  test:integration. DB komutları db:bootstrap/migrate/import/research/export.
- Yayın araçları deploy/linux; release:package. Gerçek DB/HTTPS kontrolü
  deploy/linux/check-remote.mjs. Yeni veri geldikçe bu kontrolün kapsamı da güncellenir.
- Veri katalog kapsamı docs/data-catalog.md; bilimsel yöntem docs/research-method.md;
  ürün docs/product.md; sunucu docs/deployment.md. docs/roadmap.md bu dosyaya yönlendirir.
- F01 kaynak komutu: pnpm.cmd source:inventory .tmp/d4data 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0.
  Önkoşullar/çıktılar docs/source-audit.md; kaynak manifesti data/research/source-manifest.json.

## Faz 0 — Tamamlanmış altyapı

Astro/TypeScript/Tailwind, pnpm, PostgreSQL16 ve salt okunur Node22 API çalışıyor.
Ubuntu24.04 ARM64 ortak sunucuda Caddy HTTPS yayını var. F00 yayını Git commit'iyle
eşleştirilmiştir; sonraki kaynak denetimi commit'i ayrı teslimdir. Kanıt/son snapshot
docs/progress.md ve ../Notlar.md'de.
F00 anındaki kataloglar boştu. F02 artık 34 gerçek kayıt/76 ilişki içerir; 8 araştırma alanı unknown, verified mekanik 0.

## Faz 1 — Kaynak ve sezon/build doğrulaması

**Amaç:** Hangi verinin gerçekten sezon 15'e ait olduğunu ve hangi kayıtların
erişilebilir olduğunu belirlemek.

- Sezon adı/tarih/build eşleşmesini resmî kaynakla yeniden doğrula. Duyuru build'i,
  yerel kurulum build'i ve normalize veri dökümü ayrı alanlarda saklansın.
- Uygun JSON/datamine kaynağını build ve commit/hash ile sabitle. Yerel CASC
  gerekiyorsa salt okunur çıkarım yolunu araştır; uyumsuz sürümü S15 diye etiketleme.
- Varlık türü, dosya sayısı, SNO/ID, dil, boyut ve kaynak hash envanteri çıkar.
- Oynanabilir kayıt, test/placeholder, tarihsel kayıt ve bilinmeyen uygunluk ayrımını
  kanıta göre işaretle; sırf dosya adı eşleşti diye kayıt silme.
- Tüm sınıfların kaynakta bulunan adlarını ve class index eşleşmelerini doğrula.

**Teslim:** Kaynak manifesti ve tür bazında kapsam raporu. Kaynak toplamı
bilinmeyen türler açıkça belirtilir; yüzde uydurulmaz.

**Bitiş ölçütü:** Tek bir sabit kaynak tekrar okunabilir; build/kanal belli,
dosyalar hash ile tanımlı ve ilk örnek grubun bağımlılıkları bulunmuş olur.

## Faz 2 — Küçük gerçek örnekle DB → site akışı

**Amaç:** İlk gerçek kayıtları kullanıcıya göstermek ve veri yolunu doğrulamak.

- Bir sınıf ve bağımlılıklarıyla birlikte küçük bir örnek seç: birkaç yetenek,
  bir eşya, ilgili affix/aspektler ve birkaç ağaç düğümü. Bunlar kaynakta gerçekten
  bulunmalı; örnek hacmi bugünkü importer'ın sabit minimumlarına takılmamalı.
- Kalıcı kimliklerde kaynak SNO/ID kullan; slug yalnızca okunabilir URL olsun.
  İsim çakışması ve farklı varyantlar birbirini ezmesin.
- Gerekli şema değişikliklerini yeni migration ile ekle; uygulanmış 001'i değiştirme.
- Ham kaynak → normalizasyon → taslak snapshot → doğrulama → published akışını kur.
- İlk sürümde kontrollü DB export → frontend build → release yolunu tamamla.
  Araştırma API'siyle aynı build/snapshot bağlamı arayüzde görünür olsun.
- Formül, rank/cooldown/roll gibi bilinmeyen alanları doğru boş durumla göster.

**Teslim:** Yayında gerçek bir sınıf/yetenek/eşya grubu ve kaynak bilgili detaylar.

**Bitiş ölçütü:** Kaynak, DB ve sayfa aynı kimlik/değerleri gösterir; referanslar
eşleşir, aynı import çoğalmaz, reader yazamaz ve önceki snapshot korunur.

## Faz 3 — Tüm sınıflar, yetenekler ve ağaçlar

- Sınıf kataloğu ve sınıf sayfaları ekle; mevcut build'in tüm sınıflarını kapsa.
- Aktif/pasif/geliştirme, parent/rank, etiket, kaynak/maliyet/cooldown ve ham
  tooltip/formül referanslarını al. Oynanabilirlik belirsizse açıkça işaretle.
- Yetenek ağacını DB'ye taşı; düğüm/kenar/eşik/konumları aynı snapshot'ta tut.
- Sınıf → yetenek → geliştirme → ilişkili güç bağlantılarını tamamla.
- Kaynakta bulunan/içe alınan/gösterilen kayıt sayısını sınıf bazında raporla.

**Teslim:** Tüm sınıfların gezilebilir yetenek kataloğu ve kaynaktaki ağaçları.
**Bitiş ölçütü:** Kaynak envanterindeki her uygun kayıt içe alınmış veya gerekçeli
eksik listesinde; bozuk bağlantı ve sessiz kayıt kaybı yok.

## Faz 4 — Eşya, affix ve aspekt kapsamını tamamlama

- Unique/mythic sınırını kaldır; temel eşya, slot, rarity ve gerçek varyantları kapsa.
- Implicit/explicit/greater affix, güç ölçeklemesi, roll aralıkları, uygunluk
  havuzları ve unique/aspekt güç referanslarını kaynakta bulunduğu ölçüde al.
- Affix'leri tüm envanterden çıkar; yalnızca örnek eşyaların referanslarıyla sınırlama.
- Ad benzerliğiyle varyant birleştirmek yerine kaynak kimliği ve uygunluk ilişkisi kullan.
- Bağımsız affix/aspekt detayları ve filtreleri ekle: sınıf, slot, tür, etiket,
  ilgili yetenek ve kaynak build. Eşya detayından affix/formüle geçiş sağla.
- İkonlar için kaynak/izin ve referans eşleşmesini kontrol et; ikon eksikliği
  veri kaydının kaybolmasına yol açmasın.

**Teslim:** Kaynak kapsamı raporlanan eşya/affix/aspekt arşivi ve bağlı detaylar.
**Bitiş ölçütü:** Roll aralıklarının birimi/koşulu belli; eksik güç/affix referansları
raporlu; her rarity ve sınıf için kapsama sayıları görünür.

## Faz 5 — Paragon ve diğer karakter sistemleri

- Board/node/glyph, bağlantı, radius/rank/stat eşiği ve bonusları arşivle.
- Kaynakta mevcut sınıfa özel mekanikler, minyon/companion, gem/rune/socket,
  consumable ve buff/debuff sistemlerini uygun entity türleriyle ekle.
- Gereksinim, stacking, aktif olma koşulu ve bağlantılı formül/güçleri sakla.
- Kaynaktaki diğer karakter/ilerleme türlerini envanter üzerinden sırayla kapsa.

**Teslim:** Karakter gücünü etkileyen diğer sistemlerin gezilebilir kayıtları.
**Bitiş ölçütü:** Yeni türler için şema/import/API-export/arayüz zinciri tamam;
desteklenmeyen türler ve çözülmeyen ilişkiler kapsam raporunda görünür.

## Faz 6 — Formül altyapısı ve genel hasar

**Amaç:** Tooltip'in arkasındaki gerçek ifadeleri kaynağıyla saklamak ve çözmek.

- Power/attribute/curve/lookup bağlantıları ve ham ifadeler için adaptör yaz.
- Sembol, birim, girdi aralığı, koşul, uygulama sırası, stacking grubu, tavan,
  yuvarlama ve build geçerliliğini kaydet. Döngü/eksik bağımlılığı raporla.
- Desteklenen ifadeler için sınırlı ve test edilen parser/yorumlayıcı kur;
  eval/Function kullanma. Desteklenmeyen ifadeyi ham hâliyle koru.
- İlk ayrıntılı model: baz hasar, ana stat/rank, toplamsal bonus, ayrı çarpan,
  kritik ve savunmasızlık. Ardından overpower/DoT/minyon ve özel etkileşimler.
- Eğitim hesaplayıcısına kaynak build ve kanıt düzeyi belli gerçek modeller ekle.
  Bir vuruş hasarı, beklenen vuruş ve DPS girdilerini ayrı tanımla.

**Teslim:** Kaynaklı formül sayfaları, bağımlılık görünümü ve ilk hasar hesaplaması.
**Bitiş ölçütü:** Desteklenen ifadeler tekrar üretilebilir; unresolved alanlar açık;
yorumlayıcı testi ile oyun katsayısının doğrulaması birbirine karıştırılmaz.

## Faz 7 — Savunma, zamanlama, kaynak ve proc

- Zırh/direnç, hasar azaltma grupları, barrier/fortify, dodge/block/heal kuralları.
- Attack/cast hızı, breakpoint/frame/tick, cooldown ve iç cooldown.
- Kaynak üretim/maliyet, eşikler, sürdürülebilirlik ve etkinlik süresi.
- Lucky Hit ve olay/hit/tick bazında proc, uygunluk filtresi ve zincir etkileşimleri.
- Hedef seviyesi/zorluk, minyon, durum etkileri ve sınıfa özel istisnaları bağla.

**Teslim:** Koşulları açıklanan mekanik sayfaları ve uygulanabilir hesaplayıcılar.
**Bitiş ölçütü:** Her modelin girdileri, sınırları ve doğrulama düzeyi belli;
çatışan kanıtlar saklanır, tek bir evrensel katsayı varsayılmaz.

## Faz 8 — Loot, crafting ve RNG

- Loot kaynağı, havuz/alt havuz, eligibility, ağırlık, roll dağılımı ve seçim sırasını al.
- Boss/aktivite/zorluk/karakter koşullarını loot ilişkilerine bağla. Dünya ayrıntıları
  Faz 9'da genişler; burada hesap için gerekli kaynak kayıtları da alınır.
- Enchanting/tempering/masterworking ve build'de bulunan diğer crafting
  sistemlerinin havuz, maliyet, tekrar seçim ve sonuç kurallarını modelle.
- Bağımsız/sabit olasılıklı deneme varsayımını yalnızca geçerli olduğunda kullan.
  Sunucu tarafında erişilemeyen oranlar unknown/NULL ve ayrı araştırma kaydı olsun.
- Beklenen deneme/maliyet, sonuç dağılımı ve hedef başarı olasılığı hesaplarını ekle.
- Ölçümde başarısız denemeleri de say; örnek sayısı, güven aralığı ve seçilim
  etkisini raporla. Sıfır başarıyı kesin sıfır oran olarak yorumlama.

**Teslim:** Havuzlar ve kanıtlı RNG modelleri; belirsizliği görünür hesaplayıcılar.
**Bitiş ölçütü:** Ağırlık ile nihai olasılık ayrılır; koşullar/bağımlılık açık;
verisi olmayan sistem için kesin oran veya garanti üretilmez.

## Faz 9 — Dünya, ilerleme ve sezon sistemleri

- Canavar/boss, aktivite/dungeon, seviye/zorluk, ödül ve drop kaynağı ilişkilerini genişlet.
- XP/seviye, materyal/gold, ödül/stat ölçekleme ve kaynaktaki diğer ilerleme kuralları.
- Sezon gücü, etkinlik, özel materyal/mekanik ve karakter/loot etkileşimleri.
- Sezon 15 kayıtlarını tarihsel/PTR kayıtlarından ayır; sürüm farklarını göster.

**Teslim:** Kaynak → hedef → ödül → eşya/mekanik ilişkileriyle geniş oyun arşivi.
**Bitiş ölçütü:** Faz 1 envanterindeki her türün durumu belli; kapsanmayan sistemler
saklanmış eksik iş listesinde ve bilimsel belirsizlik durumuyla raporlu.

## Faz 10 — Ölçüm, tamlık, güncelleme ve işletim

Bu işler önceki fazlarda başlar; burada düzenli sürece dönüştürülür.

- İlk ölçüm genel hasarla başlar. Gerçek oyun deneyinde kullanıcının kaydettiği
  kontrollü vuruş/proc/drop örnekleri için koşul, build, tekrar ve ham gözlem şablonu hazırla.
- Hipotez → datamine/ölçüm → doğrulama/çelişki geçişlerini açık kanıtla yönet.
  Dosyada ifade bulunması tek başına runtime davranışını verified yapmaz.
- Tür bazında kaynak/içe alınan/çözümlenen/gösterilen/verified sayılarını raporla.
- Yeni build'i taslak içe al; fark/bağımlılık/tamlık kontrolü sonrası yeni immutable
  snapshot yayınla. Önceki sürüm ve geri dönüş yolu korunur.
- Mobil/klavye/hata durumlarını gerçek tarayıcıyla doğrula; hacim büyüyünce DB/API
  sorgu süresi, indeks ve kaynak tüketimini ölç. Gerektiğinde liste API'sine geçişi değerlendir.
- Native sunucu için makine dışı DB yedeği, geri yükleme testi, disk/log/release
  takibi ve servis sağlığı kontrollerini tamamla. Otomatik veri silme politikası uydurma.

**Teslim:** Tekrarlanabilir araştırma, ölçülen kapsama ve sürdürülebilir yama/yayın süreci.
**Bitiş ölçütü:** Doğrulanmış her iddia kanıta bağlı; güncelleme veri kaybetmeden
yinelenebilir; yedek gerçekten geri yüklenmiş ve işletim sınırları ölçülmüş olur.


## Kısıtlar ve sınırlar — bütün fazlara uygulanır

### Kullanıcı kararları

- Her obje için özgün oyun ikonu araştırılır; kaynak handle/SNO, URL/dosya ve
  SHA256 eşleştirmesi tutulur. Uydurma görsel veya benzer isimli ikon doğrulanmış
  eşleşme sayılmaz. Bağımsız ikonu olmayan objenin bağlı oyun görseli açıkça belirtilir.
- Yetenek ağacı özgün oyunun düğüm, kenar ve konumlarını kullanır; özgün ikon ve
  çerçeve/bağlantı varlıkları araştırılır. Kaynak konumları tasarım amacıyla yeniden
  düzenlenmez. Görsel eşdeğerlik kanıtsız tamamlandı diye raporlanmaz.
- Yerel Diablo IV kurulumuna yalnızca okuma yap. Oyun dosyası yazma/taşıma/silme,
  yama veya süreç/bellek müdahalesi yok. Çıktıları proje içine yaz.
- Forum ertelenmiştir; üyelik/konu/yanıt/moderasyon ve Next/Supabase geçişi geliştirme.
  Forumla ilgili arşiv kuralları aktif veri/araştırma fazlarına uygulanmaz.
- Docker kurulum dosyaları kaldırıldı; uzak sunucuda Docker kullanılmaz.
- Ortak sunucuda Aryaland korunur. DiabloZone DB/roller/servis/release ayrıdır;
  ortak PostgreSQL cluster yükseltilmez veya test için yeniden başlatılmaz.
- Kullanıcı GitHub main'e birleştirme ve native yayını yetkilendirdi. Mevcut site
  çalışmasını eski kodla ezme; .git yalnızca DiabloZone klasörü içinde kalır.
- Veri kaybı, mevcut DB'yi sıfırlama veya yıkıcı temizlik için ayrıca kullanıcı kararı gerekir.

### Bilimsel veri sınırları

- Sezon/build/kanal kaynaktan doğrulanır. Duyuru, local manifest ve gerçek dump ayrıdır.
  Çalışma tarihinden sonraki sürüm duyurusunu o gün yayında kabul etme.
- PTR, tarihsel ve canlı veriyi karıştırma. Kaynak hash/ID/ham ifade ve gözlem tarihi tutulur.
- Bilinmeyen RNG oranı NULL/unknown; sıfır veya tahmin edilmiş kesin sayı değildir.
- Tooltip/datamine/model/ölçüm ayrıdır. Verified durumuna kaynak etiketi veya test
  başarısıyla otomatik geçilmez; bağımsız kanıt/tekrarlanabilir ölçüm gerekir.
- Kaynak toplamı bilinmeden tamamlanma yüzdesi üretme. Test/placeholder/varyant
  elemesi gerekçeli olmalı; ad/slug benzerliğiyle sessiz veri kaybı oluşturma.
- Yayınlanmış snapshot değişmez; yeni yama/kanıt yeni snapshot'a girer. Aynı snapshot
  kaynak/bağımlılık ilişkileri korunur; uygulanmış migration değiştirilmez.
- Ham formüller eval/Function ile çalıştırılmaz. Desteklenmeyen ifade ve bağımlılık saklanır.
- Sunucu tarafında erişilemeyen mekanik parametreler açık eksik araştırma kaydı olarak kalır.
- Sınıf array sırası için gözlem raporu data/research/class-index-observations.json.
  Affix2550212 Druid bitini işaretlerken açık class requirement Paladin SNO'sudur.
  Çelişki çözülmeden corpus çoğunluğunu kesin enum eşlemesi olarak kullanma.

### Uygulama ve işletim sınırları

- Astro/TypeScript/Tailwind/pnpm ve lockfile korunur; rutin iş için framework değiştirme.
- Türkçe/erişilebilir arayüz, boş/hata/yüklenme durumları ve mevcut yollar korunur.
- Parola/özel anahtar/gerçek .env Git'e, release'e, loga veya istemciye girmez.
- API yalnızca published snapshot ve SELECT reader hesabını kullanır; writer ayrıdır.
- Build/ağır çıkarım yerelde; uzak100GB disk Aryaland ile paylaşılır. Büyük ham oyun
  arşivi sunucuya taşınmaz; disk/DB/release boyutu gerçek veriyle ölçülür.
- Başarılı kontroller ve yapılamayan oyun/tarayıcı/ölçüm doğrulamaları ayrı raporlanır.
- Kullanıcının başka yerel değişiklikleri korunur; yeni izin akışı/kısıt kendiliğinden eklenmez.
