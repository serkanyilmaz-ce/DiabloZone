# Faz 6 — Ham formül arşivi ve yorumlayıcı

`/formulas/` gerçek PostgreSQL export'larındaki yetenek, affix ve sistem
ifadelerini birlikte arar. Kaynak build aynı olmalıdır; oyun snapshot ve sistem
arşiv kimlikleri projection/istemci kontrolünde korunur. Boş ifadeler raw JSON'da
kalır ancak arama sayısına dahil edilmez. Her ifade kaynak kaydına, export'taki
ham ifade alan yoluna, sabit commit dosyasına ve SHA256'ya bağlıdır. Mod
kayıtlarında yol mod nesnesine göredir; bütün Power dosyasının mutlak JSON
yolu diye yorumlanmaz. Aynı kaynak ifadesinin farklı normalize kayıtlarındaki
görünümleri korunur; sayılar benzersiz oyun formülü sayısı değildir.

73.251 boş olmayan ifade görünümü vardır: yeteneklerde 50.551, affix'lerde
18.730, sistemlerde 3.970. 67.065 görünüm sınırlı grammar ile parse edilir;
6.186 görünüm çözümlenmemiştir. Kaynak/provenance metadata'sı ortak owner
tablosunda paylaşılır: projection 40,6 MB yerine 17,8 MB ham JSON'dur;
Caddy sıkıştırmasıyla sunulur. UI yalnızca 24 sonuç çizilir. Ayrıntılı sayılar
data/research/formula-coverage.json'da; verified oyun mekaniği 0'dır.

`src/lib/expression.ts` bir tokenizer ve sınırlı AST yorumlayıcısıdır. Destek:
sayısal sabitler, manuel sembol girdileri, parantez, + - * / %, karşılaştırma,
mantıksal operatör ve üçlü koşul. eval/Function, üye erişimi, atama, string,
fonksiyon veya lookup çağrısı yoktur. Uzunluk/token/derinlik sınırları vardır;
eksik girdi, sıfıra bölme ve sonlu olmayan değerler reddedilir. Koşullar ve
mantıksal dallar kısa devre uygulanır. Desteklenmeyen kaynak değiştirilmez.

`supported` yalnızca bu grammar ile parse edilebilir anlamındadır. Parser
testi Diablo'nun runtime float/yuvarlama/uygulama sırasını veya katsayısını
doğrulamaz. Sembol kullanıcı tarafından girilir; bulunmayan değere 0 atanmaz.
Stat, lookup, birim ve koşul bağımlılıkları unresolved kalır. Gerçek oyun
ölçümü olmadan verified mekanik sayısı artırılmaz.

11 GameBalance tablosu kaynak arşivinde tutulur: AttributeFormulas,
DataAttributes, DifficultyTiers, LevelScaling, MonsterLevelCurves,
PlayerLevelBands, PowerFormulaTables, QualityClasses, SimpleScalarFormulas,
StringFormulas ve CharmLevelScaling. Null satırlar ve trailing-zero dizileri
korunur. Source float skaler tek başına zırh tavanı veya hasar formülü değildir.

Mevcut `/lab/` genel hasar/RNG eğitim modelidir; 1.50/1.20 tarihsel olay
çarpanlarını güncel S15 verisi diye sunmaz. Sıradaki ayrıntılı iş ana stat,
rank, toplamsal/ayrı çarpan, kritik ve savunmasızlık için kaynak dependency
çözümü ve kontrollü vuruş ölçümüdür. DoT, overpower ve minyon ayrı modeller
gerektirir. F06'nın gerçek model/ölçüm kısmı tamamlanmış değildir.
