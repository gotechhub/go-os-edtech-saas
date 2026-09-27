# V3 Supabase veri katmanı

Bu klasör Respongo OS V3 için temiz migration zinciridir. V1/V2 tablolarına veya Oguz Law Academy verisine bağımlı değildir.

## İlk migration

[`202609270001_v3_platform_foundation.sql`](migrations/202609270001_v3_platform_foundation.sql) şu temeli kurar:

- tenant ve portal;
- üyelik, tarihli rol ve sabit izin kimlikleri;
- ürün sürüm durumu ve tenant entitlement (hak) kaydı;
- tenant başına tek 14 günlük müşteri denemesi;
- iç demo ile müşteri denemesinin ayrımı;
- HQ operatör hesabı ve süreli destek oturumu tabanı;
- değişmez audit olayı;
- RLS, iki tenant izolasyonu ve ürün erişim fonksiyonları.

## GOLMS öğrenme çekirdeği

[`202609270002_v3_golms_learning_core.sql`](migrations/202609270002_v3_golms_learning_core.sql) içerik ve programın değişmez sürümlerini, güvenli SCORM paket kanıtını, bireysel atama/kayıt, girişim, ham runtime olayı ve program raporunu kurar. Yönetim ve öğrenen komutları ürün hakkı, tenant, rol ve deneme yazma kapısını veritabanında yeniden doğrular. Doğrudan tablo yazma yetkisi istemci rollerine verilmez.

[`202609270003_v3_golms_read_models.sql`](migrations/202609270003_v3_golms_read_models.sql) admin program listesi ve öğrenenin kendi atamaları için rol kapsamlı, tenant kontrollü okuma modellerini sağlar. Web ve mobil istemci tablo birleştirme kurallarını tekrar yazmaz.

## Mevcut doğrulama düzeyi — 2026-09-27

- Üç migration yeni V3 hosted Supabase projesine uygulanmış; `migration list` çıktısında `202609270001`, `202609270002` ve `202609270003` yerel/uzak olarak eşleşmiştir.
- İki müşteri tenantı, iç demo, owner, learner, outsider ve MFA'lı HQ operatör senaryoları test edilir.
- GOLMS için oluşturma, tarama kanıtı, yayın, program, atama, öğrenci başlatma, tamamlama ve rapor zinciri yerel PostgreSQL uyum testinden geçer.
- Yayın değişmezliği, tekrar/sıra dışı olay, tenant RLS ve deneme sonrası runtime yazma negatif testleri bulunur.
- Deneme sonrasında yetkili okuma açık, ürün yazması kapalıdır.
- Hosted şema kurulumu doğrulanmıştır. Gerçek Auth kullanıcılarıyla iki tenant RLS negatif testi, Supabase advisor/lint ve yedek/geri yükleme provası henüz yayın kabul kanıtı değildir ve sonraki güvenlik kapısında tamamlanacaktır.

## Yayın ve geri dönüş

İlk hosted uygulamadan önce yeni V3 Supabase projesi, yedek ve migration checksum kaydı oluşturulur. Foundation migration veri taşımadığı için beta öncesi geri dönüş yöntemi yeni boş proje/snapshot'a dönmek ve migration'ı kaldırmaktır. Müşteri verisi oluştuktan sonra tablo silen otomatik `down` migration kullanılmaz; ileri yönlü düzeltme ve doğrulanmış point-in-time restore uygulanır.

Hosted geçiş kapısı:

1. staging projesinde migration;
2. Supabase lint/advisor ve RLS negatif testleri;
3. API/BFF komutlarının deneme-yazma kapısı;
4. secret ve service-role kullanım denetimi;
5. yedek/geri yükleme provası;
6. tarihli migration, test ve rollout kanıtı.
