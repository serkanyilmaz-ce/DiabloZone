# İlerleme — 12 Ekim 2026

## Aktif kapsam

Diablo IV'ün tüm oyun verileri ve tüm matematik/RNG ilişkileri. İlk hedef sezon 15.
Forum ertelendi. Kullanıcı native uzak yayın, GitHub main'e aktarım ve gereksiz
Docker dosyalarının kaldırılmasını istedi.

Yayın: https://diablozone.152.70.4.125.sslip.io/ .
Repo: https://github.com/serkanyilmaz-ce/DiabloZone .
Sunucu işlem günlüğü: [../Notlar.md](../../Notlar.md).

| İş | Durum | Kanıt / sınır |
| --- | --- | --- |
| Kapsam ve tamlık matrisi | Güncellendi | START-PROMPT, product, data-catalog, research-method, README |
| Tasarım/Türkçe yerleşim | Uygulandı | Görsel/mobil/klavye tarayıcı QA bekliyor |
| Liste/detay/yetenek ağacı | Korundu | Gerçek oyun export'u yok, boş durum görünür |
| Arama/filtre/URL/sayfalama | Uygulandı | Türkçe/sınır birim testleri |
| Eğitim hasar/RNG modelleri | Test edildi | Gerçek S15 katsayısı kanıtı değil |
| Araştırma planı | Uzak DB'de | 8 alan unknown, verified mekanik 0 |
| Native kurulum | Yayında | Ubuntu24.04.5 ARM64, Caddy2.11.7, Node22.23.3, PG16.15 |
| HTTPS ve sayfalar | Doğrulandı | Sertifika kontrolü açık; 8 HTML yolunda HTTP200 |
| DB/API/Caddy akışı | Doğrulandı | Gerçek PostgreSQL16; aynı snapshot API'den okunuyor |
| Reader/immutability/RNG | Doğrulandı | 42501/P0001/23514/23503; fixture kayıtları rollback |
| Kalıcılık/idempotency | Doğrulandı | Tek araştırma snapshot'ı; ikinci kurulum/API restart aynı UUID |
| systemd | Aktif ve enabled | diablozone-api; reboot yapılmadı, otomatik başlangıç enable edildi |
| Aryaland | Korundu | İşlem öncesi/sonrası sertifika doğrulamalı HTTP200; servis active |
| Git | .git proje içinde | main geçmişi korunarak güncel çalışma ağacı tek yeni commit alır |
| Docker temizliği | Tamamlandı | Dockerfile/Compose/local:* ve eski taslaklar kaldırıldı; volume silinmedi |
| Gerçek sezon15 kayıtları | Bekliyor | Tüm sınıf/eşya/affix/aspekt ve matematik henüz doldurulmadı |
| Tam DB → frontend akışı | Bekliyor | Araştırma canlı; oyun listeleri statik |
| Forum | Ertelendi | Arşiv belgeleri aktif kapsam değildir |

## F00 tarihsel doğrulama

- Lint, Astro/TypeScript (0 hata/uyarı/ipucu), 12 birim testi, frontend/API build geçti.
- Uzak entegrasyon release'i: /srv/diablozone/releases/20261012-050200.
  Arşiv SHA256: 44424d6734763d44e6edb267bdac06a552f178ce419505f13a6a8b41f8e703e5.
  Son Git commit'i kaynak/release.json içine kaydedilerek yeni final release hazırlanır;
  current bağlantısı ve kesin yayın commit'i dış Notlar.md içinde kayıtlanır.
- 001_research.sql gerçek PG16'ya uygulandı. LF satır sonları .gitattributes ile sabitlenir.
- Snapshot: 8533e17d-6a69-4a7c-a74b-d037a4ce2725, build73552, tek published araştırma planı.
- Gerçek oyun kayıt sayısı0; DB yaklaşık8271kB; her runtime release yaklaşık12MB.
- Reader read-write transaction açsa da UPDATE reddedilir; iki rol non-superuser.
- Published snapshot güncellenemez, yanlış RNG oranı ve çapraz snapshot kaynak reddedilir.
- Test fixture'ları transaction rollback ile kaldırıldı; draft snapshot kalmadı.
- /health dışarı404, POST405, yanlış UUID/kind400, özel404 sayfası404.
- API 127.0.0.1:8787, PostgreSQL localhost:5432; internet yalnızca Caddy80/443.
- systemd-analyze verify ve Caddy validate geçti. OS'nin ilgisiz monitoring unit
  izinleri hakkında mevcut uyarılar görüldü; ortak OS servisleri değiştirilmedi.
