# GOLMS · uygulama durumu

**Tarih:** 2026-09-27 · **Durum:** İlk öğrenme dikey dilimi hosted Supabase ve Vercel üzerinde ayağa kalktı; gerçek kullanıcı kabulü yapılmadı.

## Uygulanan ilk dilim

`Eğitim nesnesi → değişmez içerik sürümü → değişmez program sürümü → bireysel atama → kayıt → SCORM girişimi → ham olay kanıtı → normalize sonuç → program raporu`

- SCORM paketinin `clean` tarama ve `valid` manifest sonucu olmadan yayınlanması engellenir.
- Yayınlanan içerik ve program sürümü sonradan değiştirilmez; yeni değişiklik yeni sürüm oluşturur.
- Program adımları tenant, içerik türü, sıra ve yayın durumu ile doğrulanır.
- Bireysel atama yalnızca aynı tenant içindeki aktif üyeye yapılır.
- Tamamlanma, başarı, puan, ilerleme ve süre birbirinden ayrı gerçeklerdir.
- Her çalışma zamanı olayı sıra, idempotency anahtarı, ham kanıt özeti ve normalizasyon kuralı sürümü taşır.
- Tekrar gelen olay ikinci kez işlenmez; sırası bozuk veya zamanı geriye giden olay reddedilir.
- Öğrenci yalnızca kendi kayıt ve girişimini görür; rapor izni ayrı değerlendirilir.
- 14 günlük deneme bittiğinde öğrenme olayı dâhil bütün yazmalar veritabanında durur; yetkili rapor okuması korunur.

## Kod ve veri sınırı

- Alan kodu: [`src/domain`](src/domain)
- Alan testleri: [`tests/learning-flow.test.ts`](tests/learning-flow.test.ts)
- PostgreSQL/RLS testi: [`tests/golms-db.test.ts`](tests/golms-db.test.ts)
- Migration: [`../../supabase/migrations/202609270002_v3_golms_learning_core.sql`](../../supabase/migrations/202609270002_v3_golms_learning_core.sql)
- Application/BFF sözleşmesi: [`src/application`](src/application)
- Rol kapsamlı listeler: [`../../supabase/migrations/202609270003_v3_golms_read_models.sql`](../../supabase/migrations/202609270003_v3_golms_read_models.sql)
- V3 web rotaları: [`../../apps/web/src/app`](../../apps/web/src/app)
- Program taslak formu: [`../../apps/web/src/components/program-draft-form.tsx`](../../apps/web/src/components/program-draft-form.tsx)
- Hosted durum: üç migration uzak geçmişle eşleşir; production sayfaları `200`, oturumsuz program API isteği `401` döndürür.

## Henüz tamamlanmayan kapsam

- S3 imzalı ZIP yükleme, antivirüs işi, manifest ayrıştırıcı ve güvenli player kabuğu.
- Ekip/rol/dinamik kural ataması, aday gösterme, onay ve bekleme listesi.
- SCORM sequencing, xAPI, cmi5 ve LTI 1.3 adaptörleri.
- Program taslağı formu BFF komutuna bağlıdır; adım düzenleyici, yayın, atama, öğrenci player ve mobil yüzey henüz tamamlanmadı.
- Hosted Supabase güvenlik danışmanı, gerçek Auth kullanıcılarıyla tenant/RLS negatif testi, gerçek SCORM paketi ve rol bazlı uçtan uca kabul.

Bu nedenle LMS-01–04 uygulama kapıları **active** kalır; `verified` değildir.
