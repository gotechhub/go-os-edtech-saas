# GOAI Engine · ortak zekâ · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| AI-01 | F5 | Model ağ geçidi ve politika | 0/3 |
| AI-02 | F5 | Kaynaklı arama ve bilgi | 0/3 |
| AI-03 | F5 | Öneri ve beceri zekâsı | 0/3 |
| AI-04 | F5 | Doğal dille rapor ve agent işleri | 0/3 |
| AI-05 | F6 | AI değerlendirme ve izleme | 0/3 |
| AI-06 | F5 | Çok dilli AI ve çeviri güvenliği | 0/3 |
| AI-07 | F5 | İçerik zekâsı ve metadata yardımcısı | 0/3 |
| AI-08 | F5 | Ölçme ve değerlendirme yardımcısı | 0/3 |
| AI-09 | F5 | Rol bazlı operasyon yardımcıları | 0/3 |
| AI-10 | F5 | Context Engine ve ürün kayıt sözleşmesi | 0/3 |
| AI-11 | F5 | Tool Registry ve eylem risk modeli | 0/3 |
| AI-12 | F5 | Approval Engine ve yüksek etkili eylem | 0/3 |
| AI-13 | F5 | Agent, prompt ve politika yaşam döngüsü | 0/3 |
| AI-14 | F5 | GO Credits ve maliyet defteri | 0/3 |
| AI-15 | F5 | Konuşma, hafıza ve veri yaşam döngüsü | 0/3 |
| AI-16 | F5 | AI orkestrasyonu ve deterministik workflow sınırı | 0/3 |
| AI-17 | F6 | MCP ve dış AI istemci geçidi | 0/3 |
| AI-18 | F5 | Shared GOAI UI ve bağlamsal deneyim | 0/3 |

## AI-01 · Model ağ geçidi ve politika

Faz: **F5**. Alt modüller: Sağlayıcı soyutlama; Tenant/bölge izinleri; Kota/maliyet/deneme limiti.

**Kabul senaryosu:** Yetkisiz veri modele gitmez, limit aşımında çağrı durur.

## AI-02 · Kaynaklı arama ve bilgi

Faz: **F5**. Alt modüller: İzin kapsamlı indeks; Kaynak/provenans bağlantısı; Silme ve yeniden indeks.

**Kabul senaryosu:** İki tenant arasında sonuç sızmaz; kaynak geri çağrılır.

## AI-03 · Öneri ve beceri zekâsı

Faz: **F5**. Alt modüller: Neden gösterimi; İnsan onayı; Etkililik ölçümü.

**Kabul senaryosu:** Öneri açıklanır, reddedilir ve ölçüm nedensellik iddia etmez.

## AI-04 · Doğal dille rapor ve agent işleri

Faz: **F5**. Alt modüller: Yetkili sorgu planı; Onaylı aksiyon; Araç/audit sınırı.

**Kabul senaryosu:** Serbest metin, rolü aşan veri veya yazma işlemi üretemez.

## AI-05 · AI değerlendirme ve izleme

Faz: **F6**. Alt modüller: Kalite/güvenlik eval; Prompt/sürüm izi; Maliyet ve hata gözlemi.

**Kabul senaryosu:** Kritik gerileme yayını durdurur; örneklerde müşteri sırrı yoktur.

## AI-06 · Çok dilli AI ve çeviri güvenliği

Faz: **F5**. Alt modüller: Arayüz/kaynak/yanıt dili ayrımı; 10 dil kalite ve kaynaklılık eval'i; İzinli çeviri/insan onayı.

**Kabul senaryosu:** Model yanıtı seçilen dilde kaynaklıdır; tenant verisi ve gizli yorum izin dışına çıkmaz.

## AI-07 · İçerik zekâsı ve metadata yardımcısı

Faz: **F5**. Alt modüller: Özet/etiket/taksonomi taslağı; Beceri ve rol eşleme önerisi; Benzer/tekrar içerik sinyali; Kaynak ve güven skoru.

**Kabul senaryosu:** AI önerisi mevcut sözlüğe aday olarak düşer; insan onayı olmadan katalog veya beceri kimliği değiştirmez.

## AI-08 · Ölçme ve değerlendirme yardımcısı

Faz: **F5**. Alt modüller: Öğrenme çıktısından soru taslağı; Zorluk/yanıltıcı/önyargı kontrolü; Madde analizi önerisi; Uzman onayı ve sürüm.

**Kabul senaryosu:** AI sorusu kaynak, hedef ve uzman onayı olmadan canlı sınava girmez; model çıktısı cevap anahtarının tek kanıtı değildir.