- İlk uzak kontrol aracında pool.query ile transaction sonrası savepoint kontrolü
  başarısız oldu; dedicated client ile düzeltildi ve tüm gerçek DB kontrolleri geçti.
- Native PostgreSQL/Aryaland restart veya host reboot yapılmadı.
- Görsel/mobil/klavye QA ve gerçek d4data/ağaç entegrasyonu henüz yapılmadı.

## Yayın dosyaları

deploy/linux içinde Caddy host, systemd, root-only secret provisioning,
writer admin çalıştırıcısı, hash doğrulamalı release installer ve gerçek DB/HTTPS
kontrol aracı vardır. Runtime yalnızca dotenv/pg/zod ve sabit lockfile kullanır.
Geri dönüş için önceki release ve Caddy yedekleri tutulur; veri sıfırlanmaz.

## Sonraki veri işi

Build/kaynak envanteri → küçük gerçek yetenek/eşya/affix/aspekt örneği → tam sınıf
ve eşya ilişkileri → paragon/diğer adaptörler → formül/RNG bağımlılıkları ve
kontrollü ölçüm. Kaynak toplamı olmadan tamamlanma yüzdesi uydurulmaz.

## Faz yürütme — F01

Ana faz haritası/teslim ölçütleri ve kısıtlar AGENTS.md içindedir; roadmap yönlendirme dosyasıdır.
F01 tamamlandı: sabit commit33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0,
sezon15 başlangıç3.2.1.73552. Yerel3.2.2.73764 ayrı sürüm olarak kaydedildi.
867.510 JSONpath/blob envanteri,134base tür;47örnek JSON/SNO/SHA256 doğrulandı.
İki resmî belge donduruldu; kaynak manifesti data/research/source-manifest.json.
F02'nin gerçek örnek seçimi data/research/poc-plan.json; denetim docs/source-audit.md.
Sınıf index array sırası unresolved; eski hardcoded sıraya göre veri ataması yapılmayacak.
14test ve lint/TypeScript geçti. Bu faz uygulama/DB içeriği yayınlamaz; gerçek
oyun kayıtları henüz0. START-PROMPT kullanıcı tarafından kaldırıldı; kaynak
paketleyici ve README yeni ana AGENTS planına uyarlandı. Sonraki faz F02.

## F02 — gerçek veri yayını, 12 Ekim 2026 06:21

34 gerçek kayıt ve 76 aynı-snapshot ilişki PostgreSQL → reader export → site/API
zincirinde doğrulandı. Sınıf1, yetenek24, eşya1, affix6, aspekt1, ağaç1.
Kaynak 3.2.1.73552; yerel 3.2.2.73764 ile karıştırılmaz. Ağaç 105/282 düğümle
kesittir; tüm ağaçlar F03 işidir. Ham formüller gösterilir; verified mekanik hâlâ0.
Snapshot 5691d80f-9a80-4720-b5be-806705cd0379;
inputSHA256 2706adec0eccf36de81fb7eb1349c5b893d2094319ff3e9266b570600d385c3c.
Aktif release /srv/diablozone/releases/20261012-062100; uygulama commit a6a2424.
002 migration PG16'da uygulandı; immutable ilişkiler ve reader yazma yasağı geçti.
İkinci import aynı UUID; eski araştırma snapshot'ı korunur. 16test, lint,
Astro/TypeScript, frontend/API build ve gerçek DB/HTTPS kontrolleri geçti.
GitHub Linux CI success: https://github.com/serkanyilmaz-ce/DiabloZone/actions/runs/38199230621 .
43 sayfa ve 33 oyun detay yolu kontrol edildi. Ayrıntılı teslim docs/phase2.md.
Aryaland'ın güncel adı aryaland.online; bu görev dışında değişen host korunur.
Önceki F00/F01 kayıtları tarihsel kanıttır; güncel oyun sayısı34, veri zinciri tamamdır.

## Kesintisiz devam — 06:25–11:25 Europe/Istanbul

Kullanıcı soru sormadan beş saat boyunca fazları sürdürmeyi istedi. AGENTS.md
çalışma penceresini, özgün oyun ikonlarını ve özgün ağaç yerleşimini kaydeder.
F03 tüm sınıf/yetenek/ağaç çalışması başladı. Her sunucu işinde SSH kapanır;
site enabled systemd/Caddy ile sürekli çalışır. Forum geliştirilmez.

