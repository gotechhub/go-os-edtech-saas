# Güvenlik, işletim ve altyapı

## Beta yerleşimi

- GitHub: kod, inceleme, CI ve sürüm geçmişi. Sırlar GitHub/Vercel/Supabase/AWS gizli kasalarında; repoda yalnızca değişken adları.
- Vercel: Next.js web ve kısa süreli yetkili API/BFF (arka uç arayüzü). Uzun medya dönüştürme, toplu rapor ve AI işleri HTTP isteğinde yapılmaz.
- Supabase: PostgreSQL, Auth ve uygun gerçek zamanlı özellikler; tenant RLS ve migration kapıları. Büyük ölçek için bağlantı, sorgu, indeks, arşiv ve bölümleme ihtiyacı ölçülür.
- Amazon S3: özel dosya/video/paket nesne deposu. S3 veritabanı veya uygulama sunucusu değildir. Kısa ömürlü imzalı URL, karantina → tarama/format/hak kontrolü → sürümlü yayın anahtarı kullanılır. Üretim içeriği ve müşteri dosyaları için ayrı erişim politikası.
- Arka plan işleri: sürümlü görev/olay sözleşmesi, tekrar çalıştırmaya dayanıklılık, yeniden deneme, dead-letter (başarısız iş kuyruğu), izleme. Beta worker sağlayıcısı F1 teknik araştırma/kapasite kararında seçilir; veri modeli sağlayıcıya kilitlenmez.

## Güvenlik kapıları

1. Auth: MFA iç HQ için zorunlu; tenant SSO OIDC/SAML ve SCIM sağlayıcı desteği sözleşme ve testle açılır. Yetki kararları sunucu tarafında ve veri komutunda; sadece menü saklamak güvenlik değildir.
2. Her tabloda tenant RLS, güvenlik tanımlayıcı fonksiyon gözden geçirmesi, iki tenant ve beş rol negatif testleri. İç operatör tenant verisine gerekçeli, zaman sınırlı destek oturumu olmadan erişemez.
3. Dosya: tip/uzantı/gerçek MIME, boyut, zip-bomb, path traversal, makro/aktif içerik, zararlı dosya, telif ve lisans denetimi. Tarama yoksa yayın yok. SCORM izole alan/CSP ile açılır; dış pakete servis anahtarı verilmez.
4. AI: PII azaltma, tenant/ACL kapsamında retrieval (bilgi getirme), sağlayıcı/veri bölgesi politikası, prompt injection (istem enjeksiyonu) savunması, maliyet limiti, kaynak gösterimi, insan onayı ve audit. Model DB'ye doğrudan yazmaz; yalnız kayıtlı ürün aracı kullanır. R2–R4 onayı payload hash/süre/kapsama bağlıdır. Provider sırrı secret manager'da kalır. Ham prompt/yanıt koşulsuz audit edilmez; veri sınıfına göre redaksiyon, şifreleme ve saklama uygulanır.
5. KVKK/GDPR: hukuki dayanak, aydınlatma/rıza ayrımı, veri işleyen sözleşmeleri, erişim/silme/dışa aktarma süreçleri hukuk incelemesiyle tamamlanır; bu plan hukuki uygunluk beyanı değildir.
6. Yedek/geri yükleme, anahtar döndürme, olay müdahalesi, güvenlik taraması ve bağımlılık incelemesi sürüm kapısıdır.

## GOAI işletim ayrımı

- Control Center müşteriye yalnız kendi tenant agent/knowledge/bütçe/izin/onay/audit ayarını sunar.
- Respongo HQ provider secret, global model route, gerçek provider maliyeti, eval, feature flag ve kill switch yönetir.
- HQ operatörü süreli destek oturumu olmadan tenant konuşma veya belge içeriğini açamaz; filo analitiği varsayılan olarak redakte/toplulaştırılmıştır.
- Provider fallback veri sınıfı, bölge veya sözleşme politikasını düşüremez. Düşük güvenli sağlayıcıya sessiz geçiş yerine güvenli hata verilir.
- AI run, araç çağrısı, onay, kredi hareketi ve ürün sonucu ortak trace/request kimliğiyle bağlanır; loglarda secret ve gereksiz kişisel veri bulunmaz.

## Ölçek ve AWS geçişi

“Milyonlarca kullanıcı” başlangıç kapasitesi vaadi değildir. Yük profili tenant, eşzamanlı oturum, medya bant genişliği, yazma hızı ve rapor karmaşıklığıyla ölçülür. Önce indeks/önbellek/kuyruk/CDN/read model; sonra gerektiğinde bölgesel ayrım veya servis ayrıştırma. SLO (hizmet seviyesi hedefi) ve yük testi pilot ölçümünden türetilir.

AWS'ye geçiş ayrı programdır: Postgres şema/veri/RLS ve Auth kimlik eşleme, oturumlar, obje anahtarları, kuyruk/worker, e-posta/push, DNS, anahtarlar, yedekler, veri bölgesi, kesinti/geri dönüş. Önce prova ve checksum/hesap eşleştirmesi; sadece veritabanını taşımak yeterli değildir.