## AI-09 · Rol bazlı operasyon yardımcıları

Faz: **F5**. Alt modüller: Admin/eğitmen/yönetici/öğrenen bağlamı; İzinli sıradaki iş önerisi; Önizleme-onay-uygulama; Araç kapsamı ve geri alma.

**Kabul senaryosu:** Yardımcı gerçek rolü aşamaz; yüksek etkili komut açık onay ve ürün API'si olmadan çalışmaz.

## AI-10 · Context Engine ve ürün kayıt sözleşmesi

Faz: **F5**. Alt modüller: Sunucuda tenant/rol/izin çözümleme; Ürün/rota/seçili nesne bağlamı; Veri sınıfı ve locale; Ürün tool/prompt registration.

**Kabul senaryosu:** İstemci sahte tenant, rol veya nesne gönderse de çözülmüş bağlam gerçek oturum ve nesne yetkisinden üretilir; her ürün yalnız kayıtlı araçlarını görür.

## AI-11 · Tool Registry ve eylem risk modeli

Faz: **F5**. Alt modüller: Sürümlü JSON giriş/çıkış şeması; R0–R4 risk sınıfı; Dry-run/bulk/idempotency; Ürün command/query adaptörü.

**Kabul senaryosu:** Model doğrudan DB yazamaz; her araç çağrısı izin, risk, kota ve ürün komutundan geçer, replay kayıt çoğaltmaz.

## AI-12 · Approval Engine ve yüksek etkili eylem

Faz: **F5**. Alt modüller: Etki özeti ve payload hash; Süreli/kapsamlı onay; Step-up ve ikinci onay; Değişiklikte yeniden onay.

**Kabul senaryosu:** Onaylanan payload veya araç sürümü değişirse işlem durur; R3/R4 eylem doğru aktör ve kapsam olmadan çalışmaz.

## AI-13 · Agent, prompt ve politika yaşam döngüsü

Faz: **F5**. Alt modüller: Agent/prompt/policy sürümü; Sandbox ve eval; Kademeli yayın; Rollback ve feature flag.

**Kabul senaryosu:** Yalnız eval ve onayı geçen sürüm pilot kapsamda açılır; gerilemede önceki agent/prompt sürümüne izlenebilir geri dönülür.

## AI-14 · GO Credits ve maliyet defteri

Faz: **F5**. Alt modüller: Kullanım rezervasyonu; Settlement/refund ledger; Tenant/ürün/birim bütçe; Provider gerçek maliyet ayrımı.

**Kabul senaryosu:** Aynı run yeniden işlense kredi iki kez düşmez; müşteri normalize GO Credit görür, provider maliyeti yalnız yetkili HQ rolüne açılır.

## AI-15 · Konuşma, hafıza ve veri yaşam döngüsü

Faz: **F5**. Alt modüller: Tenant kapsamlı conversation; Veri sınıfı/redaksiyon/şifreleme; Saklama/silme/legal hold; Kullanıcı tercih ve şeffaflık.

**Kabul senaryosu:** Silinen veya süresi dolan konuşma indeks/cache dahil politikaya göre kaldırılır; audit gereksiz ham prompt veya hassas veri göstermez.

## AI-16 · AI orkestrasyonu ve deterministik workflow sınırı

Faz: **F5**. Alt modüller: Plan/taslak üretimi; Kuyruk/worker/retry/iptal; Platform workflow devri; Ürün olayı ve sonuç doğrulama.

**Kabul senaryosu:** GOAI iş kuralının sahibi olmaz; uzun iş güvenli yeniden çalışır ve ürün sonucu doğrulanmadan başarılı sayılmaz.

## AI-17 · MCP ve dış AI istemci geçidi

Faz: **F6**. Alt modüller: OAuth/OIDC ve tenant scope; Read/write ayrımı; Kararlı Tool Registry yayını; Rate limit/onay/audit.

**Kabul senaryosu:** Dış istemci yalnız açık scope ve kararlı araçları kullanır; provider anahtarı veya iç servis yetkisi alamaz.

## AI-18 · Shared GOAI UI ve bağlamsal deneyim

Faz: **F5**. Alt modüller: Web/native ortak panel; Product registration; Kaynak/araç ilerleme/onay kartı; Non-modal desktop ve mobile sheet.

**Kabul senaryosu:** Ayrı GOAI learner/admin portalı olmadan aynı motor her üründe doğru bağlam, rol, kaynak ve onay deneyimiyle çalışır.
