# Respongo OS arka plan worker'ı

Bu servis uzun süren, yeniden denenebilir ve istemci isteğinden bağımsız işleri yürütür. İlk akış temiz tarama sonucu alan GOLMS SCORM ZIP paketinin güvenlik ve manifest analizidir.

Sınırlar:

- Worker yalnız `service_role` ile açılan dar veritabanı fonksiyonlarını çağırır; kullanıcı oturumu veya tarayıcı AWS anahtarı kullanmaz.
- S3 nesnesi geçici dosyaya indirilir; kaydedilmiş boyut ve SHA-256 ile eşleşmeden analiz edilmez.
- Geçersiz paket terminal `rejected`, geçici altyapı sorunu yeniden denenebilir `failed` olur.
- Analiz sonucu paketi yayınlamaz ve GOLMS öğrenme nesnesine otomatik bağlamaz.
- Geçici dosya başarı ve hata durumunda temizlenir.

Veri sözleşmesi `202609280001_v3_scorm_ingestion_jobs.sql`, paket güvenliği `standards/scorm` tarafından yönetilir.
