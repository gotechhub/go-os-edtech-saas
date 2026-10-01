# CORE-05 · iş kuyruğu operasyon sözleşmesi

**Durum:** Yerel ilk uygulama dilimi. Hosted Supabase migration ve gerçek operatör MFA kabulü yapılmadı.

## Uygulanan güvenlik sınırı

- `v3_core_job_overview`, yalnız AAL2 MFA ve `core.read` izni olan Respongo OS Core operatörüne operasyon metadatası verir.
- Görünüm iş payload'ı, dosya adı/yolu, S3 anahtarı, sonuç JSON'u ve worker kimliğini döndürmez.
- Başarısız veya lease süresi dolmuş bir iş yalnız `core.jobs.manage`, farklı bir güvenlik operatörünün onayı ve tam `processing_job` kimliği kapsamıyla yeniden kuyruğa alınır.
- Aynı operatör ve idempotency anahtarı aynı operasyonu döndürür. Aynı anahtar başka bir işe taşınamaz.
- Yeniden çalışma eski durum, deneme sayısı ve hata sınıfını ayrı operasyon kaydında korur; tenant kimliği iş kaydından alınır ve istemci tarafından değiştirilemez.
- `rejected` işler otomatik tekrar çalıştırılmaz. İçerik veya hak doğrulaması düzeltilmeden operasyon komutu verilemez.

## Açık kapsam

- Genel webhook ve bağlayıcı teslim sözleşmesi, dead-letter karantina/iptal komutları ve canlı worker sağlayıcı health probe'u henüz uygulanmadı.
- Bu açıklar tamamlanmadan CORE-05 uygulama kapısı `verified` yapılamaz.
- Hosted kabulte iki tenant, gerçek AAL2 oturum, süresi dolan lease, tekrar istek ve worker tüketimi birlikte doğrulanacaktır.
