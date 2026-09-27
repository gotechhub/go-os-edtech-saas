# GOLMS ürün mimarisi

Bu belge GOLMS'in alan sınırını, alt alanlarını, işlem durumlarını ve diğer Respongo ürünleriyle sözleşmesini tanımlar. Uygulama durumu ve kabul görevleri yalnızca [Respongo OS takip dosyasından](../../project-tracker.json) yönetilir.

## Ürün amacı

GOLMS; bir öğrenme gereksiniminin **neden** oluştuğunu, kime **hangi sürümün** atandığını, öğrenenin **ne yaptığını**, hangi değerlendirme ve onayla **tamamlandığını** ve kanıtın ne kadar süre **geçerli** olduğunu yönetir.

Temel ürün ilkeleri:

- Taslak, inceleme, yayın, atama, başlatma, tamamlama ve kanıt ayrı durumlardır.
- Yayındaki içerik değişmez sürümdür; düzeltme yeni sürüm üretir.
- Bir completion (tamamlama) tek başına beceri ustalığı veya performans kararı değildir.
- Rapor; işlem tablosundan bağımsız, elle düzeltilen ikinci gerçeklik kaynağı olamaz.
- Tenant, rol ve deneme/lisans kuralı yalnızca arayüzde değil komut, API ve veritabanında uygulanır.
- Zorunlu eğitim politikası hukukî/kurumsal sahibi tarafından onaylanmadan etkinleşmez.

## Alan haritası

| Alt alan | Sahip olduğu kayıtlar | Sahip olmadığı kayıtlar |
|---|---|---|
| Content governance | Öğrenme nesnesi, sürüm, erişim, dil, yayın/geri çekme | Ham medya depolama politikası ve partner lisansı |
| Curriculum | Program, bölüm, adım, ön koşul, dallanma, sürüm | Kişisel GOLXP gelişim yolculuğu |
| Enrollment | Atama, kayıt, aday gösterme, onay, bekleme, istisna | Kullanıcı/ekip ana kaydı |
| Çalışma zamanı (runtime) | Başlatma (launch), deneme kaydı (attempt), SCORM/xAPI/cmi5/LTI durumu | GOAUTHOR kaynak projesi |
| Assessment | Soru/sınav/deneme/puan/itiraz | GOPM performans değerlendirmesi |
| Kanıt (evidence) | Görev, gözlem, öğrenme geçmişi (transcript), sertifika, dış kanıt | Beceri pasaportunun nihai seviye hükmü |
| Compliance | Gereksinim, yenileme, muafiyet, eşdeğerlik, politika onayı | Hukukî metnin uzman onayı |
| Sessions | Sınıf, oturum, kapasite, katılım, mekân ve eğitmen ataması | Ortak kimlik/organizasyon kaydı |
| Reporting | Öğrenme ölçü sözlüğü, rapor tanımı, dağıtım talebi | Platformun e-posta/push teslimi |

## Zorunlu durum makineleri

### İçerik ve program

`draft → in_review → approved → published → retired → archived`

- `published` sürüm yerinde değiştirilmez.
- Atama yayın sürümünü sabitler; yeni sürüme geçiş ayrı karar ve etki analizi ister.
- `retired` (geri çekildi) yeni başlatmayı engelleyebilir; geçmiş deneme kaydı ve kanıt korunur.

### Atama ve kayıt

`proposed → pending_approval → assigned → available → in_progress → completed | failed | expired | cancelled | exempted`

- Her geçiş aktör, neden, zaman, tenant, kural ve sürüm taşır.
- Dinamik hedef kuralının sonucu anlık liste değil, izlenebilir üyelik gerekçesi üretir.
- Yeniden atama önceki deneme kaydını (attempt) silmez.

### Attempt ve değerlendirme

`created → launched → active → suspended → submitted → evaluated → completed | failed | invalidated`

- Aynı istemci isteği tekrar güvenliği anahtarıyla (idempotency key) ikinci deneme kaydı üretmez.
- Çevrimdışı olaylar cihaz, sıralama ve kaynak zamanıyla uzlaştırılır.
- Puan düzeltmesi orijinal sonuç, yeni sonuç, gerekçe ve yetkiliyi korur.

### Sertifika ve kanıt

`pending → issued → valid → expiring → expired | revoked | superseded`

- Sertifika şablonu, locale, seri, kaynak completion ve doğrulama URL'si sürümlüdür.
- Yeniden eğitim (retraining) yeni atama/deneme kaydı üretir; eski kanıtın üzerine yazmaz.

## Yetkinlik sınırı

Shared Platform rol/yetkinlik sözlüğünün sahibidir. GOLMS şu kayıtları üretir:

- bu kurs/program hangi yetkinlik kimliğine hangi öğrenme çıktısıyla bağlı;
- hangi sınav/görev/gözlem bu çıktıya kanıt sağladı;
- kanıtı kim doğruladı, güven seviyesi ve geçerlilik süresi;
- GOLXP beceri pasaportuna gönderilecek izinli, sürümlü olay.

GOLMS kullanıcı için kesin beceri seviyesi, rol hazırlığı veya kariyer önerisi hesaplamaz. Bunlar GOLXP alanında, kaynak ve belirsizlik gösterilerek üretilir.

