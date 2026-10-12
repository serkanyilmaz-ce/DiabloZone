# F04 — tam eşya/affix/aspekt kaynak envanteri

Pinned kaynak 3.2.1.73552, commit33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0.
12.117 Item,6.329 Affix,608 Aspect ve161 ItemType tanımı hash ile okundu.
Ad/slot benzerliğiyle varyant birleştirilmez; tarihsel/test görünümlü kaynak
kayıtları da korunur. Dosyanın bu build'de bulunması düşebildiğini veya sezon15'te
aktif olduğunu tek başına kanıtlamaz.

| Tür | Kaynak / içe alınan | Yerelleştirilmiş ad | İkon kapsamı |
| --- | ---: | ---: | --- |
| Eşya |12.117 /12.117|11.987|4.500 kayıt, doğrudan inventory/rune/vendor/charm handle'ı|
| Affix |6.329 /6.329|1.468|11 kendi bağlı güç ikonu; diğerleri bağlı aspekt görselini kullanabilir|
| Aspekt |608 /608|Affix adı üzerinden|607 doğrudan oyun ikonu|

Her affix ham ağırlık, nitelik/roll ifadeleri, uygunluk flags/etiket/koşul,
greater/tempered alanlar ve pasif güç referansını saklar. Toplam19.375 ham affix
ifadesi vardır. **Ağırlık nihai drop yüzdesi değildir.** Sunucu tarafındaki havuz
ve seçim sırası kanıtsız hesaplanmaz; RNG probability unknown/NULL kalır.

Forced ve inherent affix bağlantıları birlikte korunur. Item/aspekt/affix
referanslarında unresolved0. 1.742 bağlı Power kaynağı ayrıca hash/provenance
listesinde vardır. Ham Power referansını saklamak onun runtime etkisini verified yapmaz.

Eşya rarity için authored eMagicType1/2/4 değerleri kaynak corpus yorumuyla
legendary/unique/mythic gösterilir. Enum0 farklı üretilen nadirliklere ait temel
kayıtları da içerir; unknown kalır. Enum3 açıklanmadı, unknown kalır. Bu yorum
oyun ölçümü değildir. Ham enum/quality değerleri rawData'da korunur.
Class array sırası kesinleşmedi: yalnızca açık class SNO ve sekiz bayrağın hepsi1
olduğunda evrensel uygunluk kullanılır. Kısmi array'den sınıf tahmini yapılmaz.
Slot adayları ItemType label kesişimidir; runtime uygunluk kuralı sayılmaz.

Yeni native snapshot f36be437-156e-437d-9939-c6d228f2ab91;
inputSHA256 d4c2413f50bab96e568827bbb2d95e6c668727a4c461645de7cf7a5b28c8cf42.
Önceki sınıf verisiyle toplam20.670 kayıt/9.522 ilişki. İkinci import aynıUUID;
reader export yeniden mühür ve referans kontrolünden geçti.

Özgün görsel registry003 migration ile ayrı immutable asset set'tir. Kaynak
grafik3.2.2.73764, veri3.2.1.73552; sürümler karışmaz. Set
a0659c36-1a22-4996-9a23-6f508a668113;
inputSHA256 2ba34965d0941e52529e3d181098f57840ef1c68b03f9ccb5864bb33b1099328.
10.185 handle/10.098 çıkarılmış PNG; çıkarılanların tamamı pinned atlas SNO/UV
ile eşleşir. Aynı UV eski patch'in piksellerinin aynı olduğunu kanıtlamaz.
İkinci register aynıset; reader export checksum'u doğrulandı. PNG URL'si tam
SHA256 içerir; önceki yayının legacy ikon yolları korunur. Tekil ikonu olmayan
kayda uydurma ikon atanmaz; 3D actor render ve eksik UI handle'ları takip işidir.

Listeler snapshot'a bağlı hafif projection JSON'dan arar; DOM'da yalnızca24
sonuç kartı çizilir. Ham ifadeler detayda kalır; liste çözümlenmemiş değerleri
işaretler. Bağımsız affix listesi, bütün türlerde ortak arama, filtre ve sayfalama
vardır. API snapshot listesinde büyük provenance dizisi tekrar gönderilmez.

Yerelde17 birim/11 kaynak entegrasyon testi, lint/TypeScript ve20.673 sayfalık
build geçti. Masaüstü1440/mobil390px arama, ikon, filtre, ağaç/klavye,
eşya/affix sayfalama ve reload kontrolleri geçti; pageerror0.
Native release/Git/HTTPS kanıtı progress.md ile dış Notlar.md'de kaydedilir.

Sonraki işler: yorumlanan enumların daha güçlü kanıtı, class-array çelişkisinin
çözümü, sezon/loot aktifliği, Source Power formül çözümü, eksik ikon/model render,
tam UI/oyun görsel eşlemesi; ardından paragon ve diğer sistemlerin tam zinciri.
