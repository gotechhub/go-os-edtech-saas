# Respongo OS · beta kapasite ve maliyet karar temeli

Bu belge fiyat tahmini değildir. Ölçülmeden “milyonlarca kullanıcı” kapasitesi ilan edilmesini önleyen yük profili, bütçe ölçümü ve AWS geçiş kapılarını tanımlar. Gerçek limitler pilot telemetrisi ve sağlayıcı sözleşmeleriyle doldurulur.

## Ölçülecek beta profili

| Profil | Ölçü | İlk test kademeleri | Başarı sinyali |
|---|---|---|---|
| Kimlik/portal | eşzamanlı oturum ve giriş/davet | 25 → 100 → 500 eşzamanlı | Hata oranı, p95 süre, Auth kota alarmı |
| Dashboard/read model | istek/s ve tenant başına veri | 25 → 100 → 300 istek/s | p95 API, DB CPU/IO, eski veri oranı |
| Program/atama | toplu kullanıcı ve idempotent iş | 100 → 1.000 → 10.000 hedef | Çift atama yok, kuyruk gecikmesi ve geri alma |
| SCORM/video | eşzamanlı launch ve bant genişliği | 25 → 100 → 500 launch | Player hata oranı, CDN hit, kanıt kaybı yok |
| Rapor/export | satır, kuyruk süresi ve bellek | 10 bin → 100 bin → 1 milyon satır | İstek timeout'u yok; süreli indirme ve audit |
| Bildirim/webhook | olay/s ve retry | 10 → 100 → 500 olay/s | Tek teslim, dead-letter ve sağlayıcı kota görünümü |
| GOAI | run eşzamanlılığı ve kredi | 5 → 25 → 100 run | Bütçe aşımı yok; p95, hata ve kaynaklılık ölçümü |

Bu değerler ürün vaadi değildir; test kademesidir. İlk beta hedefi gerçek pilot büyüklüğü belirlendiğinde tracker kanıtına yazılır.

## Maliyet defteri

Her ay tenant ve ürün bazında şu birimler toplanır: Vercel compute/egress, Supabase DB/storage/realtime/Auth, S3 storage/request/egress, CloudFront, worker/kuyruk, e-posta/push, malware tarama, gözlemleme ve AI provider gerçek maliyeti. Müşteriye gösterilen paket/kredi ile provider maliyeti ayrı defterdir.

Alarm seviyeleri başlangıçta para tutarı uydurmaz; bütçenin yüzde 50/75/90/100 tüketimi, birim maliyette haftalık sapma ve tenant başına anomali kullanır. Ticari bütçe onaylandıktan sonra mutlak limitler secret olmayan ortam ayarı ve tarihli kararla eklenir.

## AWS geçiş karar kapıları

Tam AWS geçişi yalnız aşağıdakilerden biri kanıtlandığında açılır:

1. Ölçülen SLO veya kapasite Vercel/Supabase sınırında sürdürülemiyor.
2. Müşteri sözleşmesi/veri ikameti mevcut yerleşimi kabul etmiyor.
3. Toplam sahip olma maliyeti, ölçülen kullanımda AWS geçiş maliyeti ve operasyon yükü dâhil daha iyi.
4. Bağımsız yayın/bölge/iş kuyruğu ihtiyacı modüler monolitte güvenli karşılanamıyor.

Geçiş; PostgreSQL/RLS, Auth, oturum, obje anahtarı, CDN, worker/kuyruk, secret, gözlem, yedek, DNS ve rollback'i birlikte kapsar. Yalnız veritabanını taşımak geçiş sayılmaz.

## Ölçüm kanıtı

F0 bu plan ve sahiplikle kapanabilir. `FOUND-04` kabulü ise gerçek yük testi sonucu, ölçülmüş maliyet birimleri, darboğaz düzeltmesi ve geri dönüş kapasitesi olmadan doğrulanmaz.
