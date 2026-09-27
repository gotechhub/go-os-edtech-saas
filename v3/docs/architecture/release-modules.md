# Yayın ve operasyon · modül dökümü

**Tek görev kaynağı:** [V3 takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| REL-00 | F1 | Beta barındırma ve GitOps temeli | 3/3 |
| REL-01 | F6 | CI/CD ve kalite kapıları | 0/3 |
| REL-02 | F6 | Gözlemlenebilirlik ve destek | 0/3 |
| REL-03 | F6 | Yedek, geri dönüş ve felaket kurtarma | 0/3 |
| REL-04 | F6 | Müşteri pilotu ve küresel hazırlık | 0/3 |
| REL-05 | F6 | 10 dil ve white-label yayın kabulü | 0/3 |
| REL-06 | F6 | Filo dil paketi yükseltme tatbikatı | 0/3 |

## REL-00 · Beta barındırma ve GitOps temeli

Faz: **F1**. Alt modüller: Kanonik GitHub deposu ve korumalı sürüm geçmişi; Supabase hosted proje ve migration temeli; Vercel Production/Preview yapılandırması ve otomatik dağıtım; Tek kanonik proje, ortam değişkeni ve canlı sağlık doğrulaması.

**Kabul senaryosu:** Kanonik main pushu tek Vercel projesinde Production dağıtımı üretir; canlı sayfa, güvenlik başlıkları ve Supabase Auth sağlığı doğrulanır; sırlar repoda tutulmaz.

## REL-01 · CI/CD ve kalite kapıları

Faz: **F6**. Alt modüller: Tip/test/görsel regresyon; Migration/RLS testleri; SBOM/bağımlılık kontrolü.

**Kabul senaryosu:** Başarısız kapı yayını durdurur; kanıt sürüme bağlıdır.

## REL-02 · Gözlemlenebilirlik ve destek

Faz: **F6**. Alt modüller: SLO/hata bütçesi; Log/trace/metric; Nöbet/olay runbook.

**Kabul senaryosu:** Gerçek beta alarmı sorumluya ulaşır ve olay tatbikatı yapılır.

## REL-03 · Yedek, geri dönüş ve felaket kurtarma

Faz: **F6**. Alt modüller: DB/S3 yedek; Geri yükleme tatbikatı; RPO/RTO.

**Kabul senaryosu:** Süre ve veri kaybı hedefleri tatbikatta ölçülür.

## REL-04 · Müşteri pilotu ve küresel hazırlık

Faz: **F6**. Alt modüller: Sektör bağımsız demo; UAT ve performans; Bölge/hukuk incelemesi.

**Kabul senaryosu:** Kritik hata sıfır, gerçek müşteri görevleri ve bölge kontrolleri tamam.

## REL-05 · 10 dil ve white-label yayın kabulü

Faz: **F6**. Alt modüller: Dil başına kritik mesaj %100 insan incelemesi; Web/native/e-posta/PDF ve tüm ürün smoke; Tenant lisansı/override/RTL negatif testleri.

**Kabul senaryosu:** Her etkin dil onaylı kapsam ve gerçek rol testleriyle açılır; çevrilmemiş dil destekli görünmez.

## REL-06 · Filo dil paketi yükseltme tatbikatı

Faz: **F6**. Alt modüller: Yüzlerce portal paket dağıtımı; Yeni ürün anahtarı ve müşteri varyantı birleşimi; Çakışma/geri dönüş/gözlem.

**Kabul senaryosu:** Kademeli sürümde yeni anahtarlar gelir, özelleştirme korunur ve hatalı paket topluca geri alınır.
