# DiabloZone — Diablo IV veri ve matematik arşivi

Türkçe, bağımsız oyun veritabanı: tüm sınıflar, eşyalar, affix/aspekt/yetenekler,
paragon ve diğer sistemler; tüm matematiksel ilişkiler, gizli çarpanlar ve RNG.
İlk hedef sezon 15. Forum ertelenmiştir.

Yayın adresi: https://diablozone.152.70.4.125.sslip.io/ .
Astro/TypeScript/Tailwind, kendi PostgreSQL arşivi ve salt okunur Node API.
Uzak sunucuda Docker kullanılmaz; mevcut Caddy, PostgreSQL 16 ve Node 22
üzerinde ayrı DB/roller ve systemd servisiyle yayınlanır.

## Belgeler

- [Fazlar ve kısıtlar](AGENTS.md), [ürün](docs/product.md), [veri kataloğu/tamlık](docs/data-catalog.md).
- [Bilimsel yöntem](docs/research-method.md), [native yayın](docs/deployment.md), [ilerleme](docs/progress.md).
- [Dış işlem günlüğü](../Notlar.md): sunucu ve kronolojik çalışma kaydı; secret içermez.
- Git: https://github.com/serkanyilmaz-ce/DiabloZone . .git yalnızca bu proje klasöründedir.

## Geliştirme

