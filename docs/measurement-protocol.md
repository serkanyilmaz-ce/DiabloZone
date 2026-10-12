# Gerçek hasar ve RNG ölçüm protokolü

Bu protokol henüz yapılmış bir deney değildir. Kaynak ifadelerini gerçek
oyun davranışından ayırmak için kullanılacak kayıt biçimidir. Otomatik oyun
başlatma, input botu, süreç/bellek okuma veya kurulum değişikliği içermez.

## Genel hasar: ilk kontrollü deney

Build, sezon/kanal, sınıf/seviye, tam ekipman/affix/rank, Paragon/glyph,
hedef/zorluk ve etkin buff/debuff aynı kayıtla sabitlenir. Tooltip ile gerçek
vuruş ayrı değerlerdir. Bir sonraki koşulda yalnızca tek değişken değiştirilir:
toplamsal bonus, bağımsız çarpan, kritik veya savunmasızlık.

Her vuruş ham gözlemdir: zamanı, görülen hasarı, kritik/savunmasızlık durumu,
hedef ve kaynak kanıtı kaydedilir. Bilinmeyen durum null'dır; false/0 değildir.
Başarısız/kaçırılan vuruşlar ve dışlanan gözlemler de gerekçeyle saklanır.
Overpower, DoT, minyon, proc zinciri ve koşullu buff'lar aynı gruba karıştırılmaz.

Önce normal vuruş aralığı ve dağılımı ölçülür. Sonra aynı baz dağılımda her
koşulun oranı ve aralığı karşılaştırılır. Tek bir yüksek sayıdan çarpan çıkarılmaz.
Kritik ve savunmasızlık birlikte gözleniyorsa dört olayın sayıları ayrı tutulur;
bağımsızlık varsayımı kanıtlanmış sayılmaz. Kaynak/model tahmini ile gözlem
arasındaki fark, yuvarlama ve float hassasiyeti ayrıca raporlanır.

## Loot/proc/crafting RNG

Denemenin birimi açık olmalıdır: vuruş mu, tick mi, uygun proc olayı mı,
boss kill mi, crafting roll mu? Koşul, havuz, maliyet, tüm sonuçlar ve
başarısızlıklar kaydedilir. Yalnızca paylaşılan başarılı düşüşlerden oran tahmini
yapılmaz. Koşullar değişince yeni grup açılır; değişen pity/eligibility/independence
bilinmiyorsa sabit Bernoulli modeli doğrulanmış sayılmaz.

Başarı/deneme oranıyla birlikte örnek büyüklüğü ve yöntem belirtilmiş güven
aralığı raporlanır. Sıfır başarı gerçek oran sıfır demek değildir. Loot ağırlığı
nihai düşme olasılığına çevrilmeden önce havuz/alt havuz/seçim sırası çözülmelidir.
Kaynakta bulunmayan TreasureClass ve sunucu tarafı oranlar unknown kalır.

## Kanıt durumu

Ham dosya + build/hash = datamine kanıtı. Parser sınır testleri = yorumlayıcı
doğrulaması. Kontrollü tekrarlar = ölçüm. Mekanik için verified durumu ancak
koşul, sınır ve bağımsız tekrar kanıtıyla değerlendirilir. Çelişki varsa iki
kanıt korunur; sessizce birini seçip önceki immutable snapshot değiştirilmez.

Şablon: data/research/measurement-template.json. Gerçek oturum gelmeden boş
observations dizisi ve null girdiler doldurulmuş ölçüm sayılmaz.