## Roller ve yetki modeli

| Rol | Birincil işler | Kritik sınır |
|---|---|---|
| Learner (öğrenen) | Atamayı görme, içeriği oynatma, sınav/görev, öğrenme geçmişi ve talep | Başka kullanıcının deneme kaydını veya kanıtını okuyamaz |
| Instructor (eğitmen) | Atanmış sınıf, yoklama, değerlendirme ve soru yanıtlama | Tüm tenant veya ilgisiz sınıfı göremez |
| Line manager (hat yöneticisi) | Geçerli ekibi izleme, önerme, onay, geri bildirim | Organizasyon ağacı dışına çıkamaz |
| Tenant learning admin | İçerik/program/atama/uyum/rapor yönetimi | HQ ve başka tenant verisine erişemez |
| Compliance admin (uyum yöneticisi) | Politika, muafiyet, kanıt ve denetçi paketi | Genel kullanıcı veya ticari HQ işlevi kazanmaz |
| Report analyst | Onaylı ölçü ve veri kapsamıyla rapor | Operasyon komutu çalıştıramaz |
| Respongo support | Gerekçeli, süreli, kapsamlı destek oturumu | Kalıcı tenant admin rolü edinemez |

Rol görünümü demo amacıyla değiştirilebilir; bu yalnızca ekran önizlemesidir ve gerçek yetki sağlamaz.

## Ürünler arası sözleşmeler

| Kaynak → hedef | Sözleşme | Yasak |
|---|---|---|
| Platform → GOLMS | Tenant, kişi, ekip, yönetici, rol, yetkinlik kimliği, entitlement | GOLMS'in ortak ana kaydı kopyalaması |
| GOCATALOG → GOLMS | İçerik kimliği, sürüm, dil/bölge/seat hakkı, oynatma şartı | Hak yokken dosyayı doğrudan açma |
| GOAUTHOR → GOLMS | İmzalı yayın manifesti, paket, etkileşim sözleşmesi, sürüm | Taslak projenin doğrudan deneme kaydı üretmesi |
| GOLMS → GOLXP | Atama/tamamlama/kanıt özeti ve yetkinlik kanıtı olayı | GOLXP'nin GOLMS deneme kaydına yazması |
| GOLMS → GOPM | Kullanıcının izin verdiği gelişim kanıtı | Tamamlamayı otomatik performans notu yapmak |
| GOAI → GOLMS | Kaynaklı taslak/öneri/sorgu planı | İnsan onaysız yayın, atama, puan veya sertifika |
| GOLMS → Platform | Bildirim işi, audit olayı, asset erişim talebi | Secret veya teslim altyapısını ürün içinde çoğaltma |

Her sözleşme `tenant_id`, `actor_id`, `correlation_id`, `schema_version`, `occurred_at`, `data_classification` ve idempotency bilgisi taşır.

## Rapor ölçü sözlüğü

İlk sürümde en az şu kavramlar tekil tanımlanır:

- assigned, available, started, active, submitted, completed, passed, failed, overdue;
- completion rate paydası ve hariç tutulan durumlar;
- compliance current / expiring / overdue / exempt;
- attendance source ve uzlaştırma durumu;
- certificate valid / expiring / expired / revoked;
- deneme (attempt) sayısı, en yüksek/son puan ve geçme kuralı;
- veri tazeliği, hesaplama zamanı ve kaynak sürümü.

Gösterge paneli, CSV, API, zamanlı rapor ve denetçi paketi aynı sözlüğü kullanır.

## Güvenlik ve operasyon kapıları

- SCORM ZIP: path traversal, çalıştırılabilir dosya, boyut/sayı limiti, manifest ve malware kontrolü.
- Player: ayrı origin/sandbox, CSP, kısa ömürlü launch bileti ve kaynak tenant doğrulaması.
- Import: önizleme, satır bazlı doğrulama, idempotency, kısmi hata raporu ve geri alma planı.
- Rapor/export: rol kapsamı, veri sınıfı, tek kullanımlık indirme, süre ve audit.
- Dış entegrasyon: gizli anahtar kasası, webhook imzası, yeniden deneme/başarısız iş kuyruğu (retry/dead-letter) ve sözleşme sürümü.
- AI: kaynak, kota, PII politikası, prompt/model sürümü, insan onayı ve eval kapısı.

## Üretim önceliği

1. Ortak tenant/kimlik/yetki/deneme iskeleti.
2. GOLMS içerik → program → atama dikey dilimi.
3. SCORM 2004 yükleme, güvenli başlatma (launch), deneme kaydı ve tamamlama.
4. Öğrenen/eğitmen/yönetici görev alanları.
5. Sınav/görev/uyum/sertifika kanıt zinciri.
6. Rapor, toplu operasyon, entegrasyon ve mobil çevrimdışı çalışma.

İlk dikey dilim tamamlanmış sayılmak için aynı tenantta adminin program oluşturması, öğrenene ataması, öğrenenin açıp tamamlaması ve adminin aynı deneme kaydını raporda görmesi gerekir. Ekran görüntüsü veya örnek veri (seed) bu kabulün yerine geçmez.