## F03 — 12 Ekim 2026 06:53

Native PostgreSQL'de1.624 kayıt/4.612 ilişki: sekiz sınıf,1.600 yetenek/geliştirme,
sekiz tam kaynak ağacı; önceki eşya/affix/aspekt grubu korunur. Snapshot
cb1ea0ce-6eab-453c-b8e0-2034b83fb559; inputSHA256
3d69f75fb0f8bd7d159039d9ca8a97bd0518a9afaa3326092ff421f30b4d50ce.
İkinci import aynı UUID; reader export mühür/ilişki kontrolleriyle yükseltildi.
2.228 düğüm/2.197 kenarın tamamı özgün source konum/path ile eşleşir.
1.600 kaydın ana ikonu yerel oyun CASC'sinden bulundu; toplam1.583 PNG,
1.461 pinned atlas/UV eşleşmesi. Oyun manifesti extraction boyunca değişmedi.
Veri73552/görseller73764 farkı arayüzde açıklanır. Native kaynak derlemesi read-only.
16 birim +11 kaynak entegrasyon kontrolü, lint/TypeScript/API/frontend build geçti;
1.626 sayfa oluştu. Runtime animasyon/connector katmanları ve gerçek görsel
karşılaştırma sürer. F03 veri teslimi hazır; piksel eşdeğerliği tamamlandı sayılmaz.

### F03 yayını — 12 Ekim 2026, 07:00 (Europe/Istanbul)

- main0a948c2; aktif release /srv/diablozone/releases/20261012-065500.
  ReleaseSHA2564575dc6cb2d79adf21e8c8cd9278cb0424ef06bf9f8094a33c19d2e5b14b3d7d.
- Snapshotcb1ea0ce-6eab-453c-b8e0-2034b83fb559,1.624kayıt/4.612ilişki.
  İkinci import aynıUUID; eski34kayıtlıF02 ve araştırma snapshot'ları korunur.
- Sekiz sınıfın2.228düğüm/2.197kenarı kaynak koordinat/path ile eşleşti.
  1.600 yetenek/geliştirmenin tamamı özgün ana ikonunu gösterir. Salt okunur
  yerelCASC extraction1.583PNG; oyun manifesti değişmedi. Veri73552/grafik73764.
- 16birim+11 kaynak testi, lint/TypeScript/build/API geçti.1.626sayfa.
- İzole headless Edge155.0.4283.45 ile yerel ve canlı HTTPS1440px/390px arama,
  class/type filtreleri, PNGyüklemesi, ağaçarama/detay/class/klavye geçişi geçti;
  yatay sayfa taşması ve pageerror0. Kullanıcı tarayıcı profiline bağlanılmadı.
- Native checker önce apostrof adları HTMLentity karşılaştırmasında hatalıydı.
  Araç düzeltildi; published release dosyası değiştirilmeden bağımsız checker
  çalıştırıldı. Tüm API sayfaları/payload ve1.616detayHTML kaynak/snapshot eşleşti.
  Reader yazamaz, publishedlink silinemez, Aryaland.online200.
- Site enabledsystemd/Caddy'de; SSHkomutları iş sonunda kapandı. OrtakPG/Aryaland
  restart/reboot yok. F03animasyon/connector/piksel eşlemesi sürer; F04hazırlığı başladı.

## F04 DB ve yerel doğrulama — 12 Ekim 2026, 07:50

