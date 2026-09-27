# Shared Platform core (ortak platform çekirdeği)

İlk Respongo OS domain kodu tenant, üyelik, rol/yetki, ürün hakkı ve 14 günlük deneme kararlarını tek yerde toplar. Web, mobil veya ürün arayüzü bu kararı yeniden yazmaz; API/BFF aynı fonksiyonların veritabanı karşılığını kullanır.

## Uygulanan kurallar

- Müşteri denemesi tenant için bir kez ve 14 gün başlar.
- O anda `released` olan SaaS ürünleri aynı bitiş saatini alır.
- İç demo müşteri denemesini başlatmaz; ayrı `internal` hak kullanır.
- Deneme bitince yetkili okuma sürer, bütün yazmalar reddedilir.
- Tenant, aktif üyelik, tarihli gerçek rol, izin ve ürün hakkı birlikte doğrulanır.
- Arayüzdeki rol önizlemesi domain girdisi değildir ve yetki üretemez.

Bu kod henüz hosted Supabase migration'ı veya müşteri ekranı değildir. Veritabanı katmanı; RLS, iki tenant negatif testleri, HQ operatör ayrımı, audit ve migration geri alma kanıtıyla ayrıca uygulanacaktır.
