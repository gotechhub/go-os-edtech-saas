# Respongo OS Core · sistem işletim konsolu · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| CORE-01 | F1 | İç operatör kimliği ve ayrıcalıklı erişim | 1/3 |
| CORE-02 | F1 | Sistem komuta merkezi | 1/3 |
| CORE-03 | F1 | Tenant ve portal teknik envanteri | 1/3 |
| CORE-04 | F1 | Sürüm, migration ve özellik bayrağı | 1/3 |
| CORE-05 | F1 | İş kuyruğu ve entegrasyon operasyonu | 1/3 |
| CORE-06 | F1 | Güvenlik, audit ve olay müdahalesi | 1/3 |
| CORE-07 | F1 | Depolama, bölge ve altyapı kontrolü | 1/3 |
| CORE-08 | F1 | Ana kataloglar ve paket yönetimi | 1/3 |
| CORE-09 | F1 | Sağlayıcı, maliyet ve kullanım kontrolü | 1/3 |
| CORE-10 | F1 | Veri yönetişimi ve felaket kurtarma | 1/3 |

## CORE-01 · İç operatör kimliği ve ayrıcalıklı erişim

Faz: **F1**. Alt modüller: İç operatör hesabı ve MFA; Görev ayrılığı; Süreli destek oturumu; Break-glass ve audit.

**Kabul senaryosu:** Müşteri rolü Core'a erişemez; ayrıcalıklı işlem gerekçe, süre ve aktör kanıtıyla tamamlanır.

## CORE-02 · Sistem komuta merkezi

Faz: **F1**. Alt modüller: Küresel sağlık ve SLO; Kritik olay ve alarm; Bölge/servis durumu; Sıradaki operasyon işi.

**Kabul senaryosu:** Operatör sistem durumunu tek ekranda görür; bozuk veya eski veri canlı gibi gösterilmez.

## CORE-03 · Tenant ve portal teknik envanteri

Faz: **F1**. Alt modüller: Tenant/portal teknik kimliği; Ortam ve bölge; Şema/sürüm/özellik görünümü; Salt okunur ilişki haritası.

**Kabul senaryosu:** Operatör her portalın teknik durumunu görür; müşteri verisine destek oturumu olmadan girmez.

## CORE-04 · Sürüm, migration ve özellik bayrağı

Faz: **F1**. Alt modüller: Web/API/DB sürüm matrisi; Migration ve rollback; Pilot/kademeli rollout; Kill switch.

**Kabul senaryosu:** Sürüm önce pilot kapsamda açılır; sağlık gerilerse tenant verisini bozmadan geri alınır.

## CORE-05 · İş kuyruğu ve entegrasyon operasyonu

Faz: **F1**. Alt modüller: Worker ve job sağlığı; Retry/dead-letter; Webhook ve bağlayıcı izleme; Idempotent yeniden oynatma.

**Kabul senaryosu:** Hatalı iş güvenle yeniden çalışır; tekrar kayıt üretmez ve tenant kapsamını aşmaz.

## CORE-06 · Güvenlik, audit ve olay müdahalesi

Faz: **F1**. Alt modüller: Küresel güvenlik olayları; Audit arama; Oturum/anahtar iptali; Olay müdahale runbook'u.

**Kabul senaryosu:** Yetkili güvenlik operatörü olayı kanıtıyla sınırlar; müdahale değişmez audit kaydı üretir.

## CORE-07 · Depolama, bölge ve altyapı kontrolü

Faz: **F1**. Alt modüller: Supabase/Vercel/S3 envanteri; Bucket ve CloudFront sağlığı; Kota/kapasite; AWS geçiş hazırlığı.

**Kabul senaryosu:** Yanlış yapılandırılmış veya açık depolama aktif tenant kullanımına alınmaz.

## CORE-08 · Ana kataloglar ve paket yönetimi

Faz: **F1**. Alt modüller: Dil ve mesaj paketleri; Sektör başlangıç paketleri; Marka/e-posta/sertifika şablonları; Sürüm ve dağıtım.

**Kabul senaryosu:** Yeni ana paket kontrollü yayımlanır; tenant özelleştirmesini ve başka portalı bozmaz.

## CORE-09 · Sağlayıcı, maliyet ve kullanım kontrolü

Faz: **F1**. Alt modüller: AI/iletişim/entegrasyon sağlayıcıları; Secret referansı ve sağlık; Platform maliyeti; Kota ve anomali.

**Kabul senaryosu:** Secret istemciye çıkmaz; maliyet ve sağlayıcı değişikliği yetki, sürüm ve audit ile uygulanır.

## CORE-10 · Veri yönetişimi ve felaket kurtarma

Faz: **F1**. Alt modüller: Saklama/silme/legal hold; Yedek ve geri yükleme; RPO/RTO; Veri taşınabilirliği.

**Kabul senaryosu:** Geri yükleme tatbikatı ölçülür; tenant verisi hukukî tutma ve silme kurallarıyla çelişmez.
