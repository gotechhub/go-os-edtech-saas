# CORE-07 · depolama, bölge ve altyapı kontrolü

**Durum:** Yerel uygulama doğrulandı. Hosted provider gözlemleri, OIDC rolü ve gerçek altyapı komutu tatbikatı yapılmadı.

## Kaynak ve gözlem modeli

- Vercel, Supabase ve AWS kaynakları tenant, ortam, bölge ve değişmez provider referansıyla kaydedilir; credential veya secret değeri tutulmaz.
- Sağlık gözlemi yalnız service-role tarafından provider olay kimliğiyle idempotent kaydedilir.
- Her görünüm gözlem zamanı ve `live/stale/unknown` tazeliği taşır. Gözlemi olmayan kaynak sağlıklı sayılmaz.
- S3 için versioning, Block Public Access, Bucket Owner Enforced ve encryption; CloudFront için private origin ayrı kontrol alanlarıdır.
- Kullanım, kota ve nesne sayısı ölçülür; kapasite oranı ölçüm olmayan kaynağa uydurulmaz.

## Fail-closed depolama

- Güvensiz S3 gözlemi tenant storage location durumunu `write_suspended` yapar.
- Upload intent eklenmeden önce aktif, yeni gözlenmiş, sürümlü, public erişimi kapalı, sahipliği zorlanmış ve şifreli location veritabanı tetikleyicisinde doğrulanır.
- Storage tekrar ancak son 15 dakikada alınmış temiz gözlem, `core.storage.manage`, farklı güvenlik operatörü onayı ve tam location kapsamıyla aktif olur.

## Komut ve geçiş hazırlığı

- Provisioning, policy remediation, CDN invalidation ve capacity expansion komutları iki kişi onaylı, lease tabanlı ve idempotent iş olarak yürür.
- Provider worker hata gövdesini saklamaz; yalnız kararlı hata sınıfını audit zincirine ekler.
- AWS geçiş hazırlığı; veritabanı restore, Auth kimlik eşleme, obje checksum, kuyruk replay, DNS rollback ve veri bölgesi kontrollerini kanıt referansı ve SHA-256 ile izler.

## Açık kabul

- Hosted kabulte gerçek Vercel/Supabase/S3/CloudFront gözlemleri, yanlış bucket politikasıyla yazma reddi, güvenli düzeltme ve gerçek provider komutu birlikte tatbik edilecektir.
- Sohbette daha önce paylaşılan AWS anahtarı kullanılmayacak; Vercel OIDC rolü doğrulanmadan canlı provider komutu açılmayacaktır.
