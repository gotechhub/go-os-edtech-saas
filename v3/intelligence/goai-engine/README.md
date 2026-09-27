# GOAI Engine · Ortak öğrenme ve yetenek zekâ motoru

GOAI ayrı müşteri veri sahibi değildir; ürünlerin izinli araçlarına, bilgi kaynaklarına ve onay akışlarına hizmet verir. Sağlayıcı geçidi (model/provider adapter), kullanım/kredi, içerik getirme, öneri, agent görevleri, değerlendirme ve güvenlik ilkesi burada tanımlanır. Ürün kuralı ürün sahibinde kalır.

**Sözleşme:** her istem tenant/rol/ürün/amaç bağlamı, veri sınıflandırması, kaynak bağlantıları, maliyet sınırı ve iz kimliği taşır. Okuma önce yetki süzgecinden geçer; yüksek etkili yazma önerisi ürün komutu + insan onayı olmadan işlemez. Model cevabı karar kanıtı değil, doğrulanacak öneridir. Eğitim ve performans verisinde yanlış nedensellik, ayrımcılık, kaynak uydurma ve çapraz tenant sızıntısı değerlendirilir.

**Fark hipotezi:** ürünler arasında “sıradaki iş” üretirken gerekçeyi, kaynak sürümünü, yetkili sınırı, maliyeti ve insan onayını aynı izde göstermek. Bu, rakiplerde yok iddiası değil; kullanıcı görevi ve güvenlik testleriyle ölçülecek öneridir. [Modüller](modules.md).

**10 dil sınırı:** kullanıcı arayüz dili, istemin kaynak dili ve model yanıt dili ayrı parametrelerdir. Modelin Türkçe veya diğer dokuz dilde kaynak bağlı cevap, çeviri doğruluğu ve yazı sistemi QA'sı ölçülür; müşteri etiket sözlüğü teknik araç/rol kimliğine dönüştürülmez. İçerik çevirisi ancak veri işleme izni ve insan yayın onayıyla yapılır.

**Genişletilmiş kapsam:** içerik metadata/taksonomi yardımcısı, ölçme-değerlendirme yardımcısı ve rol bazlı operasyon yardımcıları. Bunlar ayrı iş sahibi değildir; öneri veya komut ilgili ürün API'sinde, insan onayı ve audit iziyle çalışır.
