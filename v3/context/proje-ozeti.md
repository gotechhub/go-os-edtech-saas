# Proje özeti

**Respongo OS V3**, Respongo'nun CREATE/LEARN/PERFORM ürünlerini ortak bir tenant (müşteri kuruluşu) ve kimlik temeliyle sunmayı hedefleyen yeni mimari başlangıcıdır. Beş SaaS ürünü: GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI. GOAI Engine ayrı bir ürün/dashboard değil; her ürünün içinde çalışan ortak AI motoru ve paylaşılan UI katmanıdır. GOFACTORY, müşterinin proje talebi/onay/teslim görebildiği Respongo üretim hizmetidir; SaaS denemesi kapsamında değildir.

Müşterinin yönetim alanı **Control Center**, Respongo'nun iç süper yönetim/CRM alanı **Respongo HQ** adını taşır. GOHR/GORECRUIT aktif kapsamda yoktur. İlk beta için sektör bağımsız çekirdek hazırlanır; Oguz Law Academy daha sonra HQ'dan iç demo/müşteri portalı olarak açılır. V3'e tarihsel Oguz seed'i ve arayüzü aktarılmaz.

**2026-09-27 durumu:** Temiz V3 deposu GitHub'a gönderildi; platform ve GOLMS migration zinciri yeni hosted Supabase projesine uygulandı; Next.js V3 kabuğu Vercel production ortamında çalışıyor. Program taslak formu gerçek BFF komutuna bağlıdır. Gerçek Auth/rol UAT, hosted RLS negatif testi, S3 yapılandırması, HQ/Control Center ekranları ve tam program/SCORM akışı henüz kabul edilmedi.

**GOAI kararı:** Ürün içi deneyim tek `packages/goai-ui` sözleşmesini kullanır. Tenant bütçe/agent/bilgi/onay yönetimi Control Center'da; global provider secret, model route, platform maliyeti, eval ve rollout Respongo HQ'dadır. Ayrıntı için [GOAI kanonik mimarisi](../intelligence/goai-engine/product-architecture.md).

**Dil ve marka kararı:** V3'ün varsayılan arayüzü Türkçe (`tr-TR`); İngilizce de temel pakete dahildir, sekiz ek dil HQ tarafından lisanslanan paketlerdir. Respongo HQ dil sürüm ve filo dağıtımını yönetir; Control Center müşterinin hakkı olan paketi etkinleştirip görünen terimlerini overlay ile değiştirir. Temel paket güncellemeleri müşteri değişikliğini korur. Bu bir mimari hedeftir; V3 çevirileri ve arayüzü henüz üretilmedi. Ayrıntı için [çok dillilik sözleşmesi](../docs/architecture/localization-white-label.md).
