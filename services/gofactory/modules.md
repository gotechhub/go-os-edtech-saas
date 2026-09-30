# GOFACTORY · yönetilen üretim hizmeti · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| FACT-01 | F5 | Beş adımlı müşteri talebi | 0/3 |
| FACT-02 | F5 | Kapsam ve teklif | 0/3 |
| FACT-03 | F5 | Üretim iş akışı | 0/3 |
| FACT-04 | F5 | Revizyon ve onay | 0/3 |
| FACT-05 | F5 | Güvenli teslim ve arşiv | 0/3 |
| FACT-06 | F5 | Hizmet raporu ve destek | 0/3 |
| FACT-07 | F5 | Çok dilli üretim talebi ve teslim | 0/3 |
| FACT-08 | F5 | Kapasite, ekip ve tedarikçi planlama | 0/3 |
| FACT-09 | F5 | Değişiklik talebi, SLA ve ticari iz | 0/3 |

## FACT-01 · Beş adımlı müşteri talebi

Faz: **F5**. Alt modüller: Hedef/kitle; Format; Kaynak/hak; Takvim/onaycı; Özet/gönderim.

**Kabul senaryosu:** Müşteri talep gönderir; otomatik fiyat/teslim taahhüdü doğmaz.

## FACT-02 · Kapsam ve teklif

Faz: **F5**. Alt modüller: Respongo ön değerlendirme; Kapsam/varsayım/fiyat; Müşteri onayı ve değişiklik.

**Kabul senaryosu:** Üretim ancak onaylı kapsam ve sorumlu ile başlar.

## FACT-03 · Üretim iş akışı

Faz: **F5**. Alt modüller: Brief ve üretim adımları; İş atama/tarih; Kaynak ve hak kontrolü.

**Kabul senaryosu:** Müşteri ve iç ekip kendilerine açık aşama ve işi görür.

## FACT-04 · Revizyon ve onay

Faz: **F5**. Alt modüller: Sürüm/yorum; Onaycı ve son tarih; Geri gönderim ve audit.

**Kabul senaryosu:** Yanlış sürüm yayımlanamaz; onay izi korunur.

## FACT-05 · Güvenli teslim ve arşiv

Faz: **F5**. Alt modüller: Web ve SCORM bağlantısı; Dosya/erişim süresi; Tarama ve teslim sürümü.

**Kabul senaryosu:** Yalnızca onaylı/taranmış teslim yetkili müşteriye açılır.

## FACT-06 · Hizmet raporu ve destek

Faz: **F5**. Alt modüller: Proje zamanı/durum; Müşteri talepleri; Tamamlanan iş arşivi.

**Kabul senaryosu:** Geçmiş proje ve teslim linkleri hak süresince izlenir.

## FACT-07 · Çok dilli üretim talebi ve teslim

Faz: **F5**. Alt modüller: Talepte kaynak/hedef dil ve hak; Çevirmen/onaycı ve teklif kapsamı; Dil sürümlü teslim dosyaları.

**Kabul senaryosu:** Müşteri çok dilli üretim kapsamını ayrı onaylar; arayüz dili ücretsiz teslim çevirisi başlatmaz.

## FACT-08 · Kapasite, ekip ve tedarikçi planlama

Faz: **F5**. Alt modüller: Yetkinlik/rol bazlı kaynak; İç ekip ve dış tedarikçi; Kapasite/takvim/çakışma; Erişim ve gizlilik sınırı.

**Kabul senaryosu:** Onaylı proje uygun kapasiteye atanır; dış tedarikçi yalnızca iş paketinin izinli verisini görür.

## FACT-09 · Değişiklik talebi, SLA ve ticari iz

Faz: **F5**. Alt modüller: Kapsam değişikliği; Süre/maliyet/teslim etkisi; Müşteri onayı; SLA ve gecikme gerekçesi.

**Kabul senaryosu:** Onaysız kapsam değişikliği üretim planını veya ticari kaydı değiştirmez; etki sürümlü görünür.
