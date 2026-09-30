# Respongo OS · kurumsal EdTech ekosistemi

**Durum: mimari temel + platform ve ilk GOLMS çekirdeği.** Bu depo Respongo OS'nin kanonik monoreposudur; ayrıca bir `v3` kaynak katmanı kullanılmaz. Tarihsel V1/V2 kodu bu depoya kopyalanmaz. Tenant/rol/14 günlük deneme temeli ile GOLMS içerik → program → atama → SCORM girişimi → rapor dikey dilimi domain kodu ve temiz migration zincirinde doğrulanır. Yol haritası önce güvenli platform omurgasıyla OS Core'u, ardından Super Admin ve Control Center yönetim katmanlarını kurar; mevcut GOLMS kodu F4 teknik başlangıcı olarak korunur. Gerçek yönetim ekranları, 10 dil çevirisi ve hosted kabul ayrı kapılardır.

| Katman | Alanlar |
|---|---|
| CREATE · Üret | GOAUTHOR AI (müşteri yazarlığı); GOFACTORY (Respongo üretim hizmeti) |
| LEARN · Öğren | GOLMS; GOLXP; GOCATALOG |
| PERFORM · Performans | GOPM |
| INTELLIGENCE · Zekâ | GOAI Engine (ortak, yetki kontrollü) |
| OPERATIONS · Yönetim | Respongo OS Core (teknik işletim); Super Admin/HQ (müşteri filosu); Control Center (müşteri yönetimi) |

Hedef: **Öğrenme Üret. Yetenekleri Geliştir. Performansı Artır.** Tek marka ve kimlikle çalışan, veri sahipliği açık bir kurumsal öğrenme ekosistemi. Çok ürünlü olmak, her ürünün olgun olduğu veya rakiplerden benzersiz olduğu iddiası değildir; farklılaştırma hipotezleri ürün kabulünde sınanır.

## Başlangıç haritası

- [Bağlam ve hafıza](context/README.md): Codex/Claude karar ve kaynak yönlendirmesi.
- [Rakip araştırması](research/competitive-landscape.md): resmî ürün kaynakları ve ayrışma hipotezleri.
- [Mimari](docs/architecture/README.md) ve [uygulama sırası](docs/architecture/delivery-roadmap.md): alan sahipliği, yönetim katmanları, güvenlik, veri, entegrasyon ve altyapı.
- [10 dil ve white-label etiket mimarisi](docs/architecture/localization-white-label.md): TR/EN dahil, sekiz ek lisans, HQ paket kontrolü ve müşterinin korunarak güncellenen terim varyantı.
- [Tasarım](design/README.md): sıfırdan web/mobil UX ve 21st.dev brief'i.
- [SaaS ürünleri](products/README.md), [GOFACTORY hizmeti](services/gofactory/README.md), [OS Core](operations/os-core/README.md), [Super Admin/HQ](operations/respongo-hq/README.md) ve [müşteri Control Center](platform/control-center/README.md).
- [GOLMS ilk uygulama durumu](products/golms/implementation-status.md) ve [temiz Supabase migration zinciri](supabase/README.md).
- [Tek takip kaynağı](project-tracker.json): buradan [HTML](proje-plani.html) ve [Markdown](proje-plani.md) üretilir.

Beta: GitHub + Vercel (web/API) + Supabase (PostgreSQL/Auth) + özel Amazon S3 (dosya/medya). S3 tek başına uygulama sunucusu değildir. Daha sonraki AWS taşıması veritabanı, kimlik, işler, depolama ve operasyonu birlikte kapsayan ayrı bir geçiştir.
