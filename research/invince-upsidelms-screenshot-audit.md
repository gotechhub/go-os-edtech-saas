# Invince/UpsideLMS ekran arşivi denetimi

**İnceleme tarihi:** 2026-09-27  
**Kaynak:** `v1/upsidelms-saas-screenshot`  
**Amaç:** Ekran tasarımını kopyalamadan rol, menü, görev, veri ve operasyon kapsamını çıkarmak.

## Kapsam ve yöntem

Arşivdeki **547 PNG** rol klasörü ve dosya sırasıyla envantere alındı. Her klasör için numaralı temas sayfaları üretildi ve bütün sayfalar görsel olarak tarandı. Aynı dosya içeriğine sahip sekiz tekrar çifti ayrı özellik kanıtı sayılmadı. Temas sayfaları geçici çalışma çıktısıdır; V3 tasarım varlığı veya ürün ekranı değildir.

| Rol/kaynak | Görsel | İncelenen ana görevler |
|---|---:|---|
| Admin | 248 | İçerik, program, değerlendirme, atama, uyum, oturum, rapor, kullanıcı, yetkinlik, toplu işlem |
| Super admin | 181 | Müşteri/portal filosu, lisans, ortak içerik, ayar, entegrasyon, destek, marka, rapor |
| Learner | 47 | Öğrenme alanı, öğrenme geçmişi (transcript), uyum, yetkinlik, talepler, sosyal akış, oyunlaştırma |
| Mobile app | 48 | Mobil öğrenme, çevrimdışı içerik, bildirim, ekip ve sosyal görevler |
| Instructor | 12 | Oturum, yoklama, değerlendirme, soru ve içerik geri bildirimi |
| Line manager | 11 | Ekip riski, önerme/onay, talep, geri bildirim ve ekip raporu |
| **Toplam** | **547** | Altı yüzeyin bilgi mimarisi |

Denetim üç kanıt düzeyini ayırır:

1. **Ekranda görülen:** arşivde menü, form, liste veya rapor olarak bulunan işlev.
2. **Resmî ürün iddiası:** güncel üretici sayfasında anlatılan ancak arşivde aynı ayrıntıyla doğrulanmayan yetenek.
3. **Respongo kararı:** rakipten bağımsız olarak V3 hedefi ve kabul senaryosu.

## Arşivde görülen işlev kümeleri

### Admin

- Kurs, medya, görev, kaynak, anket, sınav, soru bankası ve değerlendirme yönetimi.
- Program/öğrenme haritası oluşturma; seviye, kategori, etiket ve ön koşul benzeri yapılandırma.
- Kişi/grup/program ataması, otomatik atama, sertifika ataması ve e-posta tetikleri.
- Sınıf ve sanal oturum; eğitmen, mekân, partner/tedarikçi, kapasite, envanter ve katılım.
- Zorunlu eğitim, dış sertifika, performans verisi ve toplu yükleme işlemleri.
- Yetkinlik, seviye, yetkinlik seti, rol eşleme ve skill-gap raporları.
- Duyuru, takvim, eğitim talebi, topluluk, puan, rozet ve liderlik tablosu.
- Program, kurs, sınav, oturum, kullanıcı, öğrenme geçmişi (transcript), uyum, yetkinlik ve denetim (audit) raporları.
- Profil, marka, SMTP, dil, güvenlik, destek ve çeşitli tenant ayarları.

### Super admin

- Müşteri/portal listesi, lisans, aktif kullanıcı, kullanım ve tamamlama özeti.
- Müşteri sitesi, alt site, yönetici, plan/lisans ve fatura benzeri filo operasyonları.
- Ortak içerik, soru bankası, değerlendirme, program, oturum, mekân, envanter ve tedarikçi havuzu.
- Tenant ayarları: SSO, marka, gamification, analiz, onay/metinler, mobil, mesajlaşma ve dış araçlar.
- İçerik sağlayıcı, LXP, yazarlık, AI assessment, yetkinlik, performans, belge, ödeme, S3, topluluk ve HRIS bağlantıları.
- Kullanıcı yükleme, rapor atama, sertifika şablonu, destek ve tenant genelinde label üretimi.

### Learner, instructor, line manager ve mobile

- Öğrenen: atanmış/devam/tamamlanan, takvim, öğrenme geçmişi (transcript), dış sertifika, yetkinlik/uyum, anket, belge ve talep.
- Eğitmen: oturum, yoklama, görev/sınav değerlendirme, öğrenen sorusu, kurs ve kaynak geri bildirimi.
- Hat yöneticisi: ekip ilerleme/riski, program önerme, aday gösterme/onay, talep ve ekip geri bildirimi.
- Mobil: görevlerin çoğuna erişim, çevrimdışı indirme, bildirim, sohbet, profil, sosyal ve ekip görünümü.

## Respongo sahiplik kararı

