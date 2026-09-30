# Respongo Super Admin · dil lisansı ve portal dağıtımı

**Tek platform sahibi Respongo'dur.** OS Core dil paketinin teknik sürümünü, doğrulamasını, kademeli yayınını ve geri almasını yönetir. Super Admin paketi lisanslanabilir teklif olarak yönetir ve portallara kullanım hakkı atar. Control Center müşterinin hakkı olan paketi kullanıp kendi görünen terimlerini özelleştirir; küresel temel paketi değiştiremez. Bu belge plan ve komut sınırıdır, çalışan ekran değildir.

## Paket modeli ve yaşam döngüsü

`locale.<BCP47>` dil paketi; paket kimliği, locale/yön, semantik sürüm, ürün ad alanları, mesaj tanımları, onaylı çeviriler, font/RTL uyumu, checksum, kaynak/çevirmen, QA kanıtı ve yayın durumunu taşır. Durumlar: **taslak → otomatik öneri/çeviri taslağı → insan incelemesi → QA → kademeli yayın → etkin → geri alınmış/arşiv**. AI önerisi hiçbir zaman tek başına müşteriye açık paket olmaz.

Türkçe ve İngilizce `included` (temel pakete dahil); diğer sekiz hedef dil `addon` (ek lisans). [Dil kaydı](../../platform/locales.json) kaynak listedir. OS Core yeni BCP 47 dili ve teknik paketini ekleyebilir; Super Admin yalnız hazır/onaylı paketi marketplace ve tenant lisansına açabilir. Yerel veri, font, RTL, çevirmen ve ürün kapsamı QA tamamlanmadan paket “hazır” gösterilmez.

## Yüzlerce portal için sürüm ve dağıtım

- **Değişmez (immutable) paket sürümü:** yayımlanan `locale.de-DE@1.4.0` değiştirilmez; düzeltme yeni sürümdür. Her ürün kendi mesaj anahtarlarını sürümler, HQ paket matrisi hangi ürünün hangi locale'de kaç kritik anahtarının hazır olduğunu gösterir.
- **Diferansiyel yayım:** bir ürün yeni anahtar eklediğinde TR/EN kritik metinleri sürüm kapısıdır; diğer paketler için çeviri işi açılır. Yeni anahtarlar müşterinin değiştirmediği alanlara otomatik gelir. Paket tamamen kopyalanmaz; tenantın yalnızca değiştirdiği anahtarlar overlay (üst katman) olarak saklanır.
- **Üç yönlü birleştirme:** eski temel sürüm + yeni temel sürüm + tenant override karşılaştırılır. Müşterinin değiştirdiği değer korunur; yeni temel anahtar devralınır. Temel kaynak metin değişirse override korunur ama “gözden geçir” işareti oluşur. Anahtar taşınması/silinmesi `alias/deprecation` haritasıyla yapılır; korumalı anahtar değişimi veya uyumsuz placeholder otomatik geçmez.
- **Dağıtım halkaları:** iç demo → sınırlı pilot tenant → yüzde/küme bazlı genel yayın. Başarısız kalite/performans/eksik metin alarmında önceki paket sürümüne atomik geri dönüş. Önizleme taslak sürüme bakar; müşteri kullanıcıları yalnızca yayımlanmış ve lisanslı sürümü görür.
- **Filo ekranı:** dil başına hazır/eksik ürün alanı, tenant entitlement, base/overlay sürümü, özelleştirilmiş anahtar sayısı, çatışma, son senkron, fallback, rollout/rollback ve bildirim durumu. Toplu lisans atama/geri alma ve portal seçimi çift onay/audit ile yapılır; müşterinin sessizce lisansını silmez.

## Komut ve güvenlik sınırı

OS Core operatörü `language-pack.create/edit/review/publish/rollout/rollback` ve teknik `translation-job.request` komutlarını; Super Admin ise `tenant-locale.grant/revoke` komutlarını ayrı izin ve MFA ile kullanır. Yayın ile lisans atama farklı yetkilerdir. `tenant-locale.grant` ürün lisansı veya müşteri rızası gerektiren eylemi atlamaz. Her komut aktör/gerekçe/önce-sonra sürümü/tenant kümesi ve iş kimliğiyle audit'e girer. Toplu rollout idempotent arka plan işiyle yürür.

**Kabul:** TR/EN dahil; bir ek dil OS Core'dan yayımlanır ve Super Admin tarafından iki tenant'a farklı hakla atanır; biri kendi üç etiketi değiştirir; yeni ürün sürümü iki yeni mesaj ekler; her iki tenant yeni metinleri alır, yalnız özelleştirenin üç metni korunur; çakışma görünür; paket geri alınır; başka tenant etkilenmez. API/RLS, mobil, e-posta, cache ve deneme bitişi negatif testleri geçer.
