# İç kontrol düzlemleri ve ayrıcalıklı erişim

Respongo OS üç ayrı yetki alanı kullanır. Bu alanların arayüzleri benzer görünse bile kimlik ve izinleri birbirinden türetilmez.

| Düzlem | Şema | Kimlik kaynağı | Sorumluluk |
|---|---|---|---|
| Respongo OS Core | `v3_core` | `v3_core.operators` + süreli `role_grants` | Teknik sistem, güvenlik, sürüm, altyapı, sağlayıcı ve veri işletimi |
| Respongo Super Admin | `v3_hq` | `v3_hq.operators` + süreli `role_grants` | Müşteri, portal, demo, lisans, destek ve ticari operasyon |
| Müşteri Control Center | `v3_platform` | Tenant membership + tenant role grant | Yalnız kendi kuruluşu, kullanıcıları, ayarları ve ürün hakları |

## Değişmez kurallar

- Tenant üyeliği iç operatör hakkı üretmez. Rol önizlemesi hiçbir düzlemde yetki sağlamaz.
- OS Core ve Super Admin erişimi `AAL2` MFA güvence seviyesi ister.
- Her iç rol başlangıç/bitiş zamanı taşır. Süresi dolan veya pasif operatörün erişimi anında kesilir.
- `core.*` izinleri yalnız OS Core rollerine, `hq.*` izinleri yalnız Super Admin rollerine verilir.
- Super Admin teknik migration, secret, altyapı veya güvenlik komutu çalıştıramaz; OS Core müşteri ticari yaşam döngüsünü sahiplenmez.
- Müşteri verisine destek erişimi ayrı, gerekçeli ve süreli destek oturumu üzerinden yürür. Teknik operatör kaydı destek oturumu hakkı oluşturmaz.
- Ayrıcalıklı yazma komutları aktör, düzlem, gerekçe, hedef, korelasyon ve sonuç içeren audit kaydı üretir.

## Rol aileleri

OS Core rollerinin ilk sözleşmesi: `platform_operator`, `security_operator`, `release_manager`, `infrastructure_operator`, `data_governance`. Super Admin rollerinin ilk sözleşmesi: `customer_ops`, `support`, `billing`, `commercial`. Bir kullanıcı birden çok süreli rol alabilir; izinler birleşir fakat düzlemler birleşmez.

`public.v3_my_internal_access()` yalnız MFA tamamlanmış gerçek oturumun kendi rol ve izinlerini döndürür. OS Core arayüzü bu sonucu kullanır; istemciden gelen rol adı yetki kaynağı değildir. `v3_core.has_permission()` ve `v3_hq.has_permission()` sunucu/veritabanı komut kapılarıdır.

## Migration ve geri alma sınırı

`202609300001_v3_internal_control_planes.sql`, ilk foundation migration'ındaki karışık `operator/support/billing/security` sütununu geriye uyumlu biçimde ayırır:

1. Eski `security` rolleri OS Core `security_operator` grant'ine taşınır.
2. Eski `operator` rolü Super Admin `customer_ops` grant'ine dönüşür; destek ve faturalama rolleri korunur.
3. Eski tekil rol sütunu kaldırılır; aktif erişim yalnız süreli grant tablolarından hesaplanır.
4. Deneme başlatma komutu rol adına değil `hq.trial.manage` iznine bağlanır.
5. Audit olaylarına `tenant`, `super_admin`, `os_core` ve `system` düzlem bilgisi eklenir.

Hosted ortamda uygulanmadan önce yedek, row-count ve eski rol dağılımı kaydedilir. Geri alma uygulama sürümünü önceki RPC sözleşmesine döndürür; yeni grant verisini silmez. Eski tekil rol sütununa veri kaybettiren otomatik dönüş yapılmaz. Geri dönüş gerekirse grant'lerden deterministik birincil rol üreten ayrı ve gözden geçirilmiş migration kullanılır.

## Mevcut kanıt ve eksikler

Yerel PGlite testleri MFA, süresi dolmuş grant, tenant kullanıcısı, Super Admin → Core ve Core → Super Admin negatif erişimini doğrular. OS Core web ekranı gerçek Supabase oturumundan rol/izin okuyarak güvenli boş, hata, MFA ve yasak durumlarını gösterir.

`202610010001_v3_core_privileged_approvals.sql`, yüksek riskli Core komutları için kısa ömürlü ve tek kullanımlık iki kişili onay bileti ekler. Talep eden kişi kendi yetkisindeki işlem için gerekçe girer; farklı bir `security_operator` onaylar; talep eden kişi bileti yalnız bir kez tüketebilir. Talep, onay ve tüketim aynı korelasyon kimliğiyle audit kaydına bağlanır. Bilet tek başına altyapı işlemi çalıştırmaz; ilgili komutun aynı işlem içinde bu bileti tüketmesi gerekir.

`202610010002_v3_internal_emergency_sessions.sql`, Super Admin için tenant kapsamlı ve en fazla dört saatlik destek oturumu; OS Core için işlem iznine bağlı, olay referanslı ve en fazla 30 dakikalık break-glass oturumu ekler. Her iki oturum MFA, gerekçe, süre, iptal ve audit zorunluluğu taşır; doğrudan tablo erişimi vermez.

Hosted migration, gerçek MFA oturumu ve iki kişili/break-glass biletinin gerçek release veya migration komutuna aynı transaction içinde bağlanması henüz kabul kanıtına sahip değildir. Bu nedenle `CORE-01` uygulama ve kabul kapısı açık kalır.
