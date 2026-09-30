# Control Center · müşteri yönetimi · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| CC-01 | F3 | Müşteri yönetici ana ekranı | 0/3 |
| CC-02 | F3 | Kurum, ekip ve yetki | 0/3 |
| CC-03 | F3 | Ürün ayarları ve markalama | 0/3 |
| CC-04 | F3 | Rapor, destek ve deneme görünümü | 0/3 |
| CC-05 | F3 | Dil ve Labels Stüdyosu | 0/3 |
| CC-06 | F3 | Dil Marketplace ve ek lisans | 0/3 |
| CC-07 | F3 | Kurulum rehberi ve operasyon kontrol listesi | 0/3 |
| CC-08 | F3 | Entegrasyon ve veri kalitesi merkezi | 0/3 |
| CC-09 | F3 | Çapraz ürün rapor ve audit merkezi | 0/3 |
| CC-10 | F3 | İletişim ve şablon stüdyosu | 0/3 |
| CC-11 | F3 | Tenant GOAI yönetişimi | 0/3 |

## CC-01 · Müşteri yönetici ana ekranı

Faz: **F3**. Alt modüller: Yapılacaklar ve riskler; Ürün/deneme özeti; Kullanım ve sağlık.

**Kabul senaryosu:** Yönetici bugün gereken üç işi ve sahiplerini tek ekranda bulur.

## CC-02 · Kurum, ekip ve yetki

Faz: **F3**. Alt modüller: Kullanıcı daveti/import; Ekip ve yönetici atama; Rol ve onay zinciri.

**Kabul senaryosu:** Yetki değişikliği bütün ürünlerde tutarlı ve denetlenebilir.

## CC-03 · Ürün ayarları ve markalama

Faz: **F3**. Alt modüller: Etkin ürünler; Sektör ve tema; Bildirim/SSO/entegrasyon.

**Kabul senaryosu:** Müşteri yalnızca hakkı olan ayarı değiştirir ve önizler.

## CC-04 · Rapor, destek ve deneme görünümü

Faz: **F3**. Alt modüller: Çapraz ürün kullanım; Destek aktarımı; Deneme kalan gün/salt okunur.

**Kabul senaryosu:** Deneme durumu ve rapor verisi bütün yüzeylerde aynı.

## CC-05 · Dil ve Labels Stüdyosu

Faz: **F3**. Alt modüller: Varsayılan/etkin dil ayarı; Ürünler arası terim ve izinli etiket overlay'i; Taslak önizleme/onay/yayın/geri alma; Yeni temel sürüm farkı ve audit.

**Kabul senaryosu:** Müşteri admini lisanslı dilde görünen terimi yayımlar; temel güncelleme kendi değişikliğini bozmaz.

## CC-06 · Dil Marketplace ve ek lisans

Faz: **F3**. Alt modüller: TR/EN dahil görünümü; Ek dil kartı/hazırlık/fiyat veya talep; HQ lisansı sonrası etkinleştirme; Süre sonu güvenli fallback.

**Kabul senaryosu:** Ek lisansı olmayan müşteri dili açamaz; entitlement sonrası açar, lisans bitince verisi silinmeden TR/EN'e döner.

## CC-07 · Kurulum rehberi ve operasyon kontrol listesi

Faz: **F3**. Alt modüller: Kuruluş/marka/ekip/ürün adımları; Eksik varlık ve sorumlu; Hazırlık yüzdesi ve kanıt; Sektör önerisi.

**Kabul senaryosu:** Müşteri admini ilk canlı kullanıma kadar eksik işi, sahibini ve doğrulama durumunu tek ekranda izler.

## CC-08 · Entegrasyon ve veri kalitesi merkezi

Faz: **F3**. Alt modüller: Bağlayıcı kurulum/devir; Senkron hata kuyruğu; CSV eşleme ve önizleme; Sağlık/son başarılı çalışma.

**Kabul senaryosu:** Yönetici hatalı satırı veya bağlayıcıyı görür, güvenli yeniden dener ve veri çoğaltmaz.

## CC-09 · Çapraz ürün rapor ve audit merkezi

Faz: **F3**. Alt modüller: Yetkili kullanım ve sonuç özeti; Veri tazeliği/kökeni; Dışa aktarım ve zamanlama; Yönetici audit görünümü.

**Kabul senaryosu:** Müşteri admini yalnızca yetkili ürün verisini aynı ölçü tanımı ve tazelik etiketiyle raporlar.

## CC-10 · İletişim ve şablon stüdyosu

Faz: **F3**. Alt modüller: E-posta/push/uygulama içi şablon; Ürün olayı ve alıcı kuralı; Önizleme/test gönderimi; Sürüm/geri alma.

**Kabul senaryosu:** Müşteri güvenli değişkenlerle şablon yayımlar; sistem ve hukukî mesajların korumalı alanlarını değiştiremez.

## CC-11 · Tenant GOAI yönetişimi

Faz: **F3**. Alt modüller: Etkin agent ve ürün özellikleri; Bilgi kaynağı ve araç izinleri; Bütçe/onay kuyruğu; Tenant audit ve saklama görünümü.

**Kabul senaryosu:** Müşteri yöneticisi yalnızca kendi tenant AI kapsamını yönetir; global provider sırrı, platform maliyeti veya başka tenant verisi göremez.
