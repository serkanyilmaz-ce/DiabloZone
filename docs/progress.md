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

## Güncel doğrulama

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
