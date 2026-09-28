# Respongo OS arka plan worker'ı

Bu servis uzun süren, yeniden denenebilir ve istemci isteğinden bağımsız işleri yürütür. İlk akış temiz tarama sonucu alan GOLMS SCORM ZIP paketinin güvenlik ve manifest analizidir.

Sınırlar:

- Worker yalnız `service_role` ile açılan dar veritabanı fonksiyonlarını çağırır; kullanıcı oturumu veya tarayıcı AWS anahtarı kullanmaz.
- S3 nesnesi geçici dosyaya indirilir; kaydedilmiş boyut ve SHA-256 ile eşleşmeden analiz edilmez.
- Geçersiz paket terminal `rejected`, geçici altyapı sorunu yeniden denenebilir `failed` olur.
- Analiz sonucu paketi yayınlamaz ve GOLMS öğrenme nesnesine otomatik bağlamaz.
- Geçici dosya başarı ve hata durumunda temizlenir.

Doğrulanmış asset bir GOLMS eğitim sürümüne bağlandığında ayrı `scorm_publication` işi açılır. Yayın worker'ı ZIP'i yeniden doğrular, özel geçici dizine güvenli açar, manifest launch yolunun değişmediğini kontrol eder ve yalnız değişmez `published/.../versions/.../` prefix'ine aktarır. Veritabanı tam dosya sayısı ve launch object key eşleşmeden yayını `ready` yapmaz.

Veri sözleşmesi `202609280001_v3_scorm_ingestion_jobs.sql` ve `202609280002_v3_golms_scorm_asset_bridge.sql`; paket güvenliği `standards/scorm` tarafından yönetilir.
