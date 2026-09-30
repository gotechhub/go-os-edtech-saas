# Rol bazlı ekran ve görev envanteri

| Rol | Ana sayfanın ilk sorusu | Kritik işler | Mobil öncelik |
|---|---|---|---|
| Öğrenen | “Şimdi neyi bitirmeliyim, sonra ne öğreneyim?” | Devam et, atanmış/geciken, keşif, yolculuk, canlı oturum, sertifika/rozet, profil/destek | 1 elle devam etme, indirme/çevrimdışı durum, push |
| Tenant/L&D admini | “Bugün ne riskli ve neyi onaylamalıyım?” | Kullanıcı/ekip, içerik ihtiyacı, program-atama, uyum, rapor, marka, entegrasyon, destek | İş kuyruğu, kritik onay ve rapor özeti |
| Eğitmen | “Yaklaşan oturum ve bekleyen değerlendirmem ne?” | Oturum, katılım, soru/görev puanlama, içerik güncelleme, sınıf ilerlemesi | Oturum listesi, hızlı değerlendirme |
| Hat yöneticisi | “Ekibimde kim gecikiyor, hangi beceri açığı var?” | Ekip eğitimi, hedef, onay, 1:1, gelişim önerisi ve geri bildirim | Risk listesi, onay, kısa yorum |
| Respongo Super Admin | “Hangi müşteri, portal veya destek işi müdahale istiyor?” | Aday CRM, portal fabrikası, demo/deneme, lisans, sektör paketi, destek SLA, müşteri rollout | Müşteri riski, destek triage, güvenli mobil görüntü |
| Respongo OS Core operatörü | “Hangi sistem, sürüm, kuyruk veya güvenlik olayı müdahale istiyor?” | Sistem sağlığı, migration, feature flag, job, entegrasyon, güvenlik, altyapı, provider ve maliyet | Kritik alarm ve salt okunur sağlık; ayrıcalıklı komut masaüstü/step-up ister |

Müşteri sahibi/yönetici, tenant admini üzerindeki sözleşme/ürün hakkı ayarlarına ek yetkiye sahip olabilir. Ürün katkıcı/inceleyicileri, satın alma ve performans değerlendiricileri rol matrisiyle ayrıca tanımlanır.

**Ekran aileleri:** giriş/davet/MFA/KVKK; onboarding; rol dashboardu; profil/tercih; ürün başlatıcı; program/eğitim/atama/öğrenme oynatıcı; katalog/inceleme/lisans; yolculuk/beceri/topluluk; yazarlık editörü; GOFACTORY talep/proje/onay/teslim; hedef/değerlendirme; rapor/özel sorgu/otomatik gönderim; bildirim/destek; tema/asset stüdyosu; Super Admin CRM/portal filosu; OS Core sistem operasyonu.

Her aile `loading` (yükleniyor), `loaded`, `empty`, `filtered_empty`, `error`, `forbidden`, `offline`, `stale` (veri eski) durumlarını, gerçek URL'yi, klavye/ekran okuyucu akışını ve yetkisiz davranışı tanımlar. Dashboard “canlı” etiketi ancak veri tazeliği ölçüldüğünde görünür.

Her rolün ilk girişinde tenantın varsayılan dili; sonrasında kendi etkin dil tercihi kullanılır. Control Center'da yönetici “Dil ve Etiketler” işini bulur; önizleme taslağı son kullanıcıya sızmaz. Giriş, atama, rapor, destek ve onay akışları on hedef dil için kontrol edilir; Arapçada gezinme yönü/ikon/tablolar ayrıca sınanır.
