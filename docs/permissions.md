# İlk sürüm yetki matrisi

> Bu, ertelenen forum aşamasının yetki taslağıdır. Aktif veri/araştırma servisi
> hesap veya forum rolü içermez; yeniden talep edilene kadar bu matris uygulanmaz.


Bu tablo varsayılan ürün kararıdır. Değişiklikleri açıkça belgeleyerek uygula.
Yönetici moderatör yetkilerini de taşır. Gizli içerik üyeye gösterilmez.

| İşlem | Ziyaretçi | Üye | Moderatör | Yönetici |
|---|---|---|---|---|
| Açık konu/yanıt okuma ve arama | Evet | Evet | Evet | Evet |
| Konu açma | Hayır | Evet | Evet | Evet |
| Açık, kilitsiz konuya yanıt | Hayır | Evet | Evet | Evet |
| Kendi açık, kilitsiz içeriğini düzenleme | Hayır | Evet | Evet | Evet |
| Başkasının içeriğini düzenleme | Hayır | Hayır | Hayır | Hayır |
| Açık içeriği şikayet etme | Hayır | Evet | Evet | Evet |
| Şikayet kuyruğunu inceleme | Hayır | Hayır | Evet | Evet |
| Konu kilitleme/açma | Hayır | Hayır | Evet | Evet |
| Konu/yanıt gizleme ve geri açma | Hayır | Hayır | Evet | Evet |
| Gizli içeriği moderasyon için okuma | Hayır | Hayır | Evet | Evet |
| Kategori ve oyun etiketlerini yönetme | Hayır | Hayır | Hayır | Evet |
| Başka üyeye moderatör rolü verme/kaldırma | Hayır | Hayır | Hayır | Evet |
| Kendi rolünü değiştirme | Hayır | Hayır | Hayır | Hayır |
| Kalıcı içerik silme | Hayır | Hayır | Hayır | Hayır |

## Ayrıntılar
- Moderatör başkasının metnini değiştirmez; gizler ve nedeni kaydeder.
- Kilitli/gizli konularda yeni yanıt ve normal düzenleme engellenir.
- Gizli konu altındaki yanıtlar da normal okuma, arama ve profil sonuçlarından çıkarılır.
- Şikayet edenin kimliği ve özel profil alanları herkese açık sorgulardan çıkarılır.
- Moderasyon işlemlerinde aktör, hedef, zaman, gerekçe ve işlem kaydı tutulur.
- Yöneticilik ataması ilk sürümde güvenli, belgelenmiş operasyonel kurulumla yapılır;
  herkese açık kayıt veya profil güncelleme isteği yönetici oluşturamaz.
- Rol/izin kontrolünde kullanıcı tarafından gönderilen role/author_id alanlarına güvenme.
- Yüksek yetkili veritabanı anahtarı RLS'yi aşabilir; bu anahtarla çalışan yolların
  sunucuda bağımsız yetkilendirmesini incele.

## Zorunlu olumsuz kontroller
Anonim yazma; başka hesabın içeriğini düzenleme; author_id/role değiştirme;
kilitli konuya doğrudan yanıt; gizli içeriği doğrudan kimlikle okuma;
arama/profille gizli veri sızması; üyenin moderasyon uç noktasına erişmesi.
