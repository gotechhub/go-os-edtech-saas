# Faz ve kabul kapıları

Bir modülün üç ayrı takip adımı vardır: **tanımla** (araştırma, sahiplik, kullanıcı akışı, veri/yetki/UX), **üret** (çalışan kod ve migration), **kabul** (otomatik test, erişilebilirlik, tenant/rol negatif senaryosu, gerçek kullanıcı görevi ve tarihli kanıt). Platform ve GOLMS temelinin kodu üretilmeye başlanmış ve ilk hosted dağıtım temeli doğrulanmıştır; fakat takipteki hiçbir modül tüm kabul kanıtlarını tamamlamadığı için henüz `verified` değildir.

1. Araştırma kapısı: kaynaklar güncel, rekabet iddiası doğrulanmış, kullanıcının en sık işi ölçülmüş.
2. Mimari kapı: veri sahipliği, API/olay sürümü, iki tenant ve HQ ayrımı, 14 günlük deneme akışı kararlaştırılmış.
3. Tasarım kapısı: beş rolün kritik görevi; 360/390/768/1280/1440/1920; light/dark; klavye/ekran okuyucu; düşük hareket; kullanıcı testi; 10 hedef dilde metin uzaması ve Arapça RTL.
4. Güvenlik kapısı: RLS/komut/rol/tenant/deneme negatif testleri, yükleme taraması, gizli veri kontrolü, audit ve geri alma.
5. Ürün kapısı: gerçek veriyle en az bir uçtan uca akış; hata/boş/yükleniyor/çevrimdışı durumları; rapor tutarlılığı ve destek yolu.
6. Yayın kapısı: hosted migration ve geri dönüş tatbikatı, izleme, hata bütçesi, yedek/geri yükleme, müşteri UAT (kullanıcı kabul testi), operasyon el kitabı. Her dil için insan incelemesi, kritik mesaj kapsamı, native/web/bildirim/PDF deneyi ve müşteri etiketinin çapraz tenant negatif testi ayrı kanıttır.

Takip yüzdesi yalnızca `project-tracker.json` içindeki tarihli `verified` adımlardan hesaplanır. Ekran görüntüsü, derleme başarısı veya genel bir AI incelemesi tek başına ürün kabulü değildir.

## İlk hosted temel kanıtı — 2026-09-27

- GitHub: temiz V3 `main` dalı ve geri izlenebilir commit zinciri.
- Supabase: üç migration uygulandı ve uzak migration geçmişiyle eşleşti.
- Vercel: production dağıtımı `READY`, kalıcı alan adı `https://saas-edtech-platform-360.vercel.app`.
- HTTP smoke: `/` → `/tr`; `/tr` ve üç GOLMS ekranı `200`; program API'si oturumsuz isteği `401 UNAUTHENTICATED` ile reddeder.
- Header smoke: CSP ve `X-Frame-Options: DENY` canlı yanıtta görülür.

Bu kanıt yalnızca dağıtım temelini doğrular; canlı Auth/RLS, müşteri UAT, erişilebilirlik, gözlemlenebilirlik ve geri yükleme kapılarını tamamlamaz.