Bütün12.117Item/6.329Affix/608Aspect kaynak kaydı, önceki sekiz sınıf/ağaç ile
20.670kayıt/9.522 ilişki. Snapshotf36be437-156e-437d-9939-c6d228f2ab91;
inputSHA256d4c2413f50bab96e568827bbb2d95e6c668727a4c461645de7cf7a5b28c8cf42.
Native writer ikinciimporttaUUID'yi korudu; readerexport mührü/ilişkileri geçti.
003_original_assets.sql uygulanıp10.185handle/10.098PNGmetadata nativeDB'ye alındı.
Aseta0659c36-1a22-4996-9a23-6f508a668113; inputSHA256
2ba34965d0941e52529e3d181098f57840ef1c68b03f9ccb5864bb33b1099328.
İkinci register aynıset; ayrıreaderexport doğrulandı. Her PNG kaynak atlas SNO/UV ile
uyumlu; veri 73552 / görsel 73764 farkı korunur. PNGURL tamSHA256 içerir.
17 birim/11 kaynak testi ve lint/TypeScript geçti;20.673 sayfa build tamamlandı.
Masaüstü1440/mobil390: arama/filter/ikon/tree/klavye, item/affix pagination/reload
kontrolleri geçti, pageerror0. Listeler bütünkayıtları ararkenDOM'da24kart çizer.
İlkbuild geçici preview dosya kilidiyle EPERM verdi; kendi preview kapatılınca
aynıbuild geçti. OrtakOS veya oyun dosyası izinlerine müdahale edilmedi.
Sınıf dizisindeki kaynak çelişkisi Affix2550212'de bulundu; kesin sıra ilan edilmedi.
19.375 ham affix ifadesi var, verified mekanik 0. Yayın/HTTPSkontrolü devam ediyor.

## F04 canlı doğrulama; F05/F06 kaynak teslimi — 12 Ekim 2026

F04 release 20261012-080500, commit 448bdcd1f4a7580ab5e8a7a3f91d9e2ff5f03100,
arşiv SHA256 929a88162fb0f0daf37e4e08923d8847289afa983f723612b99c3e3658b8cab4
canlıya alındı. Gerçek PG/API payload'ları, bütün detay HTML'leri, görsel registry,
reader/immutability ve Aryaland HTTPS kontrolü geçti. Masaüstü/mobil browser geçti.

F05 ayrı immutable arşiv 8f059faa-2afb-44e6-977a-72367d2e3023:
3510 kaynak kaydı, 4268 ham ifade (3970 boş olmayan), gerçek reader export.
191 ikon handle'ının 189 yenisi oyun dosyaları değiştirilmeden çıkarıldı.
Yeni asset set 540d47e9-d05e-4736-a778-b19a409ece79; 10287 özgün PNG.
Kaynakta bulunmayan 1144 TreasureClass referansı unresolved; oran uydurulmadı.

F06 kaynak arşivi 73251 boş olmayan ifade görünümü; 67065 grammar supported,
6186 unsupported. Bunlar benzersiz oyun formülü/verified mekanik sayısı değildir.
Sınırlı parser: eval/Function yok, missing input ve sonlu olmayan sonuç reddi,
koşul kısa devre ve kaynak sınırları. 20 birim + 11 gerçek kaynak testi geçti.
24185 sayfalık build; mobil dinamik kart CSS kapsamı ayrıca düzeltildi.
F05/F06 gerçek sınıf/ölçüm/stacking teslimlerinin kalanları phase5/phase6.md'de.

F10 bağımsız işletim kontrolü: 18.5 MB DB yedeği gerçek ayrı test DB'sine geri
yüklendi, mühür/sayı/migration hash'leri eşleşti ve test DB'si kaldırıldı.
Makine dışı yerel kopyanın SHA256'sı eşleşti; docs/backup-verification.md.
Native F05/F06 uygulama yayını ve son browser/HTTPS doğrulaması bu kaydı izler.

## F05/F06 canlı teslim ve çalışma kapanışı — 12 Ekim 2026, 11:26

Aktif native release /srv/diablozone/releases/20261012-111300; uygulama/görseller
commit 1e4f27799ceceb2d3264e315fb231502e54d5cfe. Release SHA256:
6c701d13c950a7aa6fcea48d38382c8a56a50542d545ccb46490ccb9614529b0.
Hazırlık paketindeki draft işareti, tüm dosyaların temiz çalışma ağacı hash'leri
ile karşılaştırılmasından sonra kaldırıldı; final release commit'i sabittir.
Yerel yavaş sıkıştırma işlemi tek başına yeniden başlatıldı; site durdurulmadı.

3510 sistem kaydının tamamı gerçek PG reader export'u ile eşleşti. Reader
ACL yazmayı reddeder; published kayıt/set değişmez; eksik set yayını reddedilir.
Yedi türün API count/payload'ları ve 3510 detay HTML adı/arşiv kimliği doğrulandı.
İlk kontrol default read-only modun 25006 hatasını ACL 42501 diye beklediği
 için başarısızdı; araç açık read-write transaction ile düzeltildi ve yeniden geçti.
