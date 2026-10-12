# TR/EN, temalar ve okunabilir oyun metinleri

12 Ekim 2026 kullanıcı isteği: karışık/ikonsuz kayıt görünümünü toparla,
yetenek açıklamalarını Türkçe sun, TR/EN seçim ve açık/koyu tema ekle,
DiabloZone logosunu yenile. Bu UI revizyonu F05/F06 veri işlerinden önce gelir.

## Oyun çevirileri

Yerel Diablo IV 3.2.2.73764 kurulumunun enUS/trTR StringList katalogları
WiseOwl.Casc ile salt okunur okundu. 29.187 özgün metin çifti çıkarıldı.
.build.info öncesi/sonrası SHA256 aynıdır; oyun dosyası değiştirilmedi.
Ham metinler proje output/localization altında kalır; dış çeviri servisi kullanılmadı.

Arşiv veri kaynağı 3.2.1.73552'dir. SNO/label eşleşmesi ve İngilizce metnin
baseline ile tam karşılaştırması yapılır. Farklı İngilizce karşılığı olan 327
alan kullanıma alınmadı. Eşleşen 18.589 kayıt / 25.183 alan ayrı immutable
PostgreSQL localization set'ine alındı. 1.600 yeteneğin tamamının adı ve
açıklaması gerçek Türkçe karşılığıyla eşleşti. Matematik hesaplanmadı.

Set: c1f24b94-a808-4b0b-aa85-dc79ed0a0382.
Mühür: f1f33e9583a0eff4f9239a473cdf135fae448740bfd42e7d81e4c098c3f44bc0.
İkinci import aynı UUID; reader export aynı mühür. 005 migration, kaynak
snapshot ve sistem arşivini bağlar; yayınlanmış çeviriler değiştirilmez.
Public locale dosyası yalnızca reader export'tan üretilir, URL'si hash içerir.
Kapsama/istisnalar data/research/localization-coverage.json'dadır.

Sınıf adları General SNO 4118'den ayrıca okundu: Barbar, Druid, Ölüm Büyücüsü,
Haydut, Büyücü, Ruhdoğumlu, Paladin, Kara Büyücü. UI sözlüğünde kullanılır;
kanıt data/research/class-localization-evidence.json.

## Arayüz davranışı

Mevcut yollar korunur. TR/EN seçimi ?lang=tr / ?lang=en ile paylaşılır;
localStorage tercihi sonraki sayfalarda korunur. İç bağlantılar seçili dili
taşır. html lang, başlık, açıklama, ekran okuyucu etiketleri ve dinamik listeler
güncellenir. Türkçe/İngilizce ad ve açıklamalarla arama yapılır; kimlik, slug,
snapshot ve formül kaynakları değişmez. UI İngilizcesi ayrı bakım sözlüğüdür.
JavaScript/locale dosyası olmadan temel statik kaynak görünümü okunabilir;
çeviri yüklenemezse açık hata durumu gösterilir.

Ham tooltip token'ları arşivde — olarak saklanır, oyuncu görünümünde işaretli X
değişkeni olarak gösterilir; 0 veya tahmin edilmiş sayı eklenmez. Ham şablon, koşul, kaynak etiketleri ve formüller
açılır kaynak ayrıntılarında korunur. TR metin resmi kaynaktan gelir; bir
metnin bulunması güncel runtime katsayısının doğrulandığı anlamına gelmez.

Eşya listesi başlangıçta özgün ikonu olan kayıtları gösterir. Görsel filtresinde
Tüm görseller veya bulunamayan ikonlar seçilerek kaynak arşivinin tamamına
erişilir; kayıt silinmez. Eksik görsel için kayıt türünü belirten arayüz
sembolü (miğfer, yüzük, glyph…) kullanılır; uydurma oyun ikonu yoktur. İç adlar yerine anlaşılır kaynak kaydı/ID etiketi
gösterilir; iç adla arama ve detay erişimi korunur.

Açık/koyu tema sistem tercihiyle başlar, kullanıcı seçimi korunur. Başlangıç
head betiği renkleri CSS gelmeden ayarlar. Oyun ikonlarının pikselleri/renkleri
değiştirilmez; oyun ağacı tuvali özgün görsel paletini korur, okuma panelleri
temaya uyarlanır. Yeni logo vektör D/Z amblemi ve boynuz çerçevesidir; header,
footer ve favicon ortak görsel kimliği kullanır.

## Araçlar

data:locales → db:locales-import → db:locales-export → db:locales-promote.
Native API: /api/v1/localization-sets ve /<id>/entities; SELECT/published,
kimlik/locale/key doğrulaması ve sayfalama. Kaynak data/research/localization-manifest.json.
Tarayıcı kontrolü scripts/browser-i18n-qa.mjs; native DB/API kontrolü
deploy/linux/check-localization.mjs. Mevcut araştırma/matematik modelleri
eğitim/datayaklaşımı statüsünde kalır; verified mekanik sayısı artırılmaz.

## Katalog okunabilirlik revizyonu — 12 Ekim 2026

Kullanıcı geri bildirimi: boş alan, ikonsuz kartlar, yazı/ikon oranı, eşya
özelliklerinin görünmemesi ve karışık metin. Yalnızca sunum katmanı değişti;
DB, snapshot, locale set ve kaynak kayıtları değişmedi.

- (PH)/(DNS)/[ph_]/DO NOT SHIP/TEST/??? ve (BAŞTAN TASARLANDI) kayıtları
  "Test kaydı" olarak işaretlenir; varsayılan liste oyun kayıtlarını gösterir,
  Kayıtlar filtresinden hepsi açılır. Kayıt silinmez.
- 2DUI_Test/gray-box atlası ve 24 pikselden küçük görseller kayıt ikonu
  sayılmaz (pembe/boş kare). Manifest ve ağaç varlıkları değişmez.
- Eşya kartları/detayı: benzersiz güç arşiv açıklamasıyla, açıklaması olmayan
  stat affix'leri kaynak attribute adından resmî trTR terimleriyle (Maksimum Can,
  Saldırı Hızı, Kademe…) gösterilir. Değer çözülmez: +X. Etiketlenemeyen
  affix sayısı "+N özellik" olarak belirtilir.
- Türkçe adlardaki çekim/yer tutucu "—" bölümleri temel biçime indirgenir;
  aspektler EN "Aspect of …", TR "… Yüzü" (resmî trTR terimi) biçimindedir.
- Liste sıralaması: oyun kayıtları, nadirlik, ekipman, ikon. Kategori/yuva
  etiketleri resmî trTR karşılıklarıyla çevrildi (Odak, Tesir, Adalet…).
