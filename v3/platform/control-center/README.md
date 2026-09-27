# Control Center · müşterinin yönetim alanı

Tenant sahibi ve yetkili yöneticinin ürünlerini, kullanıcı/ekiplerini, marka ve portalını, eğitim/içerik ihtiyaçlarını, görev kuyruğunu, deneme/abonelik durumunu, raporlarını ve destek taleplerini yönettiği müşteri alanıdır. HQ iç CRM, global portal filosu veya başka müşterinin verisi burada yer almaz. Birden çok ürünün ayarı ve sağlık özeti gösterilir; her iş komutu ilgili ürünün yetkili API'sinde kalır.

**İlk gün rehberi:** kuruluş profili → marka/tema → kullanıcı ve ekip → ürün etkinleştirme → içerik/uyum kontrol listesi → ilk program/yol → atama → ilerleme/rapor. Her eksik varlık, gerçek veri durumuna bağlanan yapılacak iş olarak görünür. 14 günlük deneme sayacı tek tenant saati olarak açık gösterilir; bitiş sonrası veri yetkili salt okunur ve yükseltme yolu nettir.

**Yönetici deneyimi:** veri yoğun ama sade gösterge paneli, anlık/önbellek/veri eski etiketi, toplu işlem, rehberli boş durum, kişiye özel yetkili eylem, destek eskalasyonu ve mobil temel iş akışları. [Modüller](modules.md).

**Dil Marketplace ve Labels Stüdyosu:** yetkili admin, dahil TR/EN paketini ve HQ'nun yayımladığı lisanslı ek dil kartlarını görür; ek dili talep edip hak tanımlanınca portalına etkinleştirir. Temel dil paketinin görünen terim/izinli etiketlerini overlay olarak özelleştirir; masaüstü, mobil, açık/koyu ve bildirim önizlemesini görür; onaylayıp yayımlar veya geri alır. Yeni temel sürümde eklenen metinler otomatik gelir, müşteri değişiklikleri korunur ve çakışmalar incelemeye düşer. Teknik anahtar, yetki, rapor ölçüsü veya hukukî metin bu editörle değişmez. Türkçe varsayılan kalabilir; kullanıcı kendi uygun dilini seçebilir. [Müşteri akışı](language-marketplace.md) · [teknik sözleşme](../../docs/architecture/localization-white-label.md).

**Operasyon kapsamı:** kurulum kontrol listesi, tenant veri kalite merkezi, entegrasyon sağlığı, çapraz ürün rapor/audit görünümü ve güvenli iletişim şablon stüdyosu. Ürün içi program/sınav/performans kuralı burada tekrar uygulanmaz; Control Center ilgili ürün komutunu yetkiyle çağırır.
