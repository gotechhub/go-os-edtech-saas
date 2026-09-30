# Super Admin · müşteri ve portal yönetimi · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| HQ-01 | F3 | Portal filosu ve demo fabrikası | 0/3 |
| HQ-02 | F3 | Müşteri 360 ve satış operasyonu | 0/3 |
| HQ-03 | F3 | Destek ve müdahale merkezi | 0/3 |
| HQ-04 | F3 | Müşteri filosu sağlığı ve risk görünümü | 0/3 |
| HQ-05 | F3 | Dil paketi ürünleştirme ve yayın talebi | 0/3 |
| HQ-06 | F3 | Dil lisansı ve portal filosuna dağıtım | 0/3 |
| HQ-07 | F3 | Paket, lisans, kullanım ve ticari operasyon | 0/3 |
| HQ-08 | F3 | Sektör paketleri ve ana şablon kütüphanesi | 0/3 |
| HQ-09 | F3 | Müşteri entegrasyon uygunluğu ve kurulum devri | 0/3 |
| HQ-10 | F3 | Tenant özellik rollout ve müşteri iletişimi | 0/3 |
| HQ-11 | F3 | Tenant GOAI planı, kredi ve kullanım operasyonu | 0/3 |

## HQ-01 · Portal filosu ve demo fabrikası

Faz: **F3**. Alt modüller: Sektör/ürün seçerek portal açma; İç demo/deneme ayrımı; Yaşam döngüsü ve kapatma.

**Kabul senaryosu:** İç demo müşteri denemesini başlatmadan açılıp yönetilir.

## HQ-02 · Müşteri 360 ve satış operasyonu

Faz: **F3**. Alt modüller: Aday/kurum hesabı; Teklif/sözleşme referansı; Ürün hakları ve yenileme.

**Kabul senaryosu:** İç ekip müşteri durumunu görür; müşteri HQ verisini göremez.

## HQ-03 · Destek ve müdahale merkezi

Faz: **F3**. Alt modüller: Tüm tenant talepleri; SLA/escalation; İzinli destek oturumu.

**Kabul senaryosu:** Müdahale süreli, kapsamlı ve audit kayıtlıdır.

## HQ-04 · Müşteri filosu sağlığı ve risk görünümü

Faz: **F3**. Alt modüller: Tenant hizmet durumu; Kota ve kullanım riski; Destek ve yenileme sinyalleri; Teknik olayı Core'a aktarma.

**Kabul senaryosu:** Super Admin müşteri etkisini görür ve teknik olayı OS Core'a kayıtlı biçimde devreder; altyapı komutu çalıştırmaz.

## HQ-05 · Dil paketi ürünleştirme ve yayın talebi

Faz: **F3**. Alt modüller: TR/EN temel ve sekiz ek dil teklifi; Ticari paket ve kapsam; Çeviri/QA yayın talebi; Müşteri uygunluk görünümü.

**Kabul senaryosu:** Super Admin dil paketini müşteriye sunar; ana mesaj kataloğunu yalnız OS Core yetkili yayın akışı değiştirir.

## HQ-06 · Dil lisansı ve portal filosuna dağıtım

Faz: **F3**. Alt modüller: Marketplace paket yayını; Tenant entitlement ve toplu atama; Pilot/kademeli rollout; Filo sürümü/çakışma/rollback.

**Kabul senaryosu:** HQ ek dili iki portala farklı hakla atar; yükseltme ve rollback diğer portalları veya tenant override'ını bozmaz.

## HQ-07 · Paket, lisans, kullanım ve ticari operasyon

Faz: **F3**. Alt modüller: Ürün/özellik plan kataloğu; Kota/seat/kullanım ölçümü; Deneme-dönüşüm-yenileme; Fatura ve ödeme sağlayıcı sınırı.

**Kabul senaryosu:** HQ plan değişikliğini tarihli hak sürümüyle uygular; müşteri yalnızca kendi ticari ve kullanım özetini görür.

## HQ-08 · Sektör paketleri ve ana şablon kütüphanesi

Faz: **F3**. Alt modüller: Sektör rol/politika/checklist şablonu; Portal başlangıç verisi; Marka/sertifika/e-posta şablonları; Sürüm ve tenant devralma.

**Kabul senaryosu:** Yeni portal şablondan açılır; sonraki ana şablon güncellemesi müşteri değişikliklerini üzerine yazmaz.

## HQ-09 · Müşteri entegrasyon uygunluğu ve kurulum devri

Faz: **F3**. Alt modüller: SSO/HRIS/VILT ihtiyaç kaydı; Sözleşme ve veri işleme uygunluğu; Tenant kurulum kapsamı; Core entegrasyon ekibine devir.

**Kabul senaryosu:** Onaysız entegrasyon müşteriye satılmaz; teknik sağlayıcı ve secret işlemleri OS Core'da kalır.

## HQ-10 · Tenant özellik rollout ve müşteri iletişimi

Faz: **F3**. Alt modüller: Pilot müşteri seçimi; Tenant/ürün uygunluk onayı; Yayın iletişimi; Geri bildirim ve etki kaydı.

**Kabul senaryosu:** Super Admin pilot kapsamını ve müşteri iletişimini yönetir; teknik feature flag ve rollback OS Core tarafından uygulanır.

## HQ-11 · Tenant GOAI planı, kredi ve kullanım operasyonu

Faz: **F3**. Alt modüller: Tenant AI planı; Kredi ve bütçe ataması; Kullanım ve anomali görünümü; Model özelliği uygunluğu.

**Kabul senaryosu:** Super Admin tenant planını yönetir; provider secret, model rotası, eval ve kill switch OS Core'da kalır.
