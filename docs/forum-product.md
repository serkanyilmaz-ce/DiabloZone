> Arşiv: forum kullanıcı kararıyla ertelendi. Bu dosya aktif başlangıç talimatı değildir.

# Ürün kapsamı

## Amaç
Türkçe Diablo 4 oyuncularının soru sorabildiği, build paylaşabildiği ve
grup/klan bulabildiği bağımsız bir topluluk forumu.

## İlk sürüm
- E-posta ile kayıt, giriş, çıkış, şifre sıfırlama.
- Herkese açık kullanıcı adı ve profil; e-posta özel kalır.
- Kategoriler, konu listeleri, konu detayları ve yanıtlar.
- Konu/yanıt oluşturma ve izin dahilinde düzenleme.
- Başlık/içerik araması, sayfalama.
- Şikayet kuyruğu, kilitleme ve gizleme.
- Üye, moderatör, yönetici rolleri.
- Yönetici tarafından kategori, sınıf, sezon ve yama yönetimi.
- Build konularında sınıf, sezon, yama etiketleri.

## İlk kategoriler
Genel Tartışma, Sınıf Rehberleri, Build Paylaşımı,
Sezon Tartışmaları, Grup/Klan Arama.
Gerçek oyun değerlerini güncel resmi kaynaklardan doğrula;
doğrulanmamış sezon/yama/sınıf isimlerini demo olarak etiketle.

## Aşamalar ve kabul kriterleri
1. Temel: bağımlılıklar kurulur, ortam değişkenleri belgelenir,
   şema/migration ve RLS kuralları oluşturulur.
2. Ana akış: iki kullanıcı kayıt/giriş yapar; biri konu açar,
   diğeri yanıt yazar; yenileme sonrası veri korunur.
   Ziyaretçi yazamaz; başka üye içeriği düzenleyemez.
3. Keşif: kategori filtreleri, sayfalama, arama ve profil çalışır.
   E-posta ve yönetim verileri herkese açık sorgularda görünmez.
4. Moderasyon: şikayet gönderilir; moderatör inceler,
   konuyu kilitler veya içeriği gizler. Doğrudan isteklerde de
   kilitli konuya yanıt reddedilir; gizli içerik ziyaretçiye/üyeye açılmaz.
5. Kalite: mobil görünüm, klavye erişimi, hata/boş/yüklenme durumları,
   ana akış ve olumsuz yetki senaryoları doğrulanır.

## Tasarım
Antrasit zemin, bordo vurgu, açık renk okunabilir metin.
Dekoratif yazı tipini yalnızca başlıklarda kullan.
Mobilde taşmayan konu listeleri ve kolay yanıt formu tasarla.
Bağımsız topluluk olduğunu belirt; izinli veya özgün görseller kullan.

## Kapsam dışı
Özel mesaj, gerçek zamanlı sohbet, eşya pazarı, ödeme,
gelişmiş build hesaplayıcı, otomatik oyun verisi kazıma.

## Veri önerisi
profiles, user_roles, categories, topics, replies, reports,
moderation_logs, game_classes, seasons, patches.
Bu isimler taslak; ilişkileri, indeksleri, kısıtları ve politikaları
uygulama sırasında tasarla. Roller kullanıcı tarafından düzenlenebilir
profil alanlarından ayrı tutulmalı.

## Tamamlanma
Yerel uygulama gerçek veritabanıyla çalışmalı; kurulum tekrar edilebilir olmalı.
Eksik harici erişim varsa ilgili aşama engelli olarak işaretlenmeli.
Mock ile çalışan ekranı gerçek entegrasyon tamamlanmış sayma.
