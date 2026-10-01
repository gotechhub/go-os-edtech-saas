# CORE-05 · iş kuyruğu operasyon sözleşmesi

**Durum:** Yerel uygulama doğrulandı. Hosted Supabase migration ve gerçek operatör MFA kabulü yapılmadı.

## Uygulanan güvenlik sınırı

- `v3_core_job_overview`, yalnız AAL2 MFA ve `core.read` izni olan Respongo OS Core operatörüne operasyon metadatası verir.
- Görünüm iş payload'ı, dosya adı/yolu, S3 anahtarı, sonuç JSON'u ve worker kimliğini döndürmez.
- Başarısız veya lease süresi dolmuş bir iş yalnız `core.jobs.manage`, farklı bir güvenlik operatörünün onayı ve tam `processing_job` kimliği kapsamıyla yeniden kuyruğa alınır.
- Aynı operatör ve idempotency anahtarı aynı operasyonu döndürür. Aynı anahtar başka bir işe taşınamaz.
- Yeniden çalışma eski durum, deneme sayısı ve hata sınıfını ayrı operasyon kaydında korur; tenant kimliği iş kaydından alınır ve istemci tarafından değiştirilemez.
- `rejected` işler otomatik tekrar çalıştırılmaz. İçerik veya hak doğrulaması düzeltilmeden operasyon komutu verilemez.
- Worker heartbeat'i iki dakikadan eskiyse `stale` olur; eksik worker kaydı sağlıklı sayılmaz.
- Sağlayıcıdan bağımsız outbox olayı ve teslim kaydı tenant kapsamında tutulur. Worker aynı olay anahtarıyla ikinci teslim üretmez; lease, sınırlı retry ve dead-letter uygular.
- Connector payload'ı, hedef referansı ve secret referansı yalnız service-role worker claim'inde bulunur. OS Core görünümü bunları dönmez.
- HTTP worker yalnız HTTPS hedefi kabul eder, URL içi kullanıcı/parolayı ve redirect takibini reddeder; sabit event kimliğini sonraki denemelerde korur.

## Açık kabul ve bağımlılıklar

- Hosted kabulte iki tenant, gerçek AAL2 oturum, süresi dolan lease, tekrar istek, worker heartbeat ve gerçek teslim tüketimi birlikte doğrulanacaktır.
- Gerçek sağlayıcı endpoint/secret resolver'ı CORE-09 sağlayıcı ve secret yönetişimi kapsamında bağlanacaktır; bu bağımlılık secret'ı CORE-05 tablosuna taşımaz.
