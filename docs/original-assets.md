# Özgün oyun görselleri

İkonlar yerel Diablo IV CASC arşivinden **yalnızca okunarak** çıkarılır.
Oyun dosyaları, süreçler ve bellek değiştirilmez. Kaynak kurulum 3.2.2.73764;
oyun verisi ayrı pinned 3.2.1.73552 kaynağıdır. Bu fark arayüzde gösterilir.

`data/research/assets-manifest.json` her görselin oyun handle'ını, atlas SNO/adını,
kare UV/piksel dikdörtgenini, payload/PNG SHA256 değerini ve araç sürümünü tutar.
İsim benzerliğiyle eşleştirme yapılmaz. Kaynak atlas metadata'sında aynı SNO/handle/UV
bulunanlar ayrıca `same-handle-atlas-and-uv`; kalanlar `local-handle-only` işaretlidir.
İkinci durum eski ve yeni patch görselinin aynı olduğunu kanıtlamaz.

Araç [WiseOwl.Casc](https://github.com/WiseOwlSoftware/WiseOwl.Casc/tree/bb6f084a6f5480b91197f8cc8ad3c022dbf4f821)
kaynak commit bb6f084a6f5480b91197f8cc8ad3c022dbf4f821 üzerinden incelenip .NET8
hedefiyle derlendi. Arşivler FileAccess.Read açılır; kütüphane CDN/yazma işlemi yapmaz.
MIT araç lisansı oyun görsellerinin mülkiyetini değiştirmez: görseller Blizzard'a aittir.
Release yalnızca kullanılacak PNG ve provenance içerir; oyun arşivleri ve DLL'ler içermez.

İş akışı:

```powershell
node scripts/source/prepare-classes.mjs
node scripts/source/prepare-ui.mjs
pnpm.cmd data:classes
node scripts/assets/requests.mjs
dotnet build .tmp/wiseowl-casc/src/WiseOwl.Casc.Diablo4/WiseOwl.Casc.Diablo4.csproj -p:TargetFrameworks=net8.0 -p:TargetFramework=net8.0
dotnet run --project scripts/assets/CascExport/CascExport.csproj -- 'C:/Program Files (x86)/Diablo IV' output/assets-local/requests.json output/assets-local/3.2.2.73764
pnpm.cmd exec tsx scripts/assets/promote.ts
```

`requests.mjs` oyun entity'lerinin handle referanslarını ve SkillTree.ui katmanlarını
toplar. CASC tool bir atlası bir kez çözer; özgün kareleri kayıpsız PNG'ye yazar.
PNG encoder renk/alpha piksellerini değiştirmez. Manifest `.build.info` hash'ini
başta/sonda karşılaştırır. Hash ve PNG boyutları bağımsız entegrasyon testindedir.

İlk teslim: 1.609 handle araştırıldı; 1.583 görsel çıkarıldı. 1.600 yetenek/geliştirme
kaydının ana ikonları tamamı bulundu; bunlar aynı görseli paylaşabilir. 1.461 kare
pinned kaynak metadata'sındaki atlas/UV ile de eşleşir. 20 handle çözümlenmedi;
6 genel UI görselinin codec'i araçta desteklenmedi. Kaynakta referans bulunması
görselin bu patch'te kullanıldığını tek başına kanıtlamaz.

İkonlar immutable oyun payload'ını değiştiren bir overlay değildir: oyun kaydında
handle korunur, sunum katmanı ayrı manifest üzerinden PNG yolunu bulur. Görsel
metadata'sını native DB'de ayrı versioned registry'ye almak takip işidir.

Tam ağacın düğüm/kenar/özel yol koordinatları kaynakla birebir test edilir.
Özgün çerçeveler kullanılmaktadır. Runtime animasyon, tam UI katman sırası,
bağlantı texture tekrarı ve gerçek tarayıcı/oyun karşılaştırması henüz tamamlanmadı;
bu teslim piksel eşdeğerliği iddiası taşımaz.
