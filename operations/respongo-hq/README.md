# Respongo Super Admin (HQ) · müşteri ve portal yönetimi

**Yalnızca Respongo müşteri operasyon ekibi.** Control Center müşterinindir; Super Admin müşteri portalı değildir. Aday → fırsat → demo/iç geliştirme portalı → teklif/sözleşme → müşteri etkinleştirme → ürün hakkı → destek/yenileme yaşam döngüsünü yönetir. Portal filosu, sektör paketleri, lisans, kota, tenant GOAI planı ve müşteri destek devri burada görünür.

**Portal fabrikası:** sektör seç → hazır veri/marka/rol/politika taslağı → demo veya müşteri türü → ürün paketleri/erişim → güvenli URL/kimlik → kalite kontrol → etkinleştir. İç demo, 14 günlük müşteri denemesini başlatmaz. Oguz Law Academy ancak bu akış ve genel çekirdek hazır olduğunda ilk iç demo adayıdır; Respongo OS'ye bugünkü kod veya kullanıcıları otomatik kopyalanmaz.

**Yetki:** MFA, iç operatör kaydı, görev ayrılığı, gerekçeli/süreli tenant destek oturumu ve audit zorunludur. Tenant admini Super Admin menüsünü rol değiştirerek açamaz. Super Admin migration, altyapı, provider secret, güvenlik müdahalesi veya global kill switch çalıştırmaz; bunlar [Respongo OS Core](../os-core/README.md) yetkisidir. [Modüller](modules.md).

**Dil ticari operasyonu:** Super Admin on dilli teklif/lisans kataloğunu ve portal atamasını yönetir. Ana mesaj kataloğunun teknik sürümü ve güvenli dağıtımı OS Core'dadır. TR/EN dahildir; sekiz ek dil yalnızca onaylı paket ve tenant hakkıyla açılır. Müşterinin Control Center'da yayımladığı white-label etiketi başka portalı değiştirmez. [Ayrıntılı akış](language-control.md).

**Filo kapsamı:** ürün/özellik planları, kota ve lisans operasyonu, sektör başlangıç paketleri, müşteri entegrasyon uygunluğu, pilot müşteri seçimi ve yayın iletişimidir. Teknik feature flag, geri alma, provider kaydı, secret ve sistem sağlığı OS Core'da kalır. Ayrıntılı sıra [uygulama yol haritasında](../../docs/architecture/delivery-roadmap.md) tanımlıdır.
