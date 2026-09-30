# Çok dillilik ve müşteri terimleri · tasarım sözleşmesi

**Durum: plan.** Respongo OS arayüzü ve çevirileri henüz üretilmedi. [Dil kaydı](../../platform/locales.json) on hedef dili tanımlar: **tr-TR (varsayılan), en-US, de-DE, fr-FR, es-ES, pt-BR, ar, ru-RU, ja-JP, zh-CN**. Türkçe ve İngilizce bütün müşteri portallarının temel paketine dahildir; diğer sekiz dil tenant bazlı **ek lisans** paketidir. OS Core temel paket sürümünü yayımlar; [Super Admin dil operasyonu](../../operations/respongo-hq/language-control.md) lisans ve tenant dağıtımını yönetir. İlk müşteri/ülke araştırması ek dillerin öncelik sırasını değiştirebilir.

## Sahiplik ve kapsam

| Katman | Sahibi | Neler çevrilir / değişir? |
|---|---|---|
| Temel mesaj kataloğu | OS Core teknik sürümü yayımlar; Super Admin lisanslar/tenant'a atar; ortak platform servis eder; ürün ekibi kendi ad alanını sürümler | Web/native arayüz, giriş/MFA, Control Center, Super Admin, OS Core, beş ürün, GOFACTORY, GOAI, hata/boş durum, erişilebilirlik etiketleri, bildirim ve sistem e-postaları |
| Terim sözlüğü | Ortak platform; ürünler kavram kimliği verir | `learning.course` gibi sabit kavramın müşteri ve dil bazlı görünür karşılığı; tek kelime arama/değiştirme yapılmaz |
| Müşteri etiket katmanı | Control Center düzenleme arayüzü, platform yayın komutu | Lisanslı temel paketin kopya-üzerine-yazma (overlay) varyantı; menü, modül/ürün görünen adı, buton, alan etiketi, dashboard kartı ve rehber metni için izinli anahtarlar |
| Öğrenme/içerik çevirisi | İçeriği oluşturan ürün veya hizmet | Kurs, quiz, katalog tanımı, topluluk gönderisi, GOFACTORY teslimi ve GOPM değerlendirme metni ayrı sürümlü içeriktir; arayüz dilinin değişmesi içeriği otomatik çevirmez |
| Hukukî/işlemsel metin | Yetkili şablon ve onay akışı | KVKK/aydınlatma, sözleşme, ödeme/deneme koşulu, sertifika beyanı ve güvenlik uyarısı genel etiket editörüyle değişmez; yetkili inceleme/sürüm gerektirir |

Kanonik teknik anahtarlar, ürün/rol kimlikleri, yetki adları, API alanları, rapor ölçü tanımları ve audit olayları müşteri etiketinden etkilenmez. Müşteri “Eğitim” görünen terimini “Gelişim Modülü” yapabilir; `learning.course` kimliği ve ilerleme hesabı değişmez. Ürün logosu/ismi müşterinin portalında gösterim amacıyla değişebilir; Respongo HQ kaydı ve sözleşmeli ürün kimliği değişmez.

## Dil seçimi ve metin çözümleme

