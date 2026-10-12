# DiabloZone ürün kapsamı

Diablo IV'ün kaynakları izlenebilir Türkçe oyun veritabanı ve bilimsel araştırma
arşivi. Tüm sınıf, eşya, affix, aspekt, yetenek, paragon ve diğer oyun sistemleri;
her matematiksel mekanik, gizli çarpan, koşul, RNG havuzu ve olasılık kapsamdadır.
İlk hedef sezon 15. Ayrıntılı varlık/tamlık matrisi: [data-catalog.md](data-catalog.md).
Forum ertelenmiştir; aktif ürünün merkezi veri keşfi ve mekaniklerin anlaşılmasıdır.

## Kullanım

Oyuncu sınıf/sezon/build seçip kayıtları arar; liste ve detayda ilişkili
eşya, affix, aspekt ve yeteneklere geçer. Tooltip, ham ifade, koşul,
çözümlenmiş formül ve kanıt durumunu karşılaştırır. Hesaplayıcı gerçek build ve
doğrulama sınırını gösterir. Bilinmeyen veri açıkça belirtilir; sonuç uydurulmaz.
Bu akış hedef deneyimdir; mevcut eksik veriler docs/progress.md içinde kayıtlıdır.

## Mimari ve yayın

Astro/TypeScript/Tailwind ve pnpm korunur. Kendi PostgreSQL veritabanı
sezon/build/kanal/snapshot ile sürümlenir. Node API yalnızca yayınlanmış veriyi
okur. Liste/detay bugün statik export, araştırma arşivi canlı API kullanır.
Tüm oyun listeleri için otomatik DB eşitlemesi henüz tamamlanmamıştır.

Yerel geliştirme Docker gerektirmez. Uzak makine Ubuntu 24.04 ARM64,
2 OCPU, 12 GB RAM, 100 GB disk; Docker kullanılmaz. Ortak sunucunun mevcut Caddy,
PostgreSQL 16 ve Node 22 altyapısı kullanılır. DiabloZone ayrı DB/roller,
systemd servisi ve HTTPS host'u kullanır. Büyük veri çıkarımı/build yerelde yapılır.
Kullanıcı aktarım ve yayını açıkça istemiştir; [deployment.md](deployment.md).

## Teslim sırası

1. Çalışan siteyi uzak sunucuya aktar; HTTPS, gerçek DB/API ve kalıcılığı doğrula.
2. Kaynak sezon/build ve kayıt envanterini çıkar; küçük örnekle DB → API/export → arayüzü tamamla.
3. Tüm sınıf/eşya/affix/aspekt/yetenek ilişkilerini doldur; eksik referansları raporla.
4. Paragon, loot havuzu, crafting ve diğer sistem adaptörlerini gerçek kaynağa göre ekle.
5. Genel hasarla başlayan formül bağımlılıklarını, savunma/kaynak/zaman/proc ve RNG modellerini ölçümle genişlet.
6. Tamlık raporu, yamalar arası değişim ve sürüm seçimiyle arşivi sürdür.

## Kabul kriterleri

- Mevcut yollar, Türkçe arayüz ve tasarım korunur; arama/filtre/sayfalama işler.
- Eksik kaynak, bozuk export, boş sonuç, yüklenme ve API hata durumları görünürdür.
- Her kayıtta kaynak/sürüm; her formülde varsayım/bağımlılık/kanıt bulunur.
- Kapsamın tamamlandığı, kaynak toplamı ve eşleşme raporuyla gösterilir.
- Tarihsel örnek güncel sezon kanıtı sayılmaz; bilinmeyen RNG oranı NULL kalır.
- Snapshot'lar karışmaz; yayınlanmış veri değişmez; reader yazamaz, secret istemciye taşınmaz.
- Gerçek oyun/DB/HTTPS kontrolleri sentetik testten ayrı raporlanır.
- Lint, TypeScript, test ve frontend/API build geçer; mobil/klavye tarayıcı QA yapılmadıysa belirtilir.

Forum, üyelik/moderasyon, Next/Supabase geçişi, ticaret/ödeme/sohbet ve oyun
sürecine müdahale aktif iş değildir. Veri eksikken tam optimizer tamamlandı sayılmaz.