| Gözlenen alan | V3 sahibi | Sınır |
|---|---|---|
| Kurs, program, atama, deneme kaydı (attempt), sınav, oturum, uyum, sertifika, öğrenme geçmişi | **GOLMS** | Resmî öğrenme işlemi ve kanıtının sahibi |
| Beceri pasaportu, gelişim önerisi, topluluk, kürasyon, oyunlaştırma | **GOLXP** | GOLMS tamamlamasını okur; resmî deneme kaydı yazmaz |
| Kullanıcı, ekip, yönetici, rol, yetki ve temel yetkinlik sözlüğü | **Shared Platform** | Ürünler ortak sabit kimliği tüketir |
| İçerik sağlayıcı, teklif, lisans, seat, bölge ve dil hakkı | **GOCATALOG** | Öğrenme kaydı GOLMS'te kalır |
| E-posta/push teslimi, marka, destek, arama, audit, entegrasyon secret'ı | **Shared Platform / Control Center** | Ürün olay üretir; ortak servis teslim eder |
| Tenant filosu, plan/lisans, demo, destek müdahalesi, master şablon | **Respongo HQ** | Müşteri yöneticisi başka tenant veya HQ verisi göremez |
| Hedef, değerlendirme, 360 ve performans kanıtı | **GOPM** | Eğitim tamamlama otomatik performans puanı değildir |
| Tasarım/yazarlık ve yayın paketi | **GOAUTHOR AI** | GOLMS paketi tüketir; deneme kaydını GOLMS üretir |
| Respongo'nun müşteriye özel üretim hizmeti | **GOFACTORY** | SaaS yazarlık ürünü veya LMS değildir |

Bu ayrım, rakibin tek menü altında birleştirdiği görevleri mikroservis zorunluluğu yaratmadan açık alan sahipliğine ayırır. Kullanıcı tek kabukta çalışabilir; veri yazma yetkisi ilgili ürün sözleşmesinde kalır.

## Mevcut V3 planında bulunan boşluklar

Önceki GOLMS planı 12 geniş modülden oluşuyordu. Ekran arşivi ve resmî kaynak kontrolü aşağıdaki bağımsız kabul alanlarının eksik veya fazla birleşik olduğunu gösterdi:

- aday gösterme, onay, kendi kendine kayıt (self-enrollment) ve bekleme listesi;
- soru bankası/sınav ile anket/formun ayrı gizlilik ve ölçüm kuralları;
- iş başı görev, saha gözlemi, rubrik ve kanıt;
- sertifika yenileme/retraining, eşdeğerlik, muafiyet ve politika onayı;
- sınıf/sanal sınıf kapasitesi, mekân, envanter ve katılım uzlaştırma;
- eğitmen ve hat yöneticisi için ayrı görev alanları;
- training demand/eğitim talebi ve karar izi;
- toplu operasyon, satır bazlı hata ve idempotent yeniden deneme;
- içerik yaşam döngüsü, geri çekme ve geçmiş deneme kaydı koruma;
- denetçi ve uyum kanıt paketi;
- mobil çevrimdışı deneme kaydı senkronu;
- GOAI yardımcısının insan onaylı, ürün sınırında kullanımı.

Bu bulgular `LMS-01`–`LMS-24` olarak [GOLMS modül dökümüne](../products/golms/modules.md) ve [ürün mimarisine](../products/golms/product-architecture.md) işlendi.

## Tasarım değerlendirmesi

Arşiv Respongo OS için görsel referans kabul edilmez. Sık görülen sorunlar: çok uzun menü, aynı ağırlıkta yüzlerce seçenek, görev yerine modül odaklı navigasyon, yoğun form sayfaları, zayıf durum/boşluk hiyerarşisi ve mobilde masaüstü bilgi mimarisinin taşınmasıdır.

V3 yaklaşımı:

- rol ve o günkü göreve göre sade kabuk;
- arama/komut, iş kuyruğu ve bağlamsal hızlı eylem;
- listeden oluşturma, taslak, yayın, atama ve raporu ayrı durumlar olarak gösterme;
- yoğun yönetim görevlerinde tablo + filtre + toplu işlem; öğrenende görsel devam akışı;
- modern tırnaksız font, açık/koyu tema, WCAG 2.2 AA ve azaltılmış hareket;
- native mobilde en fazla beş ana hedef; geri kalan işlerin görev/drawer bağlamında açılması.

## Resmî kaynak kontrolü

- [Invince platform](https://www.invince.ai/) ve [Invince LXP](https://www.invince.ai/invince-lxp-ai-powered-learning-experience-platform): çoklu tenant, kişiselleştirme, beceri ve deneyim iddiaları için üretici kaynağı.
- [Invince UpsideLMS](https://www.invince.ai/upsidelms/software): LMS ürün konumlandırması ve entegrasyon iddiaları için üretici kaynağı.
- [Moodle Workplace multi-tenancy](https://moodle.com/news/multi-tenancy-moodle-workplace-3-9-2/): tenant, ortak program ve sertifikasyon karşılaştırması.
- [Docebo certification/retraining](https://help.docebo.com/hc/en-us/articles/360020083240-Managing-the-Certifications-and-retraining-app): sertifika yenileme akışı karşılaştırması.
- [Cornerstone compliance management](https://www.cornerstoneondemand.com/solutions/compliance-management/): otomatik atama, yenileme ve uyum hazırlığı karşılaştırması.
- [360Learning enterprise](https://website.360learning.com/enterprise/): iş birliğine dayalı öğrenme ve kurumsal kullanım karşılaştırması.

Üretici sayfaları bağımsız kalite kanıtı değildir. V3 kabulü çalışan rol senaryosu, tenant izolasyonu, erişilebilirlik, güvenlik ve tarihli test kanıtıyla yapılır.
