# DiabloZone — Başlangıç ve devam kapsamı

DiabloZone, Türkçe ve bağımsız Diablo IV oyun veritabanı ve matematik araştırma
arşividir. Hedef tüm sınıfları, eşyaları, affix/aspekt/yetenekleri, paragonu ve
oyunun diğer veri sistemlerini; tüm formül, gizli çarpan ve RNG ilişkileriyle
birlikte kendi PostgreSQL veritabanımızda saklamak ve göstermek. İlk hedef sezon 15.

Önce docs/product.md, docs/data-catalog.md, docs/research-method.md,
docs/deployment.md, docs/progress.md ve bir üst klasördeki Notlar.md dosyasını oku.
Notlar.md uzak sunucu bilgileri ve kronolojik işlem günlüğüdür; parola/özel
anahtar içerikleri burada tutulmaz. Önemli işlem, sonuç ve engelleri kaydet.

Mevcut Astro/TypeScript/Tailwind arayüzü ve pnpm lockfile korunur. Görünüm sade
antrasit/bordo; metin Türkçe, arama/filtre ve boş/hata durumları açık olmalıdır.
Mevcut liste, detay ve yetenek ağacı yolları korunur. Framework değişimi gerekmez.

Veriler sezon/build/canlı-PTR/snapshot bazında sürümlenir. Kaynak/hash/SNO,
ham ifade, semboller, bağımlılıklar, koşullar, roll aralığı, uygulama sırası,
yuvarlama/tavan ve kanıt durumu saklanır. Kaynak envanteri ve içe alınan kayıtlar
karşılaştırılmadan tamlık iddia edilmez. Yeni türler adaptör ve migration ister.

Tarihsel/örnek katsayı sezon 15 kanıtı değildir. Bilinmeyen RNG oranı NULL
kalır. Tooltip/datamine/model/ölçüm ayrılır; çözülmeyen formül korunur, eval ile
çalıştırılmaz. Ölçümler tekrarlanabilir koşul ve belirsizlikle kayıtlanır.
Yerel Diablo IV dosyaları yalnızca okunur; oyun klasörüne değişiklik yapılmaz.

Yerelde Astro geliştirme sunucusu kullanılır. Uzak hedef 152.70.4.125 üzerinde
Ubuntu 24.04 ARM64, 2 OCPU, 12 GB RAM, 100 GB disk; Docker kullanılmaz.
Mevcut Caddy + PostgreSQL 16 + Node 22 paylaşılır. DiabloZone ayrı DB/reader-writer
rolleri, systemd servisi ve /srv/diablozone release dizinleriyle çalışır.
Hedef adres: https://diablozone.152.70.4.125.sslip.io/ .

Kullanıcı bu sunucuya aktarım ve yayını açıkça istedi. Bu yayın yetkilidir;
mevcut Aryaland servisi/DB'si korunur. Secret/gerçek .env release/log/Git'e
girmez. Eski release geri dönüş için tutulur; mevcut DB yeniden oluşturulmaz.

Forum şimdilik beklemede. Konu/yanıt/üyelik/moderasyon geliştirme. Eski forum
belgeleri docs/forum-* içinde arşivdir. Kontrolleri çalıştır; doğrulanan sonuç,
eksik gerçek oyun verisi ve çalıştırılamayan tarayıcı kontrollerini ayrı bildir.
