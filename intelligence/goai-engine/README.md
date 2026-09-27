# GOAI Engine · Ortak öğrenme ve yetenek zekâ motoru

GOAI ayrı bir learner/admin uygulaması veya SaaS ürün kutusu değildir. GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI ve GOFACTORY deneyimlerinin içinde çalışan ortak zekâ katmanıdır. GOAI ayrı müşteri veri sahibi olmaz; ürünlerin izinli araçlarına, bilgi kaynaklarına ve onay akışlarına hizmet verir. Ürün kuralı ve verisi ürün sahibinde kalır.

**Kanonik karar:** [GOAI ürün ve teknik mimarisi](product-architecture.md). Müşteri AI yönetişimi Control Center'da, global sağlayıcı/secret/maliyet/eval/rollout operasyonu Respongo HQ'dadır.

**Sözleşme:** her istem tenant/rol/ürün/amaç bağlamı, veri sınıflandırması, kaynak bağlantıları, maliyet sınırı ve iz kimliği taşır. Okuma önce yetki süzgecinden geçer; yüksek etkili yazma önerisi ürün komutu + insan onayı olmadan işlemez. Model cevabı karar kanıtı değil, doğrulanacak öneridir. Eğitim ve performans verisinde yanlış nedensellik, ayrımcılık, kaynak uydurma ve çapraz tenant sızıntısı değerlendirilir.

**Fark hipotezi:** ürünler arasında “sıradaki iş” üretirken gerekçeyi, kaynak sürümünü, yetkili sınırı, maliyeti ve insan onayını aynı izde göstermek. Bu, rakiplerde yok iddiası değil; kullanıcı görevi ve güvenlik testleriyle ölçülecek öneridir. [Modüller](modules.md).

**10 dil sınırı:** kullanıcı arayüz dili, istemin kaynak dili ve model yanıt dili ayrı parametrelerdir. Modelin Türkçe veya diğer dokuz dilde kaynak bağlı cevap, çeviri doğruluğu ve yazı sistemi QA'sı ölçülür; müşteri etiket sözlüğü teknik araç/rol kimliğine dönüştürülmez. İçerik çevirisi ancak veri işleme izni ve insan yayın onayıyla yapılır.

**Genişletilmiş kapsam:** içerik metadata/taksonomi yardımcısı, ölçme-değerlendirme yardımcısı ve rol bazlı operasyon yardımcıları. Bunlar ayrı iş sahibi değildir; öneri veya komut ilgili ürün API'sinde, insan onayı ve audit iziyle çalışır.
