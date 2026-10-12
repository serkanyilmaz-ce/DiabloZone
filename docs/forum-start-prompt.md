> Arşiv: forum kullanıcı kararıyla ertelendi. Bu dosya aktif başlangıç talimatı değildir.

Bu klasörde Türkçe konuşan oyuncular için bağımsız bir Diablo 4 topluluk forumu geliştir.

Önce AGENTS.md, docs/product.md ve docs/permissions.md dosyalarını oku.
Mevcut dosyaları koru. Bu klasör henüz bir uygulama değilse, mevcut talimat
dosyalarını koruyarak uygulamayı burada oluştur.

Teknoloji: Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL
ve Auth, pnpm. Resmi belgelerden güncel kurulum ve Auth/RLS kalıplarını kontrol et.
Kurulan sürümleri lockfile ile sabitle.

İlk sürüm: kayıt, giriş, çıkış, şifre sıfırlama; profil; kategoriler;
konu açma ve yanıt yazma; kendi içeriğini düzenleme; arama ve sayfalama;
şikayet; üye, moderatör ve yönetici rolleri; konu kilitleme ve içerik gizleme.

Diablo yapısı: genel tartışma, sınıf rehberleri, build paylaşımı,
sezon tartışmaları, grup/klan arama kategorileri.
Sınıf, sezon ve yama verilerini yönetilebilir tut.
Build konularında sınıf, sezon ve yama etiketi bulunsun.
Güncel oyun verilerini tahmin etme; örnek verileri demo olarak belirt.

Tasarım: koyu antrasit zemin, bordo vurgular, sade gotik atmosfer,
uzun tartışmalar için okunabilir tipografi. Mobil görünümü ve klavye erişimini tamamla.
Özgün veya kullanım izni olan görseller kullan.

$forum-feature skill'ini kullanarak ilk çalışan akışı tamamla:
kayıt/giriş → konu açma → başka kullanıcıyla yanıt verme →
sayfayı yenileyince verilerin korunması.

Auth, roller veya RLS üzerinde çalışırken $forum-permissions-review kullan.
Yetkileri docs/permissions.md tablosuna göre hem sunucuda hem veritabanında uygula.
Arayüzde düğme gizlemekle yetinme.
Kullanıcı kendi rolünü yükseltemesin; gizli anahtarlar istemciye veya Git'e girmesin.
Kullanıcı içeriğini güvenli göster; yazma işlemlerine sunucu tarafında hız sınırı koy.

Kısa bir plan çıkar ve uygulamaya başla. Rutin teknik kararları kendin ver.
İlk akış tamamlanınca arama ve moderasyona geç.
Harici hesap veya erişim gerektiğinde tam olarak eksik olanı bildir;
çalışabilen bağımsız işleri tamamla.
Çalışmayan özellikleri çalışmış gibi raporlama.

İlgili kontrolleri çalıştır. README'ye gerçek kurulum/çalıştırma komutlarını,
gerekli ortam değişkenlerini ve ilk yönetici atama yöntemini yaz.
AGENTS.md'ye kurulan gerçek kontrol komutlarını ekle.
docs/progress.md dosyasında tamamlananları, sıradaki işleri ve engelleri takip et.

Özel mesajlaşma, gerçek zamanlı sohbet, eşya pazarı ve gelişmiş build hesaplayıcı
bu ilk sürümün dışında. Üretime yayınlama yapma; önce yerel doğrulanabilir sürümü tamamla.
