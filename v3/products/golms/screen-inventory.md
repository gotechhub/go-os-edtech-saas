# GOLMS ekran ve durum envanteri

Bu envanter tasarım briefidir; tamamlanma kanıtı değildir. Her ekran masaüstü, tablet ve ilgili mobil görev için `loading`, `loaded`, `empty`, `filtered_empty`, `error`, `forbidden`, `offline` ve `stale` durumlarını kapsar.

## Ortak kabuk

- Rol bazlı ana navigasyon, tenant/portal bağlamı ve ürün değiştirici.
- Global arama/komut, bildirim, yardım, dil, tema ve profil.
- Gerçek rol ile açıkça işaretli demo rol önizlemesinin ayrımı.
- Breadcrumb, sayfa başlığı, veri tazeliği ve bağlamsal ana eylem.

## Learning admin

- Genel bakış ve bugünün iş kuyruğu.
- Eğitim nesnesi listesi, detay, sürüm, erişim ve yayın akışı.
- Program listesi, program stüdyosu, adım editörü, kural ve önizleme.
- Atama listesi, hedef kitle kurucu, aday/onay/bekleme ve toplu işlem.
- Soru bankası, sınav stüdyosu, deneme ve madde analizi.
- Anket/form şablonu ve sonuç görünümü.
- Görev/rubrik/gözlem şablonu ve değerlendirme kuyruğu.
- Uyum gereksinimi, politika, istisna, eşdeğerlik ve kanıt paketi.
- Sertifika şablonu, üretim (issuance), doğrulama ve yenileme.
- Etkinlik/sınıf/oturum, takvim, kapasite, mekân, eğitmen ve katılım.
- Eğitim talepleri ve karar/sonuç bağlantısı.
- Standart rapor kataloğu, rapor kurucu, zamanlama ve export merkezi.
- Import merkezi, eşleme, önizleme, hata düzeltme ve geçmiş.
- Entegrasyon bağlantısı ve ürün sağlık görünümü.

## Learner

- Ana sayfa: devam et, zorunlu/geciken, yaklaşan oturum, yolculuk ve başarı.
- Atanan, devam eden, tamamlanan ve keşfedilebilir eğitim listeleri.
- Eğitim/program detay ve içerik player kabuğu.
- Sınav, anket, görev teslimi, geri bildirim ve yeniden deneme.
- Takvim, kayıt/bekleme ve canlı oturum katılımı.
- Transcript, sertifika, dış kanıt ve doğrulama durumu.
- Yetkinlik kanıt özeti; ayrıntılı pasaport için GOLXP bağlantısı.
- Eğitim talebi, soru/yardım ve destek aktarımı.

## Instructor

- Bugünün oturumları ve değerlendirme kuyruğu.
- Oturum detay, katılımcı, yoklama ve not.
- Görev/sınav değerlendirme, rubrik ve geri bildirim.
- Öğrenen soruları, duyuru ve sınıf iletişimi.
- Atanmış içerik ve sınıf ilerleme raporu.

## Line manager

- Ekip uyum riski ve yaklaşan/geciken işler.
- Ekip üyesi öğrenme özeti ve izinli öğrenme geçmişi (transcript).
- Program önerme, aday gösterme, onay ve bekleyen talep.
- Gözlem/geri bildirim ve gelişim işi.
- Ekip raporu ve export sınırı.

## Compliance admin ve report analyst

- Politika/gereksinim kütüphanesi ve kapsam kurucu.
- İstisna/eşdeğerlik/yenileme iş kuyruğu.
- Regulator kanıt paketi ve saklama/audit.
- Ölçü sözlüğü, rapor kataloğu, veri tazeliği ve planlı dağıtım.

## Mobil görev haritası

- Alt navigasyon: Ana sayfa, Öğrenmelerim, Takvim, Bildirimler, Profil.
- Yönetici/eğitmen için görev kuyruğu ve bağlamsal drawer.
- Güvenli çevrimdışı indirme, depolama durumu ve cihaz iptali.
- Push → doğru tenant/atama/oturum deep link'i.
- Bağlantı geri geldiğinde senkron durumu ve çözülemeyen çakışma mesajı.

Yoğun program/sınav/rapor editörleri mobilde responsive web modülü olabilir; görüntüleme, onay, küçük düzeltme ve görev tamamlama native kalır.
