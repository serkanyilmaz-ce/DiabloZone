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
  1.600yetenek/geliştirmenin tamamı özgün ana ikonunu gösterir. Salt okunur
  yerelCASC extraction1.583PNG; oyun manifesti değişmedi. Veri73552/grafik73764.
- 16birim+11kaynak testi, lint/TypeScript/build/API geçti.1.626sayfa.
- İzole headless Edge155.0.4283.45 ile yerel ve canlı HTTPS1440px/390px arama,
  class/type filtreleri, PNGyüklemesi, ağaçarama/detay/class/klavye geçişi geçti;
  yatay sayfa taşması ve pageerror0. Kullanıcı tarayıcı profiline bağlanılmadı.
- Native checker önce apostrof adları HTMLentity karşılaştırmasında hatalıydı.
  Araç düzeltildi; published release dosyası değiştirilmeden bağımsız checker
  çalıştırıldı. Tüm API sayfaları/payload ve1.616detayHTML kaynak/snapshot eşleşti.
  Reader yazamaz, publishedlink silinemez, Aryaland.online200.
- Site enabledsystemd/Caddy'de; SSHkomutları iş sonunda kapandı. OrtakPG/Aryaland
  restart/reboot yok. F03animasyon/connector/piksel eşlemesi sürer; F04hazırlığı başladı.
