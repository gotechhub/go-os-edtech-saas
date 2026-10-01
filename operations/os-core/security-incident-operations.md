# CORE-06 · güvenlik, audit ve olay müdahalesi

**Durum:** Yerel uygulama doğrulandı. Hosted migration, gerçek MFA ve gerçek sağlayıcı iptal tatbikatı yapılmadı.

## Sinyal ve olay sınırı

- Sağlayıcı sinyalleri yalnız service-role ile, provider olay kimliği üzerinden idempotent kaydedilir.
- Sinyal kaydı kişisel veri veya ham log taşımaz; kaynak, sinyal sınıfı, önem, özet kodu ve isteğe bağlı kanıt SHA-256 özeti taşır.
- Olay yalnız AAL2 MFA ve `core.security.manage` izniyle açılır. Aynı sinyal ikinci olay üretmez.
- Runbook sırası `triage → contain → eradicate/recover → close` kurallarıyla sunucu tarafında doğrulanır.
- Kanıt içeriği veritabanına alınmaz. Değişmez referans, tür ve SHA-256 özeti olaya bağlanır.

## Audit ve iptal sınırı

- `v3_audit.events` güncelleme ve silmeye kapalı append-only (yalnız eklenen) kaynaktır.
- Core audit araması en fazla 200 kayıt verir; gerekçe ve payload döndürmez. Tenant ve işlem önekiyle daraltılabilir.
- Oturum, API anahtarı veya provider secret sürümü iptali tam hedef referansına bağlı, kısa ömürlü iki kişi onayı ister.
- İptal işi tenant ve olay kapsamını istemciden türetmez; aktif olay kaydıyla eşleştirir.
- Gerçek sağlayıcı çağrısı service-role lease worker'ında yürür. Worker sonucu yalnız kararlı hata koduyla kaydeder; provider hata gövdesini audit'e yazmaz.

## Açık kabul ve bağımlılıklar

- Hosted Supabase'te iki gerçek güvenlik operatörü, AAL2, sinyal kaynağı ve append-only tetikleyici doğrulanacaktır.
- Supabase Auth oturum iptali ve secret-manager sürüm devre dışı bırakma adapterleri CORE-09 sağlayıcı yönetimiyle bağlanıp tatbik edilecektir.
- Kanıt nesneleri CORE-07 özel depolama politikasıyla saklanacak; bu modül yalnız referans ve checksum tutar.
