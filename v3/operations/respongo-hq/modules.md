# Respongo HQ · iç yönetim · modül dökümü

**Tek görev kaynağı:** [V3 takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| HQ-01 | F1 | Portal filosu ve demo fabrikası | 0/3 |
| HQ-02 | F1 | Müşteri 360 ve satış operasyonu | 0/3 |
| HQ-03 | F1 | Destek ve müdahale merkezi | 0/3 |
| HQ-04 | F6 | Güvenlik, maliyet ve sistem sağlığı | 0/3 |
| HQ-05 | F1 | Temel dil kataloğu ve çeviri operasyonu | 0/3 |
| HQ-06 | F1 | Dil lisansı ve portal filosuna dağıtım | 0/3 |
| HQ-07 | F1 | Paket, lisans, kullanım ve ticari operasyon | 0/3 |
| HQ-08 | F1 | Sektör paketleri ve ana şablon kütüphanesi | 0/3 |
| HQ-09 | F1 | Sağlayıcı ve entegrasyon kayıt merkezi | 0/3 |
| HQ-10 | F6 | Sürüm, özellik bayrağı ve filo rollout | 0/3 |
| HQ-11 | F5 | GOAI sağlayıcı ve platform operasyonu | 0/3 |

## HQ-01 · Portal filosu ve demo fabrikası

Faz: **F1**. Alt modüller: Sektör/ürün seçerek portal açma; İç demo/deneme ayrımı; Yaşam döngüsü ve kapatma.

**Kabul senaryosu:** İç demo müşteri denemesini başlatmadan açılıp yönetilir.

## HQ-02 · Müşteri 360 ve satış operasyonu

Faz: **F1**. Alt modüller: Aday/kurum hesabı; Teklif/sözleşme referansı; Ürün hakları ve yenileme.

**Kabul senaryosu:** İç ekip müşteri durumunu görür; müşteri HQ verisini göremez.

## HQ-03 · Destek ve müdahale merkezi

Faz: **F1**. Alt modüller: Tüm tenant talepleri; SLA/escalation; İzinli destek oturumu.

**Kabul senaryosu:** Müdahale süreli, kapsamlı ve audit kayıtlıdır.

## HQ-04 · Güvenlik, maliyet ve sistem sağlığı

Faz: **F6**. Alt modüller: İş/entegrasyon panosu; Kota/fatura izleme; Olay ve audit inceleme.

**Kabul senaryosu:** Kritik olay alarm ve sorumluyla sonuçlanır.

## HQ-05 · Temel dil kataloğu ve çeviri operasyonu

Faz: **F1**. Alt modüller: TR/EN dahil ve sekiz ek dil çevirisi; Ürün mesaj sürümü ve insan QA; Eksik/korumalı anahtar raporu; AI taslağı ve insan yayını.

**Kabul senaryosu:** İç operatör tüm ürünlerde dil kapsamını görür; onaysız otomatik çeviri müşteriye açılmaz.

## HQ-06 · Dil lisansı ve portal filosuna dağıtım

Faz: **F1**. Alt modüller: Marketplace paket yayını; Tenant entitlement ve toplu atama; Pilot/kademeli rollout; Filo sürümü/çakışma/rollback.

**Kabul senaryosu:** HQ ek dili iki portala farklı hakla atar; yükseltme ve rollback diğer portalları veya tenant override'ını bozmaz.

## HQ-07 · Paket, lisans, kullanım ve ticari operasyon

Faz: **F1**. Alt modüller: Ürün/özellik plan kataloğu; Kota/seat/kullanım ölçümü; Deneme-dönüşüm-yenileme; Fatura ve ödeme sağlayıcı sınırı.

**Kabul senaryosu:** HQ plan değişikliğini tarihli hak sürümüyle uygular; müşteri yalnızca kendi ticari ve kullanım özetini görür.

## HQ-08 · Sektör paketleri ve ana şablon kütüphanesi

Faz: **F1**. Alt modüller: Sektör rol/politika/checklist şablonu; Portal başlangıç verisi; Marka/sertifika/e-posta şablonları; Sürüm ve tenant devralma.

**Kabul senaryosu:** Yeni portal şablondan açılır; sonraki ana şablon güncellemesi müşteri değişikliklerini üzerine yazmaz.

## HQ-09 · Sağlayıcı ve entegrasyon kayıt merkezi

Faz: **F1**. Alt modüller: SSO/HRIS/VILT/içerik sağlayıcı kaydı; Sözleşme ve veri işleme durumu; Bağlayıcı sürümü ve kesinti; Tenant uygunluk matrisi.

**Kabul senaryosu:** Onaysız veya süresi bitmiş sağlayıcı yeni tenant'a etkinleştirilemez; mevcut kullanım etkisi görünür.

## HQ-10 · Sürüm, özellik bayrağı ve filo rollout

Faz: **F6**. Alt modüller: Pilot/kademeli yayın; Tenant ve ürün kapsamlı feature flag; Geri alma/kill switch; Sürüm kabul ve sağlık kanıtı.

**Kabul senaryosu:** Kritik sürüm pilot portala açılır, ölçülür ve sorun halinde diğer tenantları etkilemeden geri alınır.

## HQ-11 · GOAI sağlayıcı ve platform operasyonu

Faz: **F5**. Alt modüller: Provider secret referansı ve sağlık; Global model/bölge rotası; Platform maliyeti ve kredi oranı; Eval/rollout/kill switch.

**Kabul senaryosu:** HQ sağlayıcı ve modeli tenant içeriğini varsayılan olarak açmadan yönetir; secret istemciye çıkmaz, kritik eval gerilemesi rollout'u durdurur.
