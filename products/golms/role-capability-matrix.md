# GOLMS rol ve yetenek matrisi

Bu matris menü görünürlüğü değil, sunucu tarafı yetki kapsamını tanımlar. Gerçek izin; tenant, ürün hakkı, rol ataması, organizasyon kapsamı ve kayıt ilişkisi birlikte doğrulandıktan sonra verilir.

| Yetenek | Learner | Instructor | Line manager | Learning admin | Compliance admin | Report analyst | HQ support |
|---|---:|---:|---:|---:|---:|---:|---:|
| Kendi atama/deneme/öğrenme geçmişini okuma | ✓ | Kendi kaydı | Kendi kaydı | Kapsamlı | Kapsamlı | Yetkili özet | Süreli destek |
| İçerik/program oluşturma-yayımlama |  | Geri bildirim |  | ✓ | Politika kapsamı |  | Süreli destek |
| Atama/kayıt/iptal |  | Sınıf önerisi | Ekip önerisi/onayı | ✓ | Uyum kapsamı |  | Süreli destek |
| Sınav/görev tamamlama | ✓ | Kendi öğrenmesi | Kendi öğrenmesi | Test önizleme | Test önizleme |  |  |
| Sınav/görev değerlendirme |  | Atandığı sınıf | Ekip gözlemi | Yetkili | Uyum kanıtı |  | Süreli destek |
| Oturum/yoklama yönetimi | Kayıt | Atandığı oturum | Ekip onayı | ✓ | Görüntüleme | Rapor | Süreli destek |
| Muafiyet/eşdeğerlik kararı | Talep | Kanıt sunma | Ekip talebi | Politika izni | ✓ |  |  |
| Sertifika/dış kanıt | Kendi | Atandığı doğrulama | Ekip görünümü | ✓ | ✓ | Rapor | Süreli destek |
| Standart rapor | Kendi | Sınıfı | Ekibi | ✓ | Uyum kapsamı | ✓ | Süreli destek |
| Özel rapor/export |  | Sınırlı | Sınırlı | Yetkiye bağlı | Yetkiye bağlı | ✓ | Süreli destek |
| Tenant ayarı/kullanıcı/rol |  |  |  | Control Center bağı |  |  | HQ bağı |

## Ayrı tutulacak kavramlar

- `role preview`: arayüz önizlemesi; izin vermez.
- `delegation`: tarihli ve kapsamlı vekâlet; kalıcı rol değildir.
- `support session`: kullanıcı onayı/gerekçe/süre/audit gerektirir.
- `report scope`: rapor alanı ve satır kapsamı; operasyon rolü kazandırmaz.
- `instructor assignment`: yalnızca belirli kurs/oturum/değerlendirme kapsamıdır.
- `manager relationship`: zaman aralıklı organizasyon ilişkisidir; geçmiş/geçersiz ekip erişimi vermez.

