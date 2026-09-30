# Ortak SaaS platformu · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| PLAT-01 | F1 | Kimlik ve oturum | 0/3 |
| PLAT-02 | F1 | Tenant, organizasyon ve roller | 0/3 |
| PLAT-03 | F1 | 14 günlük ortak deneme ve lisans | 0/3 |
| PLAT-04 | F1 | Marka ve sektör temaları | 0/3 |
| PLAT-05 | F1 | Varlık ve medya yönetimi | 0/3 |
| PLAT-06 | F1 | Bildirim ve iletişim | 0/3 |
| PLAT-07 | F1 | İş akışı, kuyruk ve audit | 0/3 |
| PLAT-08 | F1 | Destek ve bilgi merkezi | 0/3 |
| PLAT-09 | F4 | Ortak web/mobil kabuk ve API | 0/3 |
| PLAT-10 | F1 | 10 dilli mesaj ve terim altyapısı | 0/3 |
| PLAT-11 | F1 | Dil paketi overlay ve otomatik senkron | 0/3 |
| PLAT-12 | F1 | Kurum sözlüğü, rol ve yetkinlik çekirdeği | 0/3 |
| PLAT-13 | F1 | Arama, taksonomi ve kayıt bulma | 0/3 |
| PLAT-14 | F1 | Entegrasyon merkezi ve webhook yönetimi | 0/3 |
| PLAT-15 | F1 | Gizlilik, rıza ve veri yaşam döngüsü | 0/3 |

## PLAT-01 · Kimlik ve oturum

Faz: **F1**. Alt modüller: Davet/SSO/MFA; Oturum ve cihaz yönetimi; Hesap kurtarma.

**Kabul senaryosu:** Gerçek rollerle güvenli giriş/çıkış ve negatif yetki testleri geçer.

## PLAT-02 · Tenant, organizasyon ve roller

Faz: **F1**. Alt modüller: Kurum ve alt birimler; Kişi/ekip/yönetici bağı; Ürün kapsamlı yetkiler.

**Kabul senaryosu:** İki tenant ve çoklu rol arasında veri sızıntısı olmaz.

## PLAT-03 · 14 günlük ortak deneme ve lisans

Faz: **F1**. Alt modüller: İlk etkinleştirme saati; Ürün hakları ve kota; Bitişte API/DB salt okunur; İç demo istisnası.

**Kabul senaryosu:** Süre bitiminde hiçbir yazma kanalı açık kalmaz; yetkili okuma sürer.

## PLAT-04 · Marka ve sektör temaları

Faz: **F1**. Alt modüller: Tenant tema sürümleri; Sektör başlangıç şablonları; Web/mobil/e-posta marka tutarlılığı.

**Kabul senaryosu:** Marka aynı tenant içinde web, mobil ve e-postada tutarlı.

## PLAT-05 · Varlık ve medya yönetimi

Faz: **F1**. Alt modüller: Özel S3; İmzalı ve taranan yükleme; Sürüm/hak/alternatif metin.

**Kabul senaryosu:** Yanlış tenant ve taranmamış dosya hiçbir kanaldan okunamaz.

## PLAT-06 · Bildirim ve iletişim

Faz: **F1**. Alt modüller: E-posta şablonları; Uygulama içi ve push; Tercih/izin/teslim kaydı.

**Kabul senaryosu:** Olay, tercih ve teslim sonucu izlenir; yinelenen gönderim engellenir.

## PLAT-07 · İş akışı, kuyruk ve audit

Faz: **F1**. Alt modüller: Tekrarlanabilir işler; Zamanlayıcı/yeniden deneme; Değişmez denetim izi.

**Kabul senaryosu:** Hatalı iş güvenle tekrar edilir, aktör ve tenant izi kaybolmaz.

## PLAT-08 · Destek ve bilgi merkezi

Faz: **F1**. Alt modüller: Kullanıcı→müşteri admin→HQ aktarımı; SLA ve izinli müdahale; Bilgi makaleleri.

**Kabul senaryosu:** Kullanıcı talebi yetkili ekipler arasında izlenebilir kapanır.

## PLAT-09 · Ortak web/mobil kabuk ve API

Faz: **F4**. Alt modüller: Rol navigasyonu; Sürümleme ve API sözleşmesi; Çevrimdışı/yeniden bağlanma.

**Kabul senaryosu:** Beş rolün kritik görevi web ve mobilde aynı yetkiyle erişilebilir.

## PLAT-10 · 10 dilli mesaj ve terim altyapısı

Faz: **F1**. Alt modüller: Ürün ad alanlı sabit mesaj anahtarı; TR/EN dahil ve sekiz ek dil kaydı; CLDR/ICU biçim ve fallback; Sürümlü tenant terim/etiket yayını.

**Kabul senaryosu:** İki tenant ve 10 locale arasında doğru lisans, sürüm ve fallback çözülür; eksik kritik metin etkinleşmez.

## PLAT-11 · Dil paketi overlay ve otomatik senkron

Faz: **F1**. Alt modüller: Değişmez temel paket sürümü; Yalnızca değişen tenant etiketleri; Üç yönlü fark/çakışma/alias; Cache ve geri alma.

**Kabul senaryosu:** Temel pakete yeni anahtar gelince yüzlerce portal devralır; özelleştirilen değerler korunur ve çatışma görünür.

## PLAT-12 · Kurum sözlüğü, rol ve yetkinlik çekirdeği

Faz: **F1**. Alt modüller: Sürüm kontrollü rol/pozisyon/yetkinlik sözlüğü; Organizasyon ve yönetici ilişkileri; Ürünlerin kullandığı sabit kimlikler; Geçerlilik ve kaynak izi.

**Kabul senaryosu:** GOLMS, GOLXP ve GOPM aynı rol/yetkinlik kimliğini farklı anlam üretmeden okur; yalnızca yetkili sahip günceller.

## PLAT-13 · Arama, taksonomi ve kayıt bulma

Faz: **F1**. Alt modüller: Tenant kapsamlı ortak arama; Ürün/rol/locale filtreleri; Yetki öncesi indeksleme engeli; Silme ve yeniden indeksleme.

**Kabul senaryosu:** Arama sonucu kaynağın güncel yetkisini uygular; silinen veya başka tenant'a ait kayıt dönmez.

## PLAT-14 · Entegrasyon merkezi ve webhook yönetimi

Faz: **F1**. Alt modüller: Bağlayıcı kimliği ve secret kasası; Webhook imzası/idempotency/retry; Tenant kurulum sihirbazı; Sağlık ve kota görünümü.

**Kabul senaryosu:** Bir bağlayıcı arızası veri çoğaltmaz; secret istemciye çıkmaz ve müşteri yalnızca kendi kurulumunu yönetir.

## PLAT-15 · Gizlilik, rıza ve veri yaşam döngüsü

Faz: **F1**. Alt modüller: KVKK/GDPR metin ve onay sürümü; Saklama/silme/anonimleştirme politikası; Veri dışa aktarma talebi; Hukukî tutma ve audit.

**Kabul senaryosu:** Kullanıcı talebi tenant, ürün ve hukukî tutma kurallarını ihlal etmeden izlenebilir tamamlanır.
