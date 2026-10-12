# F03 — sekiz sınıfın tam kaynak ağaçları

Kaynak: DiabloTools/d4data 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0,
sezon15 başlangıç 3.2.1.73552. Class SNO → SkillKit → Power/reward bağlantıları
kullanılır; sabit class-array sırası kullanılmaz. Boş class requirement bulunan
güçlerde SkillKit üyeliği kanıttır; çelişen pozitif requirement importu durdurur.

| Sınıf | Ana güç | Yetenek/geliştirme | Düğüm | Kenar |
| --- | ---: | ---: | ---: | ---: |
| Barbarian |24|192|270|264|
| Druid |26|251|337|348|
| Necromancer |23|184|259|253|
| Rogue |24|192|270|264|
| Sorcerer |25|201|282|276|
| Spiritborn |24|192|270|264|
| Paladin |24|192|270|264|
| Warlock |28|196|270|264|

Toplam1.600 kayıt, 2.228 düğüm, 2.197 kenar. Druid Landslide StringList adı
farklı büyük/küçük harf kullanır; kaynak dosya adı korunarak çözüldü. İçe alınan
yeteneklerde eksik İngilizce isim0. Raw rank, maliyet/cooldown ifadeleri, etiket,
modifier, exclusive group, eşik ve çerçeve/ikon referansları korunur.

Sekiz class + sekiz tree + önceki item1/aspect1/affix6 ile yeni snapshot1.624 kayıt
ve4.612 ilişki taşır. Snapshot cb1ea0ce-6eab-453c-b8e0-2034b83fb559;
inputSHA256 3d69f75fb0f8bd7d159039d9ca8a97bd0518a9afaa3326092ff421f30b4d50ce.
İkinci native import aynı UUID'yi korudu. Reader export checksum/ilişki kontrolünden
geçerek static build kaynağı oldu; eski F02 snapshot'ı korunur.

`data/research/class-coverage.json` sınıf bazlı kapsamı tutar. Bu kapsam sekiz
PlayerClass'ın açık SkillKit üyeliğidir. Test PlayerClass'ın SkillKit'i yoktur.
NPC/item/trigger güçleri ve kit dışında kalan Power envanteri sonraki entity/formül
fazlarında incelenir; 10.277 Power dosyasının tümü oyuncu yeteneği sayılmaz.

1.600 kaydın ana ikonu özgün yerel CASC'den bulundu; kaynak ve grafik patch'leri
ayrıdır. Tam görsel provenance ve kalan UI eksikleri `original-assets.md` içindedir.
İlk11 kaynak entegrasyon kontrolü bütün düğüm/path eşleşmeleri, doğru Landslide
ve PNG kimlik/hash/boyutlarını doğruladı. Oyun katsayıları verified yapılmadı.

Native yayın commit/release ve HTTPS kontrolleri `progress.md` ile dış Notlar.md'de
kaydedilir. Tam kaynak ağaçları arayüze bağlanmıştır; oyun/tarayıcı piksel karşılaştırması
ve connector/animasyon katmanları devam eden iştir.
