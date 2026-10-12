# Faz 5 — Paragon ve karakter sistemleri

Sabit kaynak 3.2.1.73552 / commit 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0.
F04 oyun snapshot'ı değiştirilmedi. Yeni 004 migration ayrı, immutable sistem
arşivi ekler. Importer kaynak Git blob/SHA256, kimlik, build ve arşiv içi bağlantıları
doğrular; yayınlama tek transaction'dır. Writer ve reader ayrıdır.

Arşiv `8f059faa-2afb-44e6-977a-72367d2e3023`, mühür
`33ec0b017ae2b2e848b3d8c89ced744c0290dd3383524c32d7656739b4721822`.
İkinci import aynı UUID'yi verdi. Gerçek PostgreSQL reader export yeniden
doğrulandı ve data/generated/systems.json'a alındı.

| Tür | Arşiv kaydı |
| --- | ---: |
| ParagonBoard | 81 |
| ParagonNode | 567 |
| ParagonGlyph | 162 |
| ParagonGlyphAffix | 316 |
| Recipe | 2355 |
| Season | 18 |
| GameBalance | 11 |
| Toplam | 3510 |

Kayıtlar test/placeholder/tarihsel varyantları da içerir. Season türünde 18 kayıt
bulunması 18 canlı sezon mekaniği anlamına gelmez. Tarifler glyph upgrade
bağlantılarını korumak ve sonraki crafting incelemesini hazırlamak için alındı.

Panoların nWidth ve sıralı arEntries alanları kullanılır. Hücreler gerçek düğüm
SNO'suna gider; 21 sütunlu örnekte 441 hücre vardır. Pano bir kaynak görselleştirmesidir:
bağlantı, döndürme, puan harcama ve orijinal UI ile görsel eşdeğerlik ilan edilmedi.
Glyph affix ölçekleme skalerleri, stat eşikleri, enum ve ham ifadeler korunur.
Array class-index sırası önceki kaynak çelişkisi çözülmeden sınıf filtresine çevrilmedi.

191 özgün ikon handle'ı bulundu; 2'si önceki registry'de mevcuttu. Kalan 189'u
yerel oyundan salt okunur CASC ile çıkarıldı, PNG hash ve pinned atlas SNO/UV
eşleşmeleri doğrulandı. Oyun manifesti değişmedi. Yeni birleşik asset set
`540d47e9-d05e-4736-a778-b19a409ece79`, mühür
`b2ba1c10ccfa9ac6740cd64a54a6d517869472b04335c595ba68d92e067fa689`:
10.374 istek / 10.287 çıkarılmış PNG. İkinci register aynı kimliği verdi;
frontend manifesti gerçek reader export'tur. Eski set ve URL'ler korunur.
İkon alanı olmayan objeye uydurma ikon eklenmez. Maske ve glyph varyantları
ham kaynakta ayrı handle olarak kalır; nihai runtime seçim kuralı henüz çözülemedi.

1144 çözülemeyen dosya referansının tamamı TreasureClass türündedir. Pinned
envanterde bu türün dosyası yoktur; RNG havuzları veya oranları mevcut diye
raporlanmaz. Diğer arşiv dışı referanslar kaynak locator'ıyla saklanır, hedef
dosyanın payload'ı okunmuş veya yayınlanmış sayılmaz.

`/systems/` arama/tür filtresi ve 24 kartlık sayfalama sunar. Detaylarda pano,
glyph ölçekleme alanları, arşiv içi bağlantılar, hash ve bütün ham JSON bulunur.
API `/api/v1/system-archives` ve `/<id>/records` yalnızca published/SELECT.

Kalan F05 işleri: tüm sınıf özel sistemleri, minyon/companion, buff/debuff,
gem/rune aktivasyon/stacking kuralları, radius/rank semantiği ve runtime uygunluk.
F05 tamamlandı diye işaretlenmez; bağımsız formül arşivi F06'da ilerler.
