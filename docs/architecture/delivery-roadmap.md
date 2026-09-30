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
| 2 | F1 | Kimlik, tenant, rol, 14 günlük deneme, audit, dil, depolama, kuyruk ve API çekirdeği | İki tenant negatif testi ve deneme sonu bütün yazma kanallarında engel |
| 3 | F2 | Respongo OS Core ekranları ve ayrıcalıklı teknik komutlar | Müşteri rolü erişemez; komutlar MFA, gerekçe, onay ve audit üretir |
| 4 | F3 | Super Admin müşteri/portal filosu | İç demo, müşteri denemesi, lisans, destek ve portal yaşam döngüsü ayrıdır |
| 5 | F4 | Müşteri Control Center, rol kabukları ve tasarım sistemi | Müşteri yalnız kendi tenant'ını ve hak sahibi olduğu ürünleri yönetir |
| 6 | F5 | GOLMS öğrenme operasyonu | SCORM/program/atama/öğrenen/tamamlama/rapor uçtan uca çalışır |
| 7 | F6 | GOAUTHOR AI ve GOFACTORY | Müşteri yazarlığı ile Respongo üretim hizmeti veri ve onay bakımından ayrıdır |
| 8 | F7 | GOLXP ve GOCATALOG | Beceri/deneyim ile katalog/lisans sahipliği GOLMS kanıtına güvenli bağlanır |
| 9 | F8 | GOPM | Hedef, değerlendirme, 360 geri bildirim ve gelişim planı izinli kanıta bağlanır |
| 10 | F9 | GOAI orkestrasyonu | Agent araçları kaynak, risk, insan onayı, kredi ve eval kapılarını uygular |
| 11 | F10 | Küresel beta ve kurumsal yayın | Mobil, performans, erişilebilirlik, DR, gözlem ve UAT kapıları geçer |

## Paralel çalışma kuralı

- Bir sonraki ürünün araştırması ve sözleşme tasarımı paralel yürüyebilir.
- O ürünün kalıcı veri modeli ve kullanıcı ekranları, önceki çekirdek fazın kabulü tamamlanmadan beta kabulü alamaz.
- Güvenlik, yerelleştirme, tasarım sistemi, veri mimarisi, GOAI yönetişimi ve yayın mühendisliği her faza eşlik eder.
- GOLMS için daha önce yazılmış kod silinmez; F5 teknik başlangıç kanıtı olarak korunur. Yol haritasında yönetim katmanlarının önüne geçirilmez.

## Her fazın bitiş tanımı

Bir faz yalnız şu kanıtlar birlikte bulunduğunda kapanır: çalışan kod, migration/veri sözleşmesi, rol ve tenant negatif testleri, deneme/lisans kontrolü, responsive ve erişilebilirlik doğrulaması, güvenlik incelemesi, tarihli kabul kaydı ve geri alma yöntemi.