1. Oturum açmış kullanıcı: tenantın **lisanslı ve etkin** dilleri içinde kişisel tercih → tenantın varsayılan dili → platformun `tr-TR` varsayılanı. Giriş öncesinde portal/özel alan adıyla bulunan tenant varsayılanı kullanılır; tarayıcı dili yalnızca öneridir. İç HQ kendi kullanıcı tercihine sahiptir, müşteri etiketleri HQ'ya uygulanmaz. Lisansı kaldırılan ek dil eski kullanıcı tercihinde kalsa bile erişim vermez; kullanıcıya etkin temel dil gösterilir.
2. Tek mesaj çözümleme sırası: **yayındaki tenant overlay'i (seçilen dil)** → **OS Core'un yayımladığı ve Super Admin'in tenant'a lisansladığı temel paket (seçilen dil)** → **tenant varsayılan dilindeki onaylı metin** → **platform `tr-TR` metni**. Eksik anahtar telemetriye düşer; ham teknik anahtar kullanıcıya gösterilmez. Kritik alanı eksik dil etkinleştirilemez. Temel paket sürümü ve tenant overlay sürümü her manifestte görünür.
3. Anahtarlar ürün ad alanlı ve kalıcıdır: `platform.nav.home`, `golms.assignment.due`, `gofactory.project.approve`. Aynı anahtarın Türkçe, İngilizce ve sekiz diğer çevirisi ayrı sürümlenir. Metin içindeki değişkenler isim/tip sözleşmesiyle korunur.
4. Çoğul, sayı, cinsiyet ve seçime bağlı metinler ICU MessageFormat benzeri doğrulanan mesaj sözleşmesiyle; tarih/saat, yüzde, para ve sıralama Unicode CLDR/Intl ile yapılır. Terimler her dilde çekim gerektirebilir: kaba düz metin ikamesi yerine dil/bağlam varyantı veya tüm mesajın güvenli override'ı kullanılır.
5. URL/deep link dil bağlamını korur. Sunucu ilk HTML'yi doğru `lang` ve `dir` ile üretir; web/native/e-posta/sertifika aynı yayın sürümünü okur. Giriş ve yönlendirme izinleri dil parametresinden türetilmez.

## Control Center · Labels ve Dil Stüdyosu

Tenant sahibi veya `localization.manage` yetkili admini şunları yapar: ek dilin [marketplace](../../platform/control-center/language-marketplace.md) lisansını görür veya talep eder; lisanslı etkin dil kümesini ve portal varsayılanını ayarlar; temel paketi “kendime uyarla” diye açar; ürün/ekran/anahtar arar; yerel terimi ve izinli etiketi düzenler; 360–1920 ekran, açık/koyu, e-posta ve mobil görünümde taslak önizler; CSV/XLIFF benzeri aktarımı şema kontrolüyle alır/verir; yorum/onaydan sonra yayımlar veya önceki sürüme döner. Değişiklik yapan, onaylayan, tarih, eski/yeni değer ve yayın kapsamı audit'e yazılır. Deneme bitince diğer müşteri yazmaları gibi düzenleme/yayın komutları da salt okunur olur.

Yayımlanmamış taslak yalnızca yetkili editörde görünür. Etiket yayını atomik sürümlüdür; aktif oturumlar yeni manifest sürümünü alır. Tenant+locale+ürün+temel paket sürümü+overlay sürümü cache anahtarı kullanılır; çapraz tenant cache paylaşımı yoktur. Ürün yayını yeni anahtar eklediğinde OS Core TR/EN temel paketini önce günceller, ek dil işlerini açar. Yeni anahtarlar ve müşterinin değiştirmediği metinler otomatik senkronize olur. Müşterinin değiştirdiği değer **silinmez veya sessizce üzerine yazılmaz**; temel kaynak değişirse karşılaştırma/gözden geçirme işine düşer. Silinen/yeniden adlandırılan anahtar alias/deprecation haritasıyla taşınır. Artık kullanılmayan override sürüm geçmişinde tutulur. [Yükseltme algoritması](../../operations/respongo-hq/language-control.md).

Güvenlik: düz metin veya sınırlı, doğrulanan zengin metin bileşenleri; serbest HTML/JS, harici betik ve URL protokolü yasak. Placeholder isimleri/tipleri, ICU sözdizimi, uzunluk, bağlantı hedefi, erişilebilir ad ve düşük kontrast etkisi yayın öncesi denetlenir. İki tenant ve farklı rol testleri, draft sızıntısı, API/RLS yetkisi, eski sürüm geri alma ve cache invalidation ayrı kabul senaryolarıdır.

## Arayüz ve içerik ayrımı

