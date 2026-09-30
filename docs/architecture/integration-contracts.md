# Ürünler arası ve dış sistem sözleşmeleri

## İç sözleşme

Her komut `actor_id`, `tenant_id`, `product_id`, `correlation_id`, `idempotency_key` ve yetkili işlem kapsamıyla çalışır. Olaylar `event_id`, `schema_version`, `occurred_at`, `source` ve sınıflandırılmış payload taşır. Ürün özel tabloya başka ürün doğrudan yazmaz; sürümlü komut veya outbox olayı kullanır. Dışa verilen okuma modeli izin verilen alanları ve verinin tazeliğini bildirir.

Arayüz okuması ayrıca `locale`, `direction`, `basePackageVersion`, `tenantOverlayVersion`, `licenseStatus` ve kullanılan fallback bilgisini taşır. Bildirim/sertifika olaylarında alıcı dili ile şablon sürümü saklanır. Görünen etiketler API kimliği veya yetki adı yerine geçmez; temel paketi OS Core, müşteri overlay'ini yalnızca yetkili [platform yerelleştirme sözleşmesi](localization-white-label.md) yayımlar. Ürün yeni mesaj anahtarı eklediğinde ad alanlı sürüm olayı OS Core çeviri kuyruğunu tetikler; yeni temel paket tenant override'ının üzerine yazmaz.

| Üreten | Tüketen | En az sözleşme |
|---|---|---|
| GOAUTHOR AI / GOFACTORY | GOLMS, GOCATALOG | Yayın kimliği, sürüm, format, hash, dil, hak, tarama sonucu |
| GOCATALOG | GOLMS, GOLXP | İçerik hakkı, koltuk/kota, süre ve görünürlük |
| GOLMS | GOLXP, GOPM, GOAI | Tamamlama/puan/sertifika ve doğrulama kaynağı; kişisel veri alan izni |
| GOPM | GOLXP | Kullanıcı/onay kapsamlı gelişim ihtiyacı; gizli performans notu varsayılan olarak aktarılmaz |
| GOAI Engine | Ürün sahipleri | Öneri, açıklama/kaynak ve önerilen eylem; yazma için ürün onayı |
| Respongo OS Core | Platform | Sistem sürümü, teknik rollout, altyapı, güvenlik ve sağlayıcı komutları; Super Admin ve tenant komutlarından ayrı |
| Respongo Super Admin | Platform | Tenant oluşturma, ürün hakkı, destek oturumu ve audit; tenant admin komutlarından ayrı |

## Dış entegrasyon listesi

SSO (OIDC/SAML), SCIM kullanıcı eşleme, MS Teams/Zoom/GoTo Training oturumları, takvim ve e-posta, push, üçüncü taraf içerik/yazarlık, webhook, rapor dışa aktarımı. Her adaptörde tenant kapsamı, gizli anahtar kasası, oran sınırı, yenileme/iptal, hata kuyruğu, webhook imzası, veri işleme izni ve bağlantı sağlık ekranı gerekir. isEazy Author için önce resmî yayın/entegrasyon hakları ve paket davranışı doğrulanır; doğrulanmayan API üzerinden çift yönlü entegrasyon vaat edilmez.

Standart adaptörleri: SCORM 1.2/2004 için ayrı uyumluluk testleri; xAPI için LRS (öğrenme kayıt deposu) sözleşmesi; cmi5 ve LTI 1.3 araştırma/uyum fazları. “Destekliyor” etiketi ancak örnek paket, dış LMS ve hata senaryoları geçtiğinde kullanılır.
