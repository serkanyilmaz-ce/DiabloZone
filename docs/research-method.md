# Diablo IV matematiğini araştırma yöntemi

## Kapsam
Oyunun tüm matematiksel mekanikleri ve RNG. İlk hedef sezon 15; ilk ayrıntılı
çalışma genel hasarın toplamsal bonusları, ayrı çarpanları, kritik ve savunmasızlığı.
Hasar, savunma, kaynak, hız, proc, loot, crafting ve sezon etkileri ayrı alanlardır.

## Kanıt katmanları
- Resmî açıklama: tarih/sürüm bağlantısıyla; bugünkü oyuna otomatik taşınmaz.
- Datamine: build, kanal, dosya, SNO, hash, ham ifade ve bağımlılıklar.
- Model: kapsam, girdiler, varsayımlar, yorum ve eksik mekanikler.
- Ölçüm: sürüm/karakter/hedef koşulları, ham örnekler, tekrar sayısı ve belirsizlik.
İfade dosyada bulundu diye o anda çalıştırıldığı veya tooltip ile eşleştiği
kanıtlanmış olmaz. Tek screenshot veya tek vuruş genel doğrulama değildir.

DB'de unknown → hypothesis → datamined/measured → verified gibi açık durumlar
saklanır; contradicted kanıt silinmez. Otomatik araştırma importer'ı verified
atanmasına izin vermez. Test edilmiş matematik modeli, doğrulanmış oyun modeli değildir.

## Sürüm ve kaynak
Resmî sezon 15: Season of Hell's Legacy, 3.2.1 build 73552 (15 Eylül 2026).
https://news.blizzard.com/en-us/article/24295394/celebrate-30-years-of-diablo-in-season-of-hell-s-legacy
Yerel .build.info gözlemi: 3.2.2.73764. Bu yalnızca kurulum sürümüdür.
Şimdiki generated metadata build'i NULL; gerçek oyun veri dökümü içe aktarılmadı.
PTR/canlı snapshot ayrıdır; başka build'in formül veya kaynağına bağlanılmaz.
Kaynak hash'i yoksa kayıt sadece kaynak adresidir; dondurulmuş belge kanıtı değildir.

## Eğitim hasar modeli
D = B × (1 + A + Ic Ac + Iv Av) × ürün(1 + mi) × C^Ic × V^Iv
B baz hasar; A etkin bonus toplamı. Ac/Av ilgili olaya koşullu toplamsal bonus.
Ic/Iv 0 veya 1. C/V doğrudan olay çarpanı. mi bağımsız olduğu varsayılan bonus.
Beklenen değer, dört olayın olasılık ağırlıklı toplamıdır. Kritik ve savunmasızlık
bağımsız varsayılır; bağımlı olaylarda ortak olasılıklar ölçülmeden model kullanılamaz.
Ana stat, zırh/direnç, aşırı güç, DoT, minyon, çift uygulama, limit, yuvarlama,
proc sırası ve özel yetenek kuralları bu eğitim modelinde yoktur.

Tarihsel 1.2.0 (17 Ekim 2023) Blizzard açıklaması: kritik baz olay çarpanı 1.50,
savunmasızlık 1.20; ek bonusların toplamsal ele alınması.
https://news.blizzard.com/en-us/article/24092662/diablo-iv-patch-notes-1-0-1-2
Bu katsayılar sezon 15 için doğrulanmadı; kullanıcı tarafından düzenlenebilir.

## RNG araştırması
Bilinmeyen olasılık NULL'dır; sıfır değildir. Havuz/ağırlık, koşul, dağılım,
denemeler arası bağımlılık, pity veya iç cooldown ayrıca kayıtlanır.
Sabit p ve bağımsız denemelerde en az bir başarı: 1 − (1 − p)^n.
İlk başarıya kadar ortalama deneme 1/p'dir; garanti değildir.
İstenen başarı olasılığına ulaşan n, log(1 − hedef)/log(1 − p) tavanıyla bulunur.
p<1 iken sonlu n ile %100 başarı yoktur. Arayüzde %1 başlangıcı yalnızca örnektir.
Bu model gerçek Diablo loot/proc sisteminin bağımsız olduğunu iddia etmez.

Gerçek RNG ölçümünde tüm başarısız denemeler de kaydedilir. Örneklem seçimi,
karakter/hedef/aktivite, zorluk, loot havuzu değişiklikleri ve sansürlü gözlemler
kontrol edilir. Oran tahminine örneklem büyüklüğü ve belirsizlik aralığı eşlik eder.
Az örnek veya sıfır başarı, oran kesin sıfırdır anlamına gelmez.

## Kontrollü deney
1. Tam build, rank, silah aralığı, hedef ve tüm pasifleri kaydet.
2. Koşullu bonus/proc etkilerini kapat veya kayda al; tek değişkeni değiştir.
3. Normal/kritik/savunmasız/kritik+savunmasız olayları ayrı örnekle.
4. Ham vuruş değerlerini, tekrarları ve dağılımı sakla.
5. A/B oranını ve hata payını incele; örtük değişken/tavan/yuvarlama hipotezlerini sınama.
6. Model artıklarıyla sonucu karşılaştır; çelişkili kanıtı silme.
7. Yeni yamada tüm geçerlilik varsayımlarını yeniden kontrol et.

## Güvenli işlem
Oyun klasörü salt okunur. CASC arşivi JSON değildir; veri çıkarım adaptörü ayrıca
hazırlanmalıdır. Oyun sürecine/belleğine müdahale yapılmaz. Çıktılar projeye yazılır.
Ham formüller eval/Function ile çalıştırılmaz; çözülemeyen ifade metin olarak kalır.
