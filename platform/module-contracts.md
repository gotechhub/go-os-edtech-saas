# Ortak SaaS platformu · F1 modül sözleşmeleri

**Doğrulama tarihi:** 2026-10-01. Bu belge F1 platform modüllerinin tanım kapısıdır. Uygulama ve hosted kabul yalnız ilgili migration, kod, negatif test ve tarihli kanıtla ayrıca doğrulanır.

## Ortak kurallar

- Her müşteri kaynağı sabit `tenant_id`, sahip ürün/alan ve yaşam döngüsü taşır. URL slug, görünen ad, dil veya istemci rolü yetki kaynağı değildir.
- Yetki; gerçek oturum, aktif üyelik, süreli rol, ürün hakkı ve nesne tenant'ı üzerinden sunucuda ve veritabanında yeniden doğrulanır.
- 14 günlük deneme yalnız ilk müşteri etkinleştirmesinde bir kez başlar. İç demo hariçtir. Bitişte yetkili okuma korunur, bütün yazma kanalları kapanır.
- Komutlar idempotency, audit, tazelik ve geri alma bilgisi taşır. Ürün verisinin sahibi ortak platforma geçmez.

## PLAT-01 · Kimlik ve oturum

- Supabase Auth kimliği tenant üyeliğinden ayrıdır; kullanıcı birden çok tenant'a üye olabilir.
- Davet, SSO, MFA, cihaz/oturum ve hesap kurtarma aynı kimliğe bağlanır. İç Core/HQ hesapları ayrı rol alanı ve AAL2 ister.
- İptal davet, süresi dolmuş üyelik, yanlış tenant, AAL1 iç operatör ve oturum iptali negatif test edilir.

## PLAT-02 · Tenant, organizasyon ve roller

- Tenant, portal, üyelik, ekip, yönetici bağı, rol ve izin ayrı kayıt tipleridir; rol grant'i başlangıç/bitiş ve kapsam taşır.
- Platform rolleri ürün komutlarını yalnız sürümlü izin anahtarıyla açar. Rol önizlemesi gerçek grant değildir.
- İki tenant, çoklu üyelik, çapraz ekip ve sona ermiş rol testleri veri sızıntısı olmadan geçmelidir.

## PLAT-03 · 14 günlük ortak deneme ve lisans

- Tek tenant saati yayımlanmış SaaS ürün haklarını açar; GOFACTORY ve üçüncü taraf lisansları kapsam dışıdır.
- İç demo sayaç başlatmaz. Süre bitişi veri silmez; API, RPC, worker, e-posta, mobil senkron ve AI yazması aynı kapıda reddedilir.
- Lisans değişimi ayrı entitlement sürümü ve audit üretir; deneme yeniden başlatılamaz.

## PLAT-04 · Marka ve sektör temaları

- Semantik token, tenant marka sürümü, sektör paketi ve web/native/e-posta/sertifika asset bağları ayrıdır.
- Logo/banner varlık servisini kullanır; kontrast, odak, alternatif metin ve açık/koyu varyantı doğrulanır.
- Sistem tema yükseltmesi tenant override'ını ezmez; önizleme, yayın ve rollback atomik sürüm kullanır.

## PLAT-05 · Varlık ve medya yönetimi

- Özel S3, karantina, hash, tarama, hak, değişmez yayın, türev ve yetkili indirme ortak servistir.
- İstemci AWS anahtarı almaz; kısa süreli, amaç/tenant/nesne kapsamlı imzalı bağlantı kullanır.
- Yanlış tenant, bitmiş deneme, bozuk hash, malware, zip bomb ve taranmamış yayın reddedilir.

## PLAT-06 · Bildirim ve iletişim

- Olay, şablon sürümü, alıcı tercihi/izni, kanal, locale ve teslim sonucu ayrı kayıttır.
- E-posta, uygulama içi ve push aynı niyetten türetilir; adapter retry ve idempotency uygular.
- Kritik güvenlik mesajı tercihle kapatılamaz; pazarlama ve öğrenme hatırlatması izin kurallarına uyar.

