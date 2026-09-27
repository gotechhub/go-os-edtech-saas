# Respongo OS V3 · mimari kararları

## Mimari yaklaşım

Başlangıç **modüler monolit**: tek web uygulaması, paylaşılan kimlik ve PostgreSQL, ürünlerin kendi iş sözleşmeleri. Servis ayrımı, ölçülen kapasite/güvenlik/sürüm bağımsızlığı gerektirirse yapılır. Ürün adları tek başına mikroservis nedeni değildir. Web ve mobil aynı yetkili API/read model (okuma görünümü) sözleşmelerini kullanır. Uzun işler kullanıcı isteğinden ayrılıp güvenilir kuyruk/worker (arka plan işçisi) üzerinden yürür.

| Alan | Kendi gerçeğinin sahibi | Ürün dışına yalnızca |
|---|---|---|
| Shared platform | Kimlik, tenant, üyelik, ekip, rol/yetki, beceri sözlüğü, ürün hakkı, tema, bildirim, varlık, dil/terim kataloğu, audit | Sürümlü sözleşme ve izinli olay |
| Respongo HQ | İç operatör, aday/müşteri CRM, portal kurma, sektör paketi, lisans, destek SLA, güvenlik/operasyon | Tenant yöneticisine verilmez |
| Control Center | Müşteri kuruluşu, kullanıcı/ekip, ürün ayarı, görev kuyruğu, marka, dil/etiket stüdyosu, rapor ve destek yönetimi | Ürün komutunu sahiplenmez |
| GOLMS | Eğitim/program sürümü, atama/kayıt, girişim (attempt), değerlendirme, oturum, uyum, transcript ve sertifika | Tamamlama ve doğrulanmış öğrenme kanıtı özeti |
| GOLXP | Keşif, kişisel yolculuk, beceri pasaportu/önerisi, sosyal/topluluk ve oyunlaştırma | GOLMS sonucunu yalnızca sürümlü sözleşmeyle okur |
| GOCATALOG | Katalog metadata, tedarikçi, teklif/lisans ve kullanım hakkı | Lisans kontrolü ve içerik referansı |
| GOAUTHOR AI | Müşterinin düzenlenebilir içerik projesi, üretim, sürüm, paket/yayın | Sürümlü yayın nesnesi |
| GOPM | Hedef, değerlendirme, geri bildirim, gelişim planı | İzinli öğrenme kanıtı özeti |
| GOFACTORY | Respongo üretim hizmet talebi, teklif, proje aşaması, revizyon, onay ve teslim | GOAUTHOR çıktısını teslim olarak bağlayabilir |
| GOAI Engine | Sağlayıcı erişimi, izinli araç, bilgi kökeni, maliyet/kredi, değerlendirme | Ürün adına kendi başına yetkisiz yazamaz |

**GOHR/GORECRUIT yoktur.** Ortak kişi/ekip kayıtları bir İK ürünü anlamına gelmez. “GOLEARN” aktif V3 ürünü değildir; tarihsel hizmet adı yalnızca arşivde kalır.

## Kontrol düzlemleri ve kullanıcı rolleri

- Respongo HQ: iç operatör, destek uzmanı, finans/ticari yetkili ve güvenlik yöneticisi; MFA ve gerekçeli, süreli tenant erişimi.
- Müşteri Control Center: tenant sahibi/yöneticisi, L&D admini, içerik yöneticisi; yalnızca kendi tenant ürün yetkileri.
- Ürün rolleri: öğrenen, eğitmen, hat yöneticisi, yazarlık katkıcısı/inceleyicisi, katalog satın alma yetkilisi, performans değerlendiricisi. Kişinin birden çok rolü olabilir; her eylem yetki ve tenant bağlamında denetlenir.
- Müşteri role-preview, HQ erişimi veya yeni üyelik sağlamaz. HQ müşteri verisine yalnızca denetlenebilir destek oturumu üzerinden girer.

## Geliştirme depo sınırı

`v3/apps/web`, `v3/apps/mobile`, `v3/services/worker`, `v3/packages/design-tokens`, `v3/packages/ui-web`, `v3/packages/ui-native` **hedef kod alanlarıdır; bu plan turunda ürün kodu kurulmaz**. Domain kodu kendi ürün/hizmet klasöründe kalır: `products/<ürün>/src/{domain,application,infrastructure,ui}` veya `services/gofactory/src/...`. Ortak platform `platform/`; GOAI `intelligence/`; standart adaptörleri `standards/`. Bağımlılık yönü: UI → uygulama → domain; altyapı domain arayüzlerini uygular. Ürünler birbirinin tablosuna doğrudan yazmaz.

## Kanıt ve sürüm akışı

GOAUTHOR/GOFACTORY içerik çıktısı **immutable (değiştirilemez) yayın sürümü** üretir → GOCATALOG hak ve görünürlük belirler → GOLMS atayıp denemeyi/başarıyı kaydeder → GOLXP izinli öğrenme özetinden öneri kurar → GOPM yöneticinin seçtiği kanıtı gelişim görüşmesine bağlar. AI bütün zincirde kaynak ve izin kontrolüyle önerir; nihai iş kararını insan verir.

Detaylar: [hedef klasör ağacı](target-tree.md), [ön yüz / arka uç sözleşmesi](frontend-backend-contracts.md), [veri sözleşmesi](data-contracts.md), [S3 depolama ve varlık mimarisi](storage-and-assets.md), [çok dillilik ve white label](localization-white-label.md), [güvenlik ve altyapı](security-operations.md), [arayüz/olay sözleşmesi](integration-contracts.md), [kalite ve geçiş](release-gates.md), [GOLMS ürün mimarisi](../../products/golms/product-architecture.md), [GOAI kanonik mimarisi](../../intelligence/goai-engine/product-architecture.md).
