# Proje özeti

**Respongo OS V3**, Respongo'nun CREATE/LEARN/PERFORM ürünlerini ortak bir tenant (müşteri kuruluşu) ve kimlik temeliyle sunmayı hedefleyen yeni mimari başlangıcıdır. Beş SaaS ürünü: GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI. GOAI Engine ortak AI katmanıdır. GOFACTORY, müşterinin proje talebi/onay/teslim görebildiği Respongo üretim hizmetidir; SaaS denemesi kapsamında değildir.

Müşterinin yönetim alanı **Control Center**, Respongo'nun iç süper yönetim/CRM alanı **Respongo HQ** adını taşır. GOHR/GORECRUIT aktif kapsamda yoktur. İlk beta için sektör bağımsız çekirdek hazırlanır; Oguz Law Academy daha sonra HQ'dan iç demo/müşteri portalı olarak açılır. V3'e tarihsel Oguz seed'i ve arayüzü aktarılmaz.

**2026-09-27 durumu:** V1/V2 yerel Git kontrol noktası `57e5975` ile korundu; V2 yerel test/derleme geçti. V3 planına ilk bağımsız dil/lisans/overlay TypeScript çekirdeği eklendi; müşteri pilotu, hosted migration, S3 yapılandırması, tasarım kabulü, HQ/Control Center ekranı ve ürün iş akışları henüz yoktur.

**Dil ve marka kararı:** V3'ün varsayılan arayüzü Türkçe (`tr-TR`); İngilizce de temel pakete dahildir, sekiz ek dil HQ tarafından lisanslanan paketlerdir. Respongo HQ dil sürüm ve filo dağıtımını yönetir; Control Center müşterinin hakkı olan paketi etkinleştirip görünen terimlerini overlay ile değiştirir. Temel paket güncellemeleri müşteri değişikliğini korur. Bu bir mimari hedeftir; V3 çevirileri ve arayüzü henüz üretilmedi. Ayrıntı için [çok dillilik sözleşmesi](../docs/architecture/localization-white-label.md).
