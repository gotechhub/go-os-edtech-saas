# Respongo OS kanonik depo düzeni

Bu depo **Respongo OS'nin kanonik monoreposudur**. Boş ürün kodu veya tarihsel V1/V2 kopyası hazır işlev sayılmaz.

```text
go-os-edtech-saas/
  context/                 ortak karar, kaynak, ajan devri
  .ai_memory/              kısa durum ve kritik belge haritası
  research/                rakip/görev araştırması ve hipotezler
  docs/architecture/       veri, güvenlik, API/olay ve yayın sözleşmesi
  design/                  rol akışı, 21st brief, token/asset hedefi
  platform/                tenant, kimlik, hak, deneme ve ortak hizmetler
    locales.json           HQ kontrollü hedef dil ve lisans kaydı
    localization/          F1 dil paketi/overlay/entitlement domain kodu
    control-center/        müşterinin yönetim alanı
  operations/
    respongo-hq/           iç süper yönetim, ana CRM ve Dil Kontrol Merkezi
  products/
    golms/ golxp/ gocatalog/ goauthor-ai/ gopm/
  services/
    gofactory/             yönetilen içerik üretim hizmeti
  intelligence/
    goai-engine/           ürünler arası izinli AI
  standards/               SCORM, xAPI, cmi5, LTI ve entegrasyon adaptörleri
  supabase/                migration, RLS ve yayın/rollback kaydı
  scripts/                 takip ve yapı doğrulama
  apps/                    F1+ web/API, F2+ Expo mobil uygulama
  packages/                F2+ token, web/native UI, sürümlü sözleşme paketleri
    goai-ui/               ürün içine gömülen ortak Ask GOAI bileşen/durum sözleşmesi
```

**Kod açıldığında beklenen biçim:** her ürün/hizmet kendi `src/domain` (iş modeli), `src/application` (kullanım akışı), `src/infrastructure` (DB/dış servis) ve gerekiyorsa `src/ui` alanını tutar. `apps/web` ve `apps/mobile` uygulama birleştiricisidir; ürünün iş kuralını tekrar yazmaz. `packages/design-tokens`, `ui-web`, `ui-native` ve `contracts` yalnızca gerçekten paylaşılan, kararlı sözleşmeler için açılır. `services/worker` uzun işlerin çalıştırıcısıdır; bir ürünün verisini sahiplenmez.

**Bağımlılık yönü:** UI → application → domain; infrastructure, domain arayüzünü uygular. Ürünler arası bağ sürümlü sözleşme/API/olaydan geçer. Doğrudan başka ürünün tablosuna yazma, tenant kimliğini URL'den güvenilir sayma ve HQ yetkisini müşteri tokenına ekleme yasaktır.

**GOAI yönü:** ürün UI → `packages/goai-ui` → GOAI application → kayıtlı ürün query/command araçları. Model doğrudan ürün tablosuna erişmez. Tenant AI Governance `platform/control-center`, global GOAI Operations `operations/respongo-hq` alanındadır.

**Geçiş:** Tarihsel V1/V2 ayrı arşivlerde kalır. Respongo OS uygulama kabuğu, migration ve testleri bu temiz depoda geliştirilir. Eski kod yalnızca gözlem/karşılaştırma girdisidir; müşteri kodu, kullanıcı, seed, logo veya kimlik bilgisi kopyalanmaz. Hosted beta bağlantıları ve ilk demo portalı F1/F6 kabul kapılarından sonra kurulur.
