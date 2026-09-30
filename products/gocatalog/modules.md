# GOCATALOG · içerik kataloğu · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| CAT-01 | F6 | Katalog ve ihtiyaç haritası | 0/3 |
| CAT-02 | F6 | Tedarikçi ve hak yönetimi | 0/3 |
| CAT-03 | F6 | Ticari talep ve erişim | 0/3 |
| CAT-04 | F6 | Koleksiyon ve LMS devri | 0/3 |
| CAT-05 | F6 | Kullanım ve yenileme analizi | 0/3 |
| CAT-06 | F6 | Çok dilli katalog ve lisans görünümü | 0/3 |
| CAT-07 | F6 | Sağlayıcı bağlantısı ve katalog alımı | 0/3 |
| CAT-08 | F6 | İçerik kalite, eşdeğerlik ve sürüm yönetimi | 0/3 |
| CAT-09 | F6 | Satın alma, sipariş ve lisans operasyonu | 0/3 |

## CAT-01 · Katalog ve ihtiyaç haritası

Faz: **F6**. Alt modüller: Sektör/rol koleksiyonu; İçerik meta verisi; Eksik/yenileme checklist.

**Kabul senaryosu:** Yönetici ihtiyaçtan hazır veya eksik içerik kararına gider.

## CAT-02 · Tedarikçi ve hak yönetimi

Faz: **F6**. Alt modüller: Partner onboarding; Lisans kapsamı/süre; Kullanım hakkı kanıtı.

**Kabul senaryosu:** Hak yoksa içerik atanmaz veya oynatılamaz.

## CAT-03 · Ticari talep ve erişim

Faz: **F6**. Alt modüller: Deneme/talep; Teklif/onay; Ürün ve seat entitlement.

**Kabul senaryosu:** Üçüncü taraf lisansı 14 günlük SaaS denemesine otomatik girmez.

## CAT-04 · Koleksiyon ve LMS devri

Faz: **F6**. Alt modüller: Kürasyon; Sürümlü katalog kimliği; LMS ataması ve geri bağlantı.

**Kabul senaryosu:** Erişim kesilince öğrenme kaydı silinmez, oynatma hakkı kesilir.

## CAT-05 · Kullanım ve yenileme analizi

Faz: **F6**. Alt modüller: Hak-kullanım oranı; Sonlanma uyarısı; Tedarikçi raporu.

**Kabul senaryosu:** Yenileme kararı gerçek lisans ve kullanım verisine dayanır.

## CAT-06 · Çok dilli katalog ve lisans görünümü

Faz: **F6**. Alt modüller: Yerel arama/filtre; Sağlayıcı içerik dil hakkı; Dil sürümlü açıklama ve lisans.

**Kabul senaryosu:** Portal dili değişince olmayan partner içerik çevirisi veya lisans hakkı varmış gibi gösterilmez.

## CAT-07 · Sağlayıcı bağlantısı ve katalog alımı

Faz: **F6**. Alt modüller: API/feed/dosya alımı; Kimlik eşleme ve tekrar engelleme; Görsel/metadata/hak doğrulama; Hata ve güncelleme kuyruğu.

**Kabul senaryosu:** Sağlayıcı güncellemesi aynı içeriği çoğaltmaz; bozuk metadata veya hak kaydı yayımlanmaz.

## CAT-08 · İçerik kalite, eşdeğerlik ve sürüm yönetimi

Faz: **F6**. Alt modüller: Kalite/erişilebilirlik/güncellik kontrolü; Aynı eğitimin dil/sağlayıcı sürümleri; Eşdeğerlik ve yerine geçme; İnceleme/geri çekme.

**Kabul senaryosu:** Eşdeğer içerik kararı kaynak ve onayla izlenir; geri çekme geçmiş öğrenme kaydını silmez.

## CAT-09 · Satın alma, sipariş ve lisans operasyonu

Faz: **F6**. Alt modüller: Teklif/sipariş/onay; Seat/kota/bölge/dil hakkı; Aktivasyon ve tahsis; Yenileme/iptal/iade sınırı.

**Kabul senaryosu:** Ticari onay ve sağlayıcı hakkı tamamlanmadan GOLMS oynatma hakkı açılmaz.