## PLAT-07 · İş akışı, kuyruk ve audit

- Deterministik workflow ortak altyapıda, iş kuralı ilgili üründe kalır. Job tenant, ürün, payload sürümü, idempotency ve correlation taşır.
- Lease, retry, backoff, dead-letter, cancellation ve replay çift işlem üretmez.
- Audit append-only aktör/düzlem/tenant/gerekçe/nesne/sonuç kaydıdır; secret ve gereksiz kişisel veri içermez.

## PLAT-08 · Destek ve bilgi merkezi

- Son kullanıcı → tenant admin → Super Admin eskalasyonu tek ticket geçmişi, SLA ve görünür sorumluyla yürür.
- Tenant admin yalnız kendi kullanıcılarını; HQ yalnız gerekçeli tenant kapsamını görür. Teknik müdahale süreli destek oturumu ister.
- Bilgi makalesi ürün/rol/locale/sürüm taşır; çözüm ve kapanış audit edilir.

## PLAT-10 · 10 dilli mesaj ve terim altyapısı

- `tr-TR` varsayılan, `en-US` dahil; sekiz ek locale lisanslıdır. Anahtarlar ürün ad alanlı ve ICU/CLDR doğrulamalıdır.
- OS Core temel paket yayımlar, Super Admin atar, Control Center etkin dil ve izinli terimleri yönetir.
- Locale yetki üretmez; kritik eksik metin, bozuk placeholder, RTL ve erişilebilirlik hatası yayını engeller.

## PLAT-11 · Dil paketi overlay ve otomatik senkron

- Değişmez temel paket + yalnız değişen tenant overlay'i + kullanıcı tercih sırası kullanılır.
- Üç yönlü yükseltme yeni anahtarı ekler, değiştirilmemiş değeri günceller, tenant override'ını korur ve çatışmayı incelemeye taşır.
- Cache anahtarı tenant/locale/ürün/base/overlay sürümü içerir; taslak veya başka tenant metni sızmaz.

## PLAT-12 · Kurum sözlüğü, rol ve yetkinlik çekirdeği

- Pozisyon, rol, yetkinlik, seviye ve beklenen yeterlilik sabit kimlik, sürüm, kaynak ve geçerlilik taşır.
- GOLMS/GOLXP/GOPM aynı kimliği okur; eğitim tamamlama tek başına yetkinlik veya performans puanı değildir.
- Merge/deprecation geçmiş bağlantıları bozmaz; tenant ve sektör sözlükleri açık kapsamla ayrılır.

## PLAT-13 · Arama, taksonomi ve kayıt bulma

- Ortak indeks yalnız izinli metadata alır; kaynak yetkisi sorgu anında yeniden doğrulanır.
- Tenant, ürün, rol, locale, taxonomy ve durum filtreleri; silme/tombstone ve yeniden indeksleme desteklenir.
- Başka tenant, iptal edilmiş hak, silinmiş belge veya eski ACL sonucu dönmez; tazelik görünürdür.

## PLAT-14 · Entegrasyon merkezi ve webhook yönetimi

- Connector kimliği, tenant kurulumu, secret referansı, scope, webhook imza sürümü, kota ve sağlık ayrı kayıttır.
- Webhook imza, timestamp/replay penceresi, idempotency, retry ve dead-letter kullanır.
- Secret istemciye dönmez; tenant yalnız kendi kurulumunu yönetir; arıza çoğaltılmış iş üretmez.

## PLAT-15 · Gizlilik, rıza ve veri yaşam döngüsü

- Aydınlatma/rıza sürüm, locale, kapsam ve kanıt taşır. Retention, legal hold, export, silme ve anonimleştirme veri sınıfına bağlıdır.
- Tenant yöneticisi hukukî tutmayı aşamaz; ürün sahibi silme etkisini tanımlar, platform işi ve kanıtı orkestre eder.
- Dışa aktarma yanlış tenant verisi içermez; silme cache, indeks, türev ve yedek takvimine izlenebilir yayılır.
