# Respongo OS Core · modül sözleşmeleri

**Doğrulama tarihi:** 2026-10-01. Bu belge CORE-02–CORE-10 için tanım kapısıdır; çalışan uygulama veya hosted kabul kanıtı değildir.

## Ortak çalışma sözleşmesi

- Yalnız gerçek `v3_core` operatörü, etkin süreli rol ve AAL2 MFA ile erişir. Super Admin ve tenant üyelikleri Core hakkı üretmez.
- Okuma modeli `observed_at`, `source`, `freshness` (`live`, `cached`, `stale`, `unknown`) ve hata kapsamı taşır. Eski veya eksik veri canlı gösterilmez.
- Yazma komutu izin, gerekçe, hedef, idempotency anahtarı ve korelasyon kimliği ister. Yüksek riskli komut farklı güvenlik operatörü onaylı tek kullanımlık bilet veya audit kayıtlı break-glass oturumu ister.
- Secret değeri, müşteri belge içeriği ve kişisel veri Core listesinin parçası olmaz. Operatör yalnız referans, sağlık, sürüm ve yetkili metadata görür.
- Her modül `loading`, `ready`, `partial`, `stale`, `empty`, `error`, `forbidden` ve `approval_required` durumlarını destekler.

## CORE-02 · Sistem komuta merkezi

- **Sahip:** OS Core platform operasyonu. Kaynaklar: Vercel, Supabase, worker, S3/CloudFront ve iç health probe sonuçları.
- **Read model:** servis/bölge/ortam, SLI/SLO, son başarılı gözlem, açık olay, hata bütçesi ve sıradaki operasyon işi.
- **Komutlar:** olay açma/atama, bakım modu talebi, doğrulanmış runbook başlatma. Sağlayıcı komutu modül dışındaki adapter üzerinden yürür.
- **Kabul:** kısmi sağlayıcı kesintisi `partial`; tazelik eşiğini aşan ölçüm `stale`; bilinmeyen durum yeşil gösterilmez.

## CORE-03 · Tenant ve portal teknik envanteri

- **Sahip:** platform tenant/portal kimliği; Core yalnız teknik projeksiyon sahibidir.
- **Read model:** tenant/portal sabit kimliği, ortam, bölge, ürün hak özeti, uygulama/DB sürümü, feature flag özeti ve son sağlık zamanı.
- **Sınır:** müşteri içeriği ve kullanıcı listesi gösterilmez; destek oturumu olmadan tenant adına komut üretilmez.
- **Kabul:** portal adı değişse de teknik kimlik değişmez; tenantlar arası ilişki veya metadata sızıntısı olmaz.

## CORE-04 · Sürüm, migration ve özellik bayrağı

- **Sahip:** release manager. Kaynak: imzalı build, Git commit, migration geçmişi ve sürümlü flag tanımı.
- **Komutlar:** pilot rollout, duraklatma, geri alma ve kill switch. Migration ileri/geri planı, ön kontrol ve iki kişili onay ister.
- **Kurallar:** şema geriye uyumluluk penceresi olmadan uygulama rollout'u yapılmaz; tenant pilot kapsamı Super Admin talebinden gelir, teknik icra Core'dadır.
- **Kabul:** başarısız pilot otomatik durur; tekrar aynı komut ikinci rollout üretmez; geri alma audit zincirini korur.

## CORE-05 · İş kuyruğu ve entegrasyon operasyonu

- **Sahip:** platform jobs/integration runtime. Ürün alanı iş payload'ının anlamına sahip olmaya devam eder.
- **Read model:** queue, worker, lease, retry, dead-letter, webhook teslimi, tenant kapsamı ve son hata sınıfı.
- **Komutlar:** güvenli retry/replay, quarantine, iptal ve runbook eskalasyonu. Replay aynı idempotency anahtarını kullanır.
- **Kabul:** tekrar çalışma çoğaltılmış kayıt üretmez; yanlış tenant işi başka tenant worker'ı tarafından işlenmez.

## CORE-06 · Güvenlik, audit ve olay müdahalesi

- **Sahip:** security operator. Audit olayları append-only kaynaktır; ekran yalnız yetkili arama projeksiyonudur.
- **Read model:** olay şiddeti/durumu, aktör, düzlem, tenant referansı, korelasyon, sinyal kaynağı ve kanıt hash'i.
- **Komutlar:** oturum/anahtar iptali, olay sınırlandırma, kanıt saklama ve runbook adımı; kişisel veri minimum gösterilir.
- **Kabul:** olay müdahalesi kendi audit kaydını değiştirip silemez; yetkisiz operatör arama sonucu alamaz.

## CORE-07 · Depolama, bölge ve altyapı kontrolü

- **Sahip:** infrastructure operator. S3/Vercel/Supabase/CloudFront kaynakları IaC kimliğiyle eşleştirilir.
- **Read model:** bucket/dağıtım/proje referansı, bölge, encryption/versioning/public-access durumu, kota ve son doğrulama.
- **Komutlar:** provisioning işi, politika düzeltme talebi, dağıtım invalidation ve kapasite alarmı; statik AWS anahtarı istemciye çıkmaz.
- **Kabul:** public veya taramasız depolama portal kullanımına açılamaz; tenant bucket provisioning idempotenttir.

## CORE-08 · Ana kataloglar ve paket yönetimi

- **Sahip:** OS Core teknik paket yayını; lisans ve tenant ataması Super Admin'dedir.
- **Read model:** dil/sektör/marka/e-posta/sertifika paket kimliği, semver, kanal, bağımlılık, checksum ve rollout kapsamı.
- **Komutlar:** taslak doğrulama, imzalı yayın, pilot dağıtım, geri alma ve deprecated işaretleme.
- **Kabul:** yeni temel paket tenant overlay'ini bozmaz; eksik kritik çeviri veya geçersiz asset manifesti yayımlanmaz.

## CORE-09 · Sağlayıcı, maliyet ve kullanım kontrolü

- **Sahip:** platform/infrastructure operator; finansal görünüm salt okunur maliyet defterinden gelir.
- **Read model:** provider referansı, capability, bölge, sağlık, secret sürümü, kota, birim maliyet ve anomali durumu.
- **Komutlar:** provider/secret sürümü değiştirme, circuit breaker, kota ve kontrollü failover. Secret değeri yalnız kasada kalır.
- **Kabul:** provider değişimi pilot/eval olmadan globale çıkmaz; maliyet verisi ölçüm zamanı ve para birimini taşır.

## CORE-10 · Veri yönetişimi ve felaket kurtarma

- **Sahip:** data governance; ürünler kendi kayıt anlamını korur, Core politika/icra kanıtını yönetir.
- **Read model:** veri sınıfı, ikamet bölgesi, retention/legal hold, yedek zamanı, restore testi, RPO/RTO ve silme işi.
- **Komutlar:** yedek/restore tatbikatı, saklama işi, taşınabilirlik ve onaylı silme; legal hold silmeyi engeller.
- **Kabul:** restore tatbikatı izole hedefte ölçülür; yanlış tenant yedeği açılamaz; silme kanıtı audit geçmişini yok etmez.

## Uygulama sırası

1. CORE-02 için tazelik sözleşmeli salt okunur health projection.
2. CORE-03 teknik envanter ve CORE-04 sürüm matrisi.
3. CORE-05/06 güvenli operasyon komutları.
4. CORE-07–10 sağlayıcı adapterleri ve kanıtlı kabul tatbikatları.

