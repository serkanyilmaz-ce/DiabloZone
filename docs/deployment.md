# Native Linux yayını — DiabloZone

Kullanıcı 12 Ekim 2026 tarihinde projeyi uzak sunucuya aktarıp yayınlamamızı
açıkça istedi. Dış klasördeki [Notlar.md](../../Notlar.md) sunucu ve işlem kaydıdır.
Parolalar, özel anahtar içerikleri ve bağlantı URL'lerinin gizli bölümleri loglanmaz.

## Gerçek hedef

| Alan | Gözlem |
| --- | --- |
| Sunucu | linux-vm-1, 152.70.4.125, SSH ubuntu |
| Sistem | Ubuntu 24.04.5 LTS (noble), ARM64/aarch64 |
| Kaynak | 2 OCPU, yaklaşık 12 GB RAM, 100 GB boot disk |
| Mevcut Node | 22.23.3, /usr/local/bin/node |
| Mevcut PostgreSQL | 16.15, port 5432, yalnızca localhost |
| Mevcut web sunucusu | Caddy 2.11.7, port 80/443 |
| DiabloZone | https://diablozone.152.70.4.125.sslip.io/ |
| Ortak uygulama | Aryaland, systemd aryaland, yerel port 3001 |

Önceki Nginx/PostgreSQL 18 taslağı bu makinede kullanılmaz. Mevcut cluster
yükseltilmez, Aryaland DB/servisi değiştirilmez. Cluster genel bellek ayarlarına
dokunulmaz; 2 GB shared_buffers profili yeni ve bağımsız makine için taslaktır.
Önceki yerel PG18 testi tarihsel kanıttır; native hedefte PG16 ayrıca doğrulanır.
Docker uzak sunucuya kurulmaz.

## Ayrı servis ve veri