Node 22, pnpm 10.11.0. PowerShell pnpm.ps1'i engelliyorsa pnpm.cmd kullanılır.

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev --host 127.0.0.1
```

Arayüz http://127.0.0.1:4321/ . /api/ geliştirme proxy'si yerel 8787'ye gider.
Yalnızca frontend çalıştırıldığında araştırmanın canlı DB kartı API bağlantı
hatasını gösterir; statik sayfalar erişilebilir. Gerçek DB geliştirmesinde .env
içine ayrı writer/reader URL konur; .env.example yalnızca placeholder'dır.
Eski Docker/Compose ve local:* komutları kullanıcı isteğiyle kaldırıldı.

## Kontroller ve build

```powershell
pnpm.cmd lint
pnpm.cmd check
pnpm.cmd test
$env:SITE_URL='https://diablozone.152.70.4.125.sslip.io'
pnpm.cmd build
pnpm.cmd api:build
```

check Astro ve servis/DB TypeScript'ini kapsar. Testler Türkçe arama/sayfalama,
koşullu hasar/RNG, proxy güveni, API sorguları ve PGlite'ta gerçek PostgreSQL
kısıtlarını sınar. Sentetik kayıtlar sezon 15 oyun mekaniğini doğrulamaz.
Gerçek d4data/ağaç export'u olduğunda pnpm.cmd test:integration çalıştırılır;
bu kopyada gerçek export olmadığı için oyun/ağaç entegrasyonu henüz doğrulanmadı.

## Veri durumu

F01 kaynak/build denetimi tamamlandı: [kaynak raporu](docs/source-audit.md).
Sezon15 başlangıç3.2.1.73552 dökümü commit/hash ile sabitlendi; yerel3.2.2 ayrı kaydedildi.
Pinned sparse checkout ve belge cache'i hazırken:

```powershell
pnpm.cmd source:inventory .tmp/d4data 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0
```

Manifest data/research/source-manifest.json; ilk gerçek import seçimi poc-plan.json.

F02 yayında: 1 sınıf, 24 yetenek/geliştirme, 1 eşya, 6 affix, 1 aspekt ve 1 ağaç kesiti; toplam 34 DB kaydı/76 ilişki. [F02 kanıtı](docs/phase2.md). Metadata build 73552; kaynak 3.2.1.73552.
eksik veri açıkça gösterilir, bozuk export build'i durdurur. DB araştırma planı
8 alanı unknown olarak saklar; verified mekanik 0. Hasar/RNG laboratuvarı eğitim
modelidir. Tarihsel katsayılar güncel sezon verisi olarak sunulmaz.

Aktif küçük kaynak normalizasyonu: pnpm.cmd data:poc .tmp/d4data.
Writer import → reader export → db:promote → frontend build gerçek DB ile doğrulandı.
Eski genel importer'lar korunur; yeni mühürlü altı-tür sözleşmesine F03/F04'te uyarlanacak:

```powershell
pnpm.cmd data:probe --datamine .tmp/d4data
pnpm.cmd data:skills --datamine .tmp/d4data
pnpm.cmd data:tree --datamine .tmp/d4data
pnpm.cmd data:items --datamine .tmp/d4data
pnpm.cmd data:aspects --datamine .tmp/d4data
pnpm.cmd data:affixes --datamine .tmp/d4data
```

Mevcut item importer'ı unique/mythic, affix importer'ı ilişkili affix alt kümesine
odaklanır; tüm eşya/affix kapsamı tamamlanmış sayılmaz. Sınıf/paragon/loot havuzu
ve diğer sistem adaptörleri bekler. Hedef kayıt kapsamı docs/data-catalog.md'dedir.
Kaynak proje https://github.com/DiabloTools/d4data ; importer varsayımları gerçek
sezon 15 dökümüyle doğrulanmalıdır. Oyun kurulumuna yalnızca okuma yapılır.
Yerel manifest 3.2.2.73764 gösteriyordu; bu normalize veri dökümü değildir.

## DB ve API

```powershell
pnpm.cmd db:bootstrap
pnpm.cmd db:migrate
pnpm.cmd db:research
pnpm.cmd db:import
pnpm.cmd db:export <snapshot-uuid>
pnpm.cmd db:promote output/snapshots/<snapshot-uuid>
pnpm.cmd api:dev
```

bootstrap migration ve aynı planın çoğalmadığı idempotent seed'dir. db:research
özel JSON manifestiyle ham formül/bağımlılık/RNG alır; kendiliğinden verified
yapmaz. db:import altı türü, kaynak/SNO/hash ve ilişkileri kontrol eder; aynı içerik ikinci kez çoğalmaz. db:export
output/snapshots içine yazar; db:promote mühürlü published DB export'unu data/generated'a alır.

DATABASE_URL writer, DATABASE_READ_URL SELECT reader hesabıdır. DATA_SEASON/
DATA_CHANNEL kaynağa göre açıkça ayarlanır. API 127.0.0.1:8787 üzerinde derlenmiş
JavaScript ile çalışır. API_TRUST_LOOPBACK_PROXY yalnızca başlıkları yeniden
yazan aynı-host Caddy proxy'siyle 1'dir. Şifre/anahtar istemciye taşınmaz.
Liste/detay statik export, araştırma arşivi canlı API kullanır; tam
DB → frontend aktarımı kontrollü export/promote ile yapılır; otomatik zamanlama bekler.

## Release ve CI

```powershell
pnpm.cmd release:package YYYYMMDD-HHMMSS
```

Native kurulum araçları deploy/linux içindedir; süreç docs/deployment.md'de.
Arşiv yalnızca runtime + açık kaynak allowlist'i taşır. .env/anahtar/node_modules/
ham oyun arşivi dışlanır. Uzak runtime yalnızca üç sabit bağımlılık kurar;
Astro veya frontend derleyicileri sürekli servis için sunucuya kurulmaz.

GitHub CI pnpm frozen kurulum, lint, test, build ve api:build çalıştırır.
Eski otomatik d4data çekme, npm kurulum ve Pages yayın workflow'ları kaldırıldı.
Ana branch güncel çalışma ağacından fast-forward commit alır; eski kod checkout
edilerek mevcut tasarım üzerine yazılmaz. Sunucu yayını ayrı native işlemdir.

## Görünüm ve doğrulama sınırı

Antrasit/bordo tasarım, Türkçe sayfalar, URL filtreleri ve 24 kayıt sayfalama.
sanctuary-research.png özgün üretim görseldir. Eski kullanılmayan görsel/CSS
taslakları kaldırıldı. Diablo IV/markalar Blizzard'a aittir; proje bağımsızdır.
Tarayıcı üzerinden görsel/mobil/klavye QA henüz tamamlanmadı. HTTP/DB/TLS/
sistemd ve test sonuçları docs/progress.md'de ayrı kayıtlanır.
