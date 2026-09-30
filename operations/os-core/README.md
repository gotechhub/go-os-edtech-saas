# Respongo OS Core · sistem işletim konsolu

**Yalnızca Respongo'nun teknik ve güvenlik operasyon ekibi içindir.** Müşteri yöneticisi, tenant rolü veya rol önizlemesi bu alana erişim sağlamaz. OS Core; sistem sağlığı, sürüm, migration, iş kuyruğu, entegrasyon çalışma durumu, güvenlik olayı, altyapı, sağlayıcı, maliyet, ana paket ve felaket kurtarma komutlarının sahibidir.

## Super Admin'den farkı

- **OS Core:** platformun nasıl çalıştığını ve güvenli kaldığını yönetir.
- **Super Admin (Respongo HQ):** hangi müşterinin, portalın, ürünün, lisansın, demo ve destek sürecinin yönetileceğini belirler.
- **Control Center:** müşterinin yalnız kendi kuruluşunu ve satın aldığı ürünleri yönettiği alandır.

Super Admin teknik bir talep oluşturabilir veya tenant kapsamlı rollout isteyebilir; migration, feature flag, provider secret, altyapı ve güvenlik müdahalesini doğrudan çalıştıramaz. Bu komutlar OS Core'da görev ayrılığı, MFA, gerekçe, süre ve değişmez audit kaydıyla yürür.

## Ana ekran aileleri

1. Sistem komuta merkezi ve hizmet seviyesi görünümü.
2. Tenant/portal teknik envanteri ve sürüm matrisi.
3. Migration, özellik bayrağı, pilot yayın ve geri alma.
4. Worker, job, dead-letter, webhook ve entegrasyon operasyonu.
5. Güvenlik, audit, oturum/anahtar iptali ve olay müdahalesi.
6. Supabase, Vercel, S3, CloudFront, bölge ve kapasite görünümü.
7. Ana dil, sektör, marka, e-posta ve sertifika paketlerinin teknik yayını.
8. AI/iletişim/entegrasyon sağlayıcısı, secret referansı, maliyet ve kota.
9. Veri saklama, silme, yedek, geri yükleme, RPO/RTO ve taşınabilirlik.

Her komut `loading`, `success`, `partial`, `stale`, `error`, `forbidden` ve `approval_required` durumlarını destekler. Canlı olmayan veri açıkça işaretlenir. Modül ve kanıt durumu [takip kaynağından](../../project-tracker.json) üretilen [modül dökümünde](modules.md) tutulur.