- Tüm rol dashboardları ve ürün menüleri 10 dilde düzen bozunumu açısından test edilir. Arapça için RTL (sağdan sola) düzen, CSS mantıksal yönler, `dir`, yönlü ikon seçimi ve karma Latin/rakam metinleri ayrıca doğrulanır. Japonca/Çince için font fallback, satır kırımı ve arama/sıralama kontrol edilir.
- Native uygulama ve web aynı mesaj/terim sözleşmesini kullanır; platforma özgü erişilebilirlik metni ayrı anahtar olabilir. PDF/sertifika fontları seçilen yazı sistemini kapsar.
- Kullanıcı tarafından yazılmış içerik, SCORM ZIP içindeki metin veya üçüncü taraf katalog içeriği otomatik olarak 10 dile dönüşmüş sayılmaz. İçerik kaydı `source_locale`, mevcut `locale`, çeviri durumu, kaynak sürümü ve hak bilgisini taşır. GOAUTHOR AI taslak çeviri önerebilir; insan gözden geçirip yayımlar. GOFACTORY'de çeviri hizmeti teklif kapsamına bağlıdır.
- Bildirim/e-posta/sertifika şablonu alıcının uygun diliyle oluşturulur; teslimin dil ve şablon sürümü saklanır. Destek talebi kullanıcının seçtiği dilde açılabilir; iç ekip için gerekirse açıkça işaretli, insan kontrol edilen çeviri özeti hazırlanır.

## Veri/API taslağı ve kalite kapısı

Planlanan ortak kayıtlar: `supported_locales` (kod/yön/durum), `message_definitions` (namespace/key/tip/parametre/özelleştirilebilirlik), `language_pack_versions` ve `base_translations` (kod/ürün/sürüm/inceleme/checksum), `tenant_language_entitlements` (Super Admin lisansı), `tenant_locale_settings`, `tenant_term_versions`, `tenant_label_versions` ve yalnızca değişen satırları, `translation_jobs`, `user_locale_preferences`, `localization_audit`. Bunlar **uygulanmış Supabase tabloları değildir**. Ürün içerik çevirileri ürünün kendi sahipliğinde kalır. Okuma sözleşmesi: `locale`, `direction`, `basePackageVersion`, `tenantOverlayVersion`, `fallbackCount` ve ürün bazlı mesaj manifesti; yazma sözleşmesi sürüm eşzamanlılığı, tenant/ürün hakkı ve deneme kapısı kullanır. OS Core paket yayını, Super Admin lisans ve tenant admin komutları birbirinden ayrıdır.

Bir hedef dilin yayına alınması için: kritik kullanıcı akışlarında **%100 onaylı arayüz mesajı** (giriş, güvenlik, atama, ödeme/deneme, rapor, destek); tüm yayımlanan ürünlerde menü/dashboard/hata/boş durum; web+native+e-posta/PDF smoke; yerel konuşur veya nitelikli çevirmen incelemesi; arama/sıralama/format; erişilebilirlik; RTL ve yazı sistemi kontrolleri; tenant entitlement ve override'ın taslak/yayın/geri alma/yükseltme/çapraz tenant negatif testleri gerekir. Sahte metin uzatma (pseudo-localization) düzen testinden önce yapılır. Otomatik çeviri tek başına “destekli dil” kanıtı değildir.

Dayanaklar: [Unicode CLDR ve yerel biçimler](https://cldr.unicode.org/), [CLDR çoğul kuralları](https://cldr.unicode.org/index/cldr-spec/plural-rules), [Unicode dil tanımlayıcıları](https://www.unicode.org/reports/tr35/), [W3C dil etiketi](https://www.w3.org/International/tutorials/language-decl/index.en), [W3C RTL yönü](https://www.w3.org/International/questions/qa-html-dir), [FormatJS ICU mesaj sözdizimi](https://formatjs.github.io/docs/core-concepts/icu-syntax/).