Published release dosyası değiştirilmedi; düzeltilmiş kontrol bağımsız çalıştırıldı.

Canlı HTTPS 1440/390px: arama/filtre/sayfalama, özgün ikon, glyph bağlantısı,
441 hücreli pano, kaynak formül sınır girdileri ve reload geçti; pageerror 0.
Dinamik kartların Astro scoped CSS dışında kalması düzeltilip yeniden sınandı.
20 birim + 11 kaynak testi, lint/TypeScript, 24185 sayfa build ve API build geçti.
Uygulama ve ikon commit'lerinin Linux CI başarı kanıtı:
https://github.com/serkanyilmaz-ce/DiabloZone/actions/runs/38222442521

Son kontrol: diablozone-api/Caddy/Aryaland active; API enabled ve health ok;
DiabloZone/formulas ve Aryaland HTTPS başarılı. Uzak disk 96GB/90GB boş;
release dizini bu son yayından önce 1.5GB idi. Ortak PG/OS restart/reboot yok.
Her SSH işi tamamlandı ve bağlantısı kapandı; site systemd/Caddy'de ayakta.
Kendi yerel preview işlemi kapatıldı. Yedek yerelde, Git/release dışında korunur.

Beş saatlik geliştirme penceresi sona erdi; uçuşta olan yayın kontrolleri
sonlandırıldı. Yeni faz/özellik başlamadan kalan işler AGENTS/phase5/phase6'da
korunur: sınıfa özel sistemler, gerçek hasar dependency/model/ölçüm, F07–F09
mekanikleri ve F10 düzenli otomasyon. TreasureClass oranları unknown, verified
oyun mekaniği 0; özgün ağaç için piksel eşdeğerliği iddia edilmedi.

## TR/EN, tema, logo ve okunabilir tooltip — 12 Ekim 2026, 12:34

Kullanıcı UI isteği uygulandı. Yerel CASC enUS/trTR kataloglarından 29187 resmî
metin çifti salt okunur çıkarıldı; .build.info değişmedi. İngilizce baseline
karşılaştırmasından sonra 18589 kayıt/25183 alan, 005 migration ile ayrı
immutable localization set'e alındı. 1600 yeteneğin tamamında TR ad/açıklama var;
327 farklı İngilizce alan kullanılmadı. Locale set c1f24b94-a808-4b0b-aa85-dc79ed0a0382,
mühür f1f33e9583a0eff4f9239a473cdf135fae448740bfd42e7d81e4c098c3f44bc0.
İkinci import aynı UUID; gerçek reader export doğrulandı. Veri 73552 / metin
73764 ayrı, ham oyun snapshot'ı ve formüller değiştirilmedi.

TR/EN seçim ?lang ile paylaşılır/persist edilir; ad/açıklama, UI, başlık ve
etiketler değişir. Türkçe/İngilizce arama ve ağaç seçimi çalışır. Açık/koyu
sistem tercihi ve kalıcı seçim; yeni SVG D/Z amblemi, header/footer/favicon.
Ham tooltip kodları oyuncu görünümünden alındı, değerler —; orijinal ifadeler
kaynak ayrıntılarında korunur. Eşya listesi özgün ikon filtresiyle başlar;
bütün kaynak kayıtları filtreyle erişilir. Uydurma oyun ikonu eklenmedi.

23 birim ve 11 kaynak testi, lint/TypeScript/API, 24185 sayfa build geçti.
Headless Edge 1440/390/1024: TR/EN açıklama ve arama/ağaç, renk/tercih,
source preservation ve taşma kontrolleri geçti. Storage kapalıyken explicit
EN ve tema çalışır. 11 ana İngilizce sayfada görünür TR UI metni kalmadı.
Görsel inceleme sonrası açık tema bilgi kutusu kontrastı/okuma aralığı düzeltildi.

Yeni çeviri tablosunu içeren 21458561 bayt DB dump gerçek ayrı test DB'sine
restore edildi; bütün mühür/sayı/migration kontrolleri eşleşti. Geçici DB
kaldırıldı; üretim/Aryaland korundu. Yerel makine dışı kopya SHA256:
826872a91f2b63b048940cdc2c2624c2f92fbeb608cd49d67bb52aef3a49a855.
Yedek .cache/backups/diablozone-20261012-123500.dump içinde; Git/release dışında.
Native uygulama yayını ve canlı kontroller bu kaydı izler. Ayrıntı docs/localization.md.
