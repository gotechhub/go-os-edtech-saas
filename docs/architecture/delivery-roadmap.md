# Respongo OS · uygulama ve teslim yol haritası

Bu belge uygulamanın **hangi sırayla** kurulacağını açıklar. Görev sayısı ve kabul durumu için tek kaynak [`project-tracker.json`](../../project-tracker.json) dosyasıdır.

## Yönetim katmanları

```text
Respongo OS Core
  └─ teknik sistem, güvenlik, sürüm, altyapı ve sağlayıcı yönetimi

Respongo Super Admin (HQ)
  └─ müşteri, portal, demo, lisans, sektör paketi, destek ve ticari operasyon

Müşteri Control Center
  └─ kuruluş, kullanıcı, marka, dil, ürün ayarı, rapor ve müşteri destek yönetimi

Ürün çalışma alanları
  └─ GOLMS → GOAUTHOR AI + GOFACTORY → GOLXP + GOCATALOG → GOPM

GOAI Engine
  └─ yukarıdaki katmanlara izinli araç, öneri, analiz ve otomasyon sağlar
```

## Yukarıdan aşağı uygulama sırası

| Sıra | Faz | Teslim | Sonraki kapıyı açan kanıt |
|---:|---|---|---|
| 1 | F0 | Araştırma, ürün sınırı, veri/tehdit modeli, UX ve kabul sözleşmesi | Açık kararlar sahipli ve tarihli; kritik belirsizlikler kayıtlı |
| 2 | F1 | Güvenli platform omurgasıyla birlikte Respongo OS Core ekranları ve ayrıcalıklı teknik komutlar | İki tenant negatif testi geçer; müşteri/Super Admin Core'a erişemez; komutlar MFA, gerekçe, onay ve audit üretir |
| 3 | F2 | Super Admin müşteri/portal filosu | İç demo, müşteri denemesi, lisans, destek ve portal yaşam döngüsü ayrıdır |
| 4 | F3 | Müşteri Control Center, rol kabukları ve tasarım sistemi | Müşteri yalnız kendi tenant'ını ve hak sahibi olduğu ürünleri yönetir |
| 5 | F4 | GOLMS öğrenme operasyonu | SCORM/program/atama/öğrenen/tamamlama/rapor uçtan uca çalışır |
| 6 | F5 | GOAUTHOR AI ve GOFACTORY | Müşteri yazarlığı ile Respongo üretim hizmeti veri ve onay bakımından ayrıdır |
| 7 | F6 | GOLXP ve GOCATALOG | Beceri/deneyim ile katalog/lisans sahipliği GOLMS kanıtına güvenli bağlanır |
| 8 | F7 | GOPM | Hedef, değerlendirme, 360 geri bildirim ve gelişim planı izinli kanıta bağlanır |
| 9 | F8 | GOAI orkestrasyonu | Agent araçları kaynak, risk, insan onayı, kredi ve eval kapılarını uygular |
| 10 | F9 | Küresel beta ve kurumsal yayın | Mobil, performans, erişilebilirlik, DR, gözlem ve UAT kapıları geçer |

F1'de platform omurgası ayrı bir son kullanıcı ürünü değildir. OS Core'un güvenli çalışması için gereken kimlik, tenant, yetki, deneme, audit, depolama ve iş kuyruğu sözleşmeleri ile aynı dikey dilimde üretilir. İlk görünür yönetim ürünü **Respongo OS Core**, ikinci görünür yönetim ürünü **Super Admin** olur.

## Paralel çalışma kuralı

- Bir sonraki ürünün araştırması, prototipi ve sözleşme tasarımı paralel yürüyebilir.
- O ürünün kalıcı veri modeli ve müşteri ekranları, önceki dalganın çekirdek kabulü tamamlanmadan beta kabulü alamaz.
- Güvenlik, yerelleştirme, tasarım sistemi, veri mimarisi, GOAI yönetişimi ve yayın mühendisliği her faza eşlik eder.
- GOLMS için daha önce yazılmış kod silinmez; F4 teknik başlangıç kanıtı olarak korunur. Yol haritasında yönetim katmanlarının önüne geçirilmez.

## Her fazın bitiş tanımı

Bir faz yalnız şu kanıtlar birlikte bulunduğunda kapanır: çalışan kod, migration/veri sözleşmesi, rol ve tenant negatif testleri, deneme/lisans kontrolü, responsive ve erişilebilirlik doğrulaması, güvenlik incelemesi, tarihli kabul kaydı ve geri alma yöntemi.
