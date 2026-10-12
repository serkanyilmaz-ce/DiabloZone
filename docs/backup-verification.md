# DiabloZone yedek ve geri yükleme kontrolü

12 Ekim 2026 08:06 UTC'de üretim DiabloZone DB'si pg_dump custom format ile
yedeklendi. Ayrı `diablozone_restore_20261012_110700` veritabanına
pg_restore --single-transaction --no-owner --no-privileges ile gerçekten
geri yüklendi. Snapshot/asset/system mühürleri, migration hash'leri ve
katalog/kaynak/ilişki/araştırma sayıları üretimle eşleşti. Geçici test DB'si
silindi; üretim kontrol öncesi/sonrası aynı kaldı. Aryaland/PG cluster yeniden
başlatılmadı ve production DB sıfırlanmadı.

Yedek 18.499.098 bayt, SHA256:
`b036ff0f74ae4e95bc41fad157f2a8c21196ecf395629e6e2e12212290e3d4b7`.
Sunucuda `/var/backups/diablozone/20261012-110700/diablozone.dump` root/0600,
yerel makinede `.cache/backups/diablozone-20261012-110700.dump` bulunur.
Transferden sonra yerel SHA256 aynı çıktı. Yedek Git'e/release'e girmez.
Metadata raporu data/research/backup-check-latest.json'dadır.

Tekrarlanabilir araç: `sudo python3 deploy/linux/backup-check.py YYYYMMDD-HHMMSS`.
Mevcut hedefi ezmez; yalnızca DiabloZone'u dump eder ve yeni isimli geçici DB
kullanır. Secret environment veya rol şifreleri çıktıda bulunmaz. Yedek,
restore'a root tarafından açılan stdin üzerinden verilir; private dizin izni
gevşetilmez. İlk deneme root-only dosyayı postgres hesabıyla doğrudan açmaya
çalıştığından başarısızdı; test DB'si temizlendi, araç düzeltildi ve yeni isimli
ikinci deneme geçti. Başarısız deneme üretimi değiştirmedi.

Bu bir manuel geri yükleme kanıtıdır. Otomatik günlük dış sunucu transferi,
alarm ve saklama politikası henüz kurulmadı; tam F10 işletim teslimi değildir.