Caddy statik Astro çıktısını sunar; /api/* yolunu değiştirmeden 127.0.0.1:8787
üzerindeki tek Node API'ye iletir. X-Real-IP bağlantı adresiyle yeniden yazılır;
API yalnızca yerel proxy'ye güvenecek şekilde yapılandırılır. Health dışarı açılmaz.
HTTPS sertifikasını mevcut Caddy yönetir. sslip.io host'u IP'ye çözülür; özel
satın alınmış alan adı gerektirmez.

- Uygulama kullanıcısı: diablozone; interaktif login yok.
- Release: /srv/diablozone/releases/YYYYMMDD-HHMMSS; current symlink aktif release'i seçer.
- Servis: diablozone-api.service; auto-start ve hata sonrası restart.
- DB: diablozone. Writer/reader ayrı, non-superuser ve beşer bağlantı sınırı.
- API secret: /etc/diablozone/api.env, root 0600, yalnızca reader bağlantısı.
- Migration/import secret: /etc/diablozone/import.env, root 0600, ayrı writer bağlantısı.
- Caddy host dosyası: /etc/caddy/sites/diablozone.caddy; ana config'e import eklenir.

Reader SELECT yetkisiyle sınırlıdır; default read-only kapatılsa da yazamaz.
Writer migration/import yapar; API'ye verilmez. Secret'lar sunucuda üretilir;
komut argümanına, release arşivine, Git'e veya Notlar.md'ye girmez.
Mevcut kurulum ikinci çalıştırmada korunur; eksik/tutarsız secret veya başka DB
sahipliği görüldüğünde reset yapmak yerine işlem durur.

## Hazırlık ve aktarım

Geliştirme bilgisayarında:

```powershell
pnpm.cmd lint
pnpm.cmd test
$env:SITE_URL='https://diablozone.152.70.4.125.sslip.io'
pnpm.cmd build
pnpm.cmd api:build
pnpm.cmd release:package YYYYMMDD-HHMMSS
```

Arşiv .cache/releases içinde oluşur. dist, derlenmiş servis/DB araçları,
migration, araştırma planı, üç runtime bağımlılığının ayrı manifest/lockfile'ı
ve yeniden derlenebilir source/ dizini içerir. Gerçek .env, SSH anahtarı,
node_modules, cache, oyun kurulumu ve ham CASC arşivi aktarılmaz.
Manifest dosya hash'lerini ve arşivin SHA256'sını kayıtlar.

SCP ile arşiv staging dizinine aktarılır. Hash ve içerik doğrulanır; yeni release
dizinine açılır. Linux runtime kurulumu, özel tools dizinine sabitlenmiş pnpm
10.11.0 ile --prod --frozen-lockfile --ignore-scripts kullanır. Runtime bağımlılıkları
yalnızca dotenv 18.0.7, pg 8.23.1 ve zod 4.1.5'tir. Windows node_modules taşınmaz.
Astro geliştirme sunucusu ya da sunucuda frontend build gerekmez.

deploy/linux/provision.py, run-admin.py ve install-release.sh kurulum araçlarıdır.
Derlenmiş bootstrap migration checksum/advisory lock ve araştırma planı hash'i
ile aynı planın ikinci kez çoğalmasını engeller. DB'deki gerçek araştırma kayıtları
korunur. Boş oyun veri kümesi gerçek oyun verisi olarak içe alınmaz.

## Yayınlama ve geri dönüş

Yeni release'in manifesti, servis birimi, DB ve yerel API doğrulanır. current
bağlantısı güncellenir. Caddy config önce yedeklenir, yeni host eklenir,
caddy validate başarılı olunca reload edilir. Ortak Aryaland HTTP/servis sağlığı
işlem öncesi ve sonrası kontrol edilir. Önceki release silinmez.
Geri dönüşte current eski release'e çevrilip yalnızca diablozone-api yeniden
başlatılır; DB/snapshot silinmez. Uygulanan migration değiştirilmez; schema
geri dönüşü otomatik DROP ile yapılmaz.

Kontroller:

```sh
sudo systemd-analyze verify /etc/systemd/system/diablozone-api.service
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl is-active diablozone-api caddy aryaland
curl --fail http://127.0.0.1:8787/health
curl --fail https://diablozone.152.70.4.125.sslip.io/api/v1/seasons
curl --fail 'https://diablozone.152.70.4.125.sslip.io/api/v1/snapshots?season=15&channel=live&kind=research'
```

API sadece GET/HEAD kabul eder. Snapshot/kind/UUID kontrolü, sayfalama, SELECT
yetkisi ve immutability gerçek uzak PostgreSQL üzerinde sınanır. API restart
öncesi/sonrası snapshot kimliği/sayıları karşılaştırılır; ortak PostgreSQL
cluster testi için yeniden başlatılmaz. TLS dış bilgisayardan sertifika
doğrulaması açıkken kontrol edilir. Host reboot yapılmadan auto-start enable durumu sınanır.

## Veri ve kapasite sınırı

Liste/detay statik export, araştırma canlı API kullanır. Tam sınıf/eşya/affix
verisinin otomatik DB → frontend aktarımı ve gerçek oyun import'u bekler.
8 unknown araştırma alanı gerçek sezon 15 katsayısı/drop oranı değildir.
100 GB aynı makinedeki Aryaland ile paylaşılır; eski bağımsız 100 GB bütçesi
bu ortak sunucuya uygulanmaz. Veri büyüdükçe disk/DB/WAL/log/release ölçülür.
Otomatik release/DB/yedek silme yoktur. Makine dışı yedek ve geri yükleme testi
henüz hazırlanmadığından tamamlanmış felaket kurtarma sistemi iddia edilmez.

## Resmî kaynaklar

- [Caddy import](https://caddyserver.com/docs/caddyfile/directives/import)
- [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [PostgreSQL 16 UUID](https://www.postgresql.org/docs/16/functions-uuid.html)
- [Node sürüm durumu](https://nodejs.org/en/about/previous-releases)

PG16 gen_random_uuid desteği ile mevcut migration uyumu kontrol edilmiştir;
başarılı uzak uygulama/SQL sonuçları docs/progress.md ve Notlar.md'ye işlenir.
