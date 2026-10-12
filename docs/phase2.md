# F02 — İlk gerçek oyun kayıtları

12 Ekim 2026 · Kaynak → native PostgreSQL → reader export → statik site doğrulandı.

| Tür | Kayıt |
| --- | ---: |
| Sınıf | 1 (Sorcerer) |
| Yetenek/geliştirme | 24 (3 ana, 21 geliştirme) |
| Eşya | 1 (Harlequin Crest) |
| Affix | 6 |
| Aspekt | 1 (of Binding Embers) |
| Ağaç | 1 kesit |
| Toplam | 34 kayıt, 76 ilişki |

Ana yetenekler Fire Bolt, Fireball ve Flame Shield. Ağaç, kaynak 282 düğümün
105 düğümlük kesitidir. Tam sınıf ağacı ve build optimizer sonraki fazlardadır.
ID'ler SNO; modifier kimliği parent SNO + modifier ID'dir. Slug ad + ID içerir.

## Kaynak ve arşiv

- S15 başlangıç sürümü: 3.2.1.73552, canlı kanal; yerel 3.2.2 ayrı tutulur.
- Kaynak commit: 33e0bfbb5f717d3e560d14a7fb27d5a7f17fd2c0.
- Oyun snapshot: 5691d80f-9a80-4720-b5be-806705cd0379.
- İçerik mühürü: 2706adec0eccf36de81fb7eb1349c5b893d2094319ff3e9266b570600d385c3c.
- Araştırma snapshot'ı ayrıca korundu: 8533e17d-6a69-4a7c-a74b-d037a4ce2725.
- Kaynak ad/açıklamaları enUS. Ham ifadeler hesaplanmadı; verified mekanik 0.

## Veri yolu

data:poc, pinned temiz checkout'u hash/SNO ile okuyup altı türü normalleştirir.
Kullanılan bütün kaynaklar provenance.json içinde saklanır. Native prepare modu
release/migration hazırlar; current korunur. Writer taslak snapshot'ı doldurup
şema/referans kontrolü sonrası yayınlar. Aynı semantik içerik aynı UUID'yi korur.

Reader aynı transaction snapshot'ından veri/ilişkileri export eder. JSONB'nin
anahtar sırası değişse de semantik mühür korunur. SCP ile gelen export yerelde
doğrulanır; db:promote metadata'yı en son yazar. Frontend bu export'tan derlenir.
API payload'ları export'la; HTML snapshot/SNO kimlikleri DB ile karşılaştırılır.

## Komutlar

```powershell
pnpm.cmd data:poc .tmp/d4data
pnpm.cmd db:import
pnpm.cmd db:export 5691d80f-9a80-4720-b5be-806705cd0379
pnpm.cmd db:promote output/snapshots/5691d80f-9a80-4720-b5be-806705cd0379
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
pnpm.cmd api:build
```

Uzak secret ortamı deploy/linux/run-admin.py yükler; şifre argv/loga girmez.
Kesin aktif release/hash/commit dış Notlar.md'de tutulur.

## Kanıt

- Migration 002 gerçek PG16'ya uygulandı; 001 değişmedi.
- İkinci import aynı UUID: 34 kayıt/76 ilişki çoğalmadı.
- Reader export + promote mührü eşleşti.
- Altı türün bütün API payload'ları export ile eşleşti; bütün detaylar HTTPS200
  ve aynı snapshot/SNO. Kaynak hash'leri ve pinned linkler detaylarda gösterilir.
- Reader read-write transaction'da UPDATE42501; published links DELETEP0001.
- Cross-snapshot link/duplicate slug reddi PGlite PostgreSQL testinde doğrulandı.
- 16 test, lint, Astro/TypeScript 0 hata/uyarı/ipucu; 43 sayfa/API build geçti.
- Aryaland dahili servis200 ve güncel aryaland.online HTTPS200.
  Eski sslip host'u bu çalışma öncesinde kaldırılmış; kontrol güncellendi.

## Sınırlar

Sınıf index dizisi çözülemediğinden eşya uygunluğu unknown. Açık class SNO
referansı kullanılır. Aspekt kategorisi ve slot enumları çözümlenmedi;
ham değer/ifadeler korunur. İkonlar için mevcut fallback kullanılır.
Görsel/mobil/klavye QA henüz tamamlanmadı. Eski genel importer'lar yeni mühürlü
altı-tür sözleşmesine F03/F04'te uyarlanacak. Sıradaki faz F03.
