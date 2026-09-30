# Dosya, medya ve S3 varlık platformu · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| STOR-01 | F1 | Tenant bucket provisioning ve envanter | 1/3 |
| STOR-02 | F1 | Upload intent ve karantina | 2/3 |
| STOR-03 | F2 | Tarama, validasyon ve değişmez yayın | 2/3 |
| STOR-04 | F2 | Yetkili indirme ve CloudFront teslimi | 1/3 |
| STOR-05 | F1 | Sistem asset manifesti ve aktarım aracı | 2/3 |
| STOR-06 | F6 | Saklama, yaşam döngüsü ve BYOS hazırlığı | 0/3 |

## STOR-01 · Tenant bucket provisioning ve envanter

Faz: **F1**. Alt modüller: İsimsiz tenant bucket kimliği; Idempotent portal provisioning; Versioning/şifreleme/public block kontrolü; Kota ve eşik alarmı.

**Kabul senaryosu:** Aynı tenant için tekrar çalışan iş ikinci bucket üretmez; güvenlik kontrolleri geçmeden lokasyon aktif olmaz.

## STOR-02 · Upload intent ve karantina

Faz: **F1**. Alt modüller: Rol/ürün/deneme/kota kapısı; MIME/boyut/SHA-256 doğrulama; Kısa ömürlü imzalı PUT; Multipart ve replay kontrolü.

**Kabul senaryosu:** Yetkili kullanıcı doğrudan özel S3'e yükler; yanlış tenant, süre, tip, boyut ve tekrar isteği güvenli sonuçlanır.

## STOR-03 · Tarama, validasyon ve değişmez yayın

Faz: **F2**. Alt modüller: Malware olayı; SCORM ZIP güvenliği; Hak/manifest doğrulama; Immutable yayın sürümü.

**Kabul senaryosu:** Tarama bekleyen, zararlı, zip-bomb veya geçersiz paket yayımlanmaz; yinelenen tarama olayı ikinci sürüm oluşturmaz.

## STOR-04 · Yetkili indirme ve CloudFront teslimi

Faz: **F2**. Alt modüller: Kısa ömürlü imzalı GET; Özel S3 origin; SCORM ayrı origin/CSP; Audit ve geri çekme.

**Kabul senaryosu:** Yalnız temiz, yayımlanmış ve yetkili sürüm açılır; başka tenant ve geri çekilmiş sürüm teslim edilmez.

## STOR-05 · Sistem asset manifesti ve aktarım aracı

Faz: **F1**. Alt modüller: Manifest allowlist; Dry-run varsayılanı; Checksum raporu; Silmesiz geçici oturum aktarımı.

**Kabul senaryosu:** Yalnız manifestteki sistem dosyaları geçici AWS oturumuyla aktarılır; müşteri dosyası ve sır Git'e girmez.

## STOR-06 · Saklama, yaşam döngüsü ve BYOS hazırlığı

Faz: **F6**. Alt modüller: Karantina/multipart temizliği; KVKK/GDPR/hukukî tutma; Deneme sonrası salt okunur; Cross-account role/external ID BYOS.

**Kabul senaryosu:** Deneme bitişi veriyi silmez; saklama ve BYOS erişimi tenant, sözleşme ve audit sınırında uygulanır.
