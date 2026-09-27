# S3 depolama ve varlık mimarisi

Bu belge Respongo OS V3'te ikili dosyanın (binary) sahibi, yaşam döngüsü ve erişim sözleşmesidir. Uygulama kodu, migration ve testler teknik gerçektir; bu belge sınırları açıklar.

## Sahiplik ve yerleşim

| Katman | Sorumluluk |
|---|---|
| GitHub | Kod, manifest, küçük kaynak SVG'leri ve altyapı tanımı; müşteri dosyası ve sır içermez |
| Vercel | Web/API, yetki kararı ve kısa süreli S3 imzası; büyük dosyayı kendi üzerinden taşımaz |
| Supabase | Tenant, rol, ürün hakkı, varlık metadata'sı, tarama/yayın durumu ve audit |
| S3 | Özel ham dosya, karantina, yayımlanmış değişmez sürüm, türev ve dışa aktarım |
| CloudFront | Yalnız yayımlanmış medya/SCORM için özel S3 origin ve kontrollü teslim |

Ortak sistem bucket'ı `system/brand`, `system/industry-packs`, `system/locales`, `system/templates` ve `system/assets` prefix'lerini taşır. Her tenant için adı müşteri verisi içermeyen ayrı bucket oluşturulur. Deneme ve ücretli kullanım aynı bucket'ı kullanır; deneme bitişi veri silmez, platform yazma kapısı yeni yüklemeyi reddeder.

Tenant bucket anahtarları:

```text
quarantine/{upload-id}/payload.ext
published/{product}/{resource}/{resource-id}/versions/{version-id}/file.ext
derived/{product}/{resource-id}/{version-id}/...
deliverables/gofactory/{project-id}/{version-id}/...
exports/{product}/{export-id}/...
```

Bucket adı `prefix + ortam + bölge + SHA-256(tenant-id)` ile üretilir. Tenant adı, kullanıcı adı, e-posta veya portal slug'ı kullanılmaz.

## Güvenlik sözleşmesi

- Vercel yalnız proje ve ortama sabitlenmiş OIDC IAM rolüyle geçici kimlik alır. Kalıcı AWS anahtarı uygulama ortamına veya repoya yazılmaz.
- Uygulama rolü nesne imzalama ve sınırlı `HeadObject/GetObject/PutObject` işlemleriyle; HQ provisioning rolü bucket oluşturma ve güvenlik ayarıyla ayrılır.
- Tüm bucket'larda Block Public Access, Bucket Owner Enforced, TLS zorunluluğu, varsayılan şifreleme ve Versioning bulunur. `v3_storage.locations` kaydı bu kontroller doğrulanmadan `active` olamaz.
- İstemci bucket listeleyemez. API tenant, gerçek üyelik, ürün hakkı, işlem yetkisi, deneme yazma durumu, MIME, boyut ve SHA-256 kontrolünden sonra en fazla 15 dakikalık imza verir; varsayılan beş dakikadır.
- Tamamlama çağrısı S3 boyut, checksum ve S3 VersionId değerini beklenen kayıtla eşleştirir. Dosya karantinada kalır. Tarama ve ürün doğrulaması tamamlanmadan `published` durumu oluşmaz.
- SCORM açılımı worker içinde path traversal, sembolik bağ, dosya sayısı, açılmış toplam boyut, sıkıştırma oranı, gerçek MIME, manifest ve zararlı içerik kontrollerinden geçer. Çalıştırma ayrı origin/CSP ile yapılır.
- Tarama olayları `provider + provider_event_id` ile idempotent işlenir. Zararlı/bozuk dosya yayınlanmaz; kullanıcıya ham tarama ayrıntısı veya nesne anahtarı verilmez.

## API akışı

1. `POST /api/v1/platform/assets/upload-intents` metadata'yı doğrular, DB'de idempotent intent açar ve imzalı `PUT` döndürür.
2. Tarayıcı dosyayı doğrudan özel tenant bucket'ındaki karantinaya yükler.
3. `POST /api/v1/platform/assets/{assetId}/complete` S3 metadata'sını doğrular ve tarama kuyruğu için kayıt hazırlar.
4. Worker tarama/format/hak kontrolünü tamamlar, temiz içeriği değişmez yayın anahtarına kopyalar ve audit olayı üretir.
5. `GET /api/v1/platform/assets/{assetId}/download` yalnız temiz ve yayımlanmış sürüm için kısa ömürlü URL üretir.

İlk API amacı `golms-learning-content` ile sınırlandırılmıştır. Learner görev kanıtı, GOAUTHOR kaynakları ve GOFACTORY teslimleri kendi ürün/hizmet yetki sözleşmeleri tamamlanmadan bu genel uç noktadan açılamaz.

## Saklama ve geri dönüş

Eksik multipart yüklemeleri ve reddedilmiş karantina nesneleri sözleşmeye bağlı kısa süre sonra temizlenebilir. Yayımlanmış sürümler, teslimler ve rapor dışa aktarımları KVKK/GDPR, hukuki tutma ve içerik lisansına göre ayrı politikaya tabidir. Bucket lifecycle hiçbir zaman 14 günlük deneme bitişini veri silme sinyali olarak kullanmaz.

Canlı kabul için iki tenant negatif erişim testi, süresi dolmuş deneme, rol kapsamı, imza süresi, replay, checksum farkı, tarama bekleyen/zararlı dosya, bucket idempotency ve CloudFront origin izolasyonu kanıtlanır.
