# GOLMS · Kurumsal Öğrenme Yönetim Sistemi

**Kullanıcı:** L&D yöneticisi, eğitmen, hat yöneticisi, öğrenen, uyum sorumlusu. **Sahiplik:** eğitim/program sürümü, zorunluluk, atama, SCORM/xAPI çalışma zamanı, sınav, girişim, tamamlanma, sertifika ve denetlenebilir rapor. Katalog lisansı GOCATALOG'un, sosyal öneri GOLXP'nin, özgün içerik üretimi GOAUTHOR AI'nin alanıdır.

**Ana akış:** içerik/hak doğrula → kurs ve program oluştur → SCORM 2004 ZIP/video/PDF/canlı oturum/anket/sınav/görev/kaynak adımlarını sırala → her adımın zorunluluk, geçiş, yeniden deneme, tarih ve tamamlanma kuralını ayarla → sürümü yayımla → kişi/ekip/hedef kitleye ata → öğrenen ilerlesin → rapor ve sertifika kanıtını üret. Taslak, yayın ve atama ayrı işlemdir; yayınlanmamış veya eksik paket atanmaz. Bir adım güncellenince önceki tamamlanma geçmişi sürümüyle korunur.

**Fark hipotezi:** “uyum kanıt dosyası” her gerekli eğitimin neden atandığını, hangi sürümün izlendiğini, sınav/görev delilini, tarih ve yenileme gereğini tek yerde açıklamalı. Özellikle İSG gibi zorunlu eğitimlerde hukukî zorunluluk şablonu müşterinin uzman onayı olmadan etkinleştirilmez. Eğitim tamamlama otomatik beceri veya iş performansı hükmü değildir.

**Rol yüzeyleri:** öğrenen, eğitmen, hat yöneticisi, learning admin, compliance admin ve report analyst ayrı iş kuyruğu ve yetki kapsamına sahiptir. Respongo support erişimi kalıcı rol değil, gerekçeli ve süreli destek oturumudur. Arayüzde rol önizlemesi gerçek yetki sağlamaz.

**İlk kabul:** sektör bağımsız iki tenant; SCORM 2004 örnek paketi yükleme, sıralı program, bireysel/ekip atama, öğrenen bitirme, yeniden deneme, rapor ve sertifika senaryosu; izin ve deneme bitiş negatif testleri. [Modül listesi](modules.md) takip kaynağından üretilir.

**10 dil sınırı:** program/atama/sınav/rapor/sertifika arayüzü seçilen dilde çalışır; eğitim ve SCORM paketinin kendi içeriği ancak mevcut dil sürümü varsa o dilde gösterilir. Göreli tarih, son gün, puan ve sertifika şablonu locale duyarlıdır; geçmiş deneme kanıtı çeviriden etkilenmez. Müşterinin görünen “eğitim/program” terimi değişebilir, protokol ve rapor kimlikleri değişmez.

## Mimari belgeler

- [İlk çalışan dikey dilim ve kalan kapsam](implementation-status.md)
- [Ürün mimarisi ve alan sözleşmeleri](product-architecture.md)
- [Rol ve yetenek matrisi](role-capability-matrix.md)
- [Ekran ve durum envanteri](screen-inventory.md)
- [Invince/UpsideLMS ekran arşivi denetimi](../../research/invince-upsidelms-screenshot-audit.md)
