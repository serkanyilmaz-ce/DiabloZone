# DiabloZone — Güncel çalışma kapsamı

Önceki forum odaklı talimatlar kullanıcı tarafından kaldırılmıştır. Güncel amaç
Diablo IV'ün tüm oyun verilerini ve matematiksel/RNG mekaniklerini araştırıp kendi
veritabanında arşivlemektir. İlk hedef sezon 15; forum ertelenmiştir.

- Başlangıç: START-PROMPT.md. Ürün: docs/product.md. Veri tamlığı: docs/data-catalog.md.
- Bilimsel kanıt: docs/research-method.md. Yayın: docs/deployment.md. Durum: docs/progress.md.
- Dış klasördeki ../Notlar.md uzak sunucu bilgisini ve kronolojik işlem kaydını tutar.
- Astro/TypeScript/Tailwind, pnpm ve sabit lockfile korunur; Windows'ta pnpm.cmd kullanılır.
- Oyun kurulumuna yalnızca okuma yapılır. Anahtar/parola/gerçek .env loga veya release'e girmez.
- Kaynak build, eğitim modeli ve ölçüm ayrılır; bilinmeyen oran uydurulmaz.
- Yayınlanmış snapshot değişmez; yeni kanıt/yama yeni snapshot ile arşivlenir.
- Kullanıcı mevcut uzak sunucuya aktarma/yayınlama işini yetkilendirmiştir; Aryaland korunur.
- Sunucuda Docker kurulmaz. Mevcut Caddy, Node 22 ve PostgreSQL 16 kullanılır; DB/API ayrı tutulur.
- Veri kaybına yol açabilecek işlem ayrıca kullanıcı kararı gerektirir; rutin kararlar uygulanır.

Kontroller: pnpm.cmd lint, check, test, build, api:build. Yerel gerçek DB:
Uzak gerçek DB doğrulaması deploy/linux/check-remote.mjs ile yapılır; gerçek d4data/ağaçta test:integration.
Yayın arşivi: pnpm.cmd release:package YYYYMMDD-HHMMSS. Başarılı ve eksik
doğrulamaları README/docs/progress.md ve ../Notlar.md içinde güncelle.
