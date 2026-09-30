# Respongo OS UX/UI ve ön yüz kalite sözleşmesi

**Amaç:** Respongo OS, rolün günlük işini hızlı bitiren ve öğrenende güçlü motivasyon yaratan bir ürün dili kurar. Görsel kalite; anlaşılır karar, erişilebilir etkileşim ve hızlı yanıtla birlikte ölçülür. Bu belge V3 kodlanmadan önceki tasarım kabul sözleşmesidir; V1/V2 arayüzü veya Oguz ekranı başlangıç şablonu değildir.

## Tasarım yönü ve bileşen sahipliği

1. F0'da öğrenen, tenant admini ve Respongo HQ için üç ayrı görsel yön 21st.dev keşfiyle hazırlanır. Beş rolün görev başarısı, veri yoğunluğu, marka uyumu, erişilebilirlik, mobil davranış ve uygulama maliyeti puanlanır. Ekran kodu yalnızca seçilen yön ve onaylı tasarım tokenlarından türetilir.
2. `design-tokens` semantik renk, tipografi, boşluk, katman, hareket ve RTL mantıksal yönün tek kaynağı olur. Web ve React Native aynı sözleşmeden çıktılar alır. Tenant markası bu semantik tokenları sınırları içinde özelleştirir; kritik durum renkleri ve kontrastı bozamaz.
3. `ui-web` ve `ui-native` temel bileşenlerin davranış/durum sözleşmesini paylaşır: buton, form, modal, tablo, kart, bildirim, yükleniyor/boş/hata, avatar, ikon, ilerleme ve navigasyon. 21st.dev kodu lisans, bağımlılık, erişilebilirlik, performans ve güvenlik denetiminden sonra uyarlanır; ürün içinde doğrudan dağınık kopyalanmaz.

## Rol ve ekran standardı

| Rol | İlk ekrandaki değer | Kritik aksiyon |
|---|---|---|
| Öğrenen | Devam et, yaklaşan zorunlu işler, kişisel yol | Bir sonraki öğrenme adımını açmak |
| Tenant admini | İş kuyruğu, uyum riski, içerik hazırlığı, atama | Görev atamak, kanıt/rapor görmek |
| Eğitmen | Oturum, soru ve değerlendirme kuyruğu | Öğreneni değerlendirmek |
| Hat yöneticisi | Ekip gecikmesi, beceri açığı, onay | Risk ve gelişim eylemi almak |
| Respongo HQ | Portal filosu, dil paketi/lisans/rollout, destek ve sistem sağlığı | Doğru tenant/sürüme güvenli müdahale |

Her gerçek URL ekranı `loading`, `loaded`, `empty`, `filtered_empty`, `error`, `forbidden`, `offline`, `stale` durumlarını ve boş durumdan sonraki yararlı eylemi tanımlar. Ekranın en önemli aksiyonu masaüstünde ve mobilde belirgin, klavye ile erişilebilir ve sunucu yetkisiyle uyumlu olur. Sadece görsel prototip veya statik dashboard “tamamlandı” sayılmaz.

**Dil yönetimi ekranları:** HQ'da paket kataloğu, ürün/locale kapsam matrisi, lisans atama, pilot/genel rollout, sürüm farkı, çakışma ve rollback; müşteride ek lisans kartı, “kendime uyarla”, temel/özel metin karşılaştırması, taslak/önizleme/yayın ve güncelleme bildirimi. Fiyat/vergi/ödeme entegrasyonu gerçekten yoksa kart “lisans talebi” olarak davranır. Kullanıcı, hangi değişikliğin otomatik geldiğini ve kendi hangi etiketinin korunduğunu açıkça görür.

## Görsel, tipografi, hareket ve 10 dil

- Güçlü, okunaklı **tırnaksız** font ailesi; Türkçe, Latin, Kiril, Arap ve CJK fallback'leriyle test edilir. Uzun müşteri etiketleri kesilmek yerine uygun kırılım/yardım metniyle yönetilir.
- Masaüstü 1280/1440/1920; tablet 768; mobil 360/390 test genişlikleri. Kompakt ve geniş admin bilgi yoğunluğu ayrı; öğrenen ekranında büyük görsel akış içerik görevini gölgelemez.
- Açık/koyu, düşük hareket ve az veri/az donanım uyumu. Animasyon sonucu anlatır; görevi yavaşlatmaz. `prefers-reduced-motion` ve native erişilebilirlik ayarı desteklenir.
- Arapça RTL düzen, `lang`/`dir`, CSS logical properties, ikon yönü, karma rakam/Latin metin; Japonca/Çince satır kırımı, font metrikleri, sıralama. Türkçe varsayılan; İngilizce dahil; sekiz ek lisanslı dilin UI kabulü paket sürümüne bağlıdır.
- İkonlar ortak SVG stroke/semantik ad sistemiyle; fotoğraf/illüstrasyon lisans, kaynak, alt metin, odak, tema ve çözünürlük manifestiyle yönetilir. Giriş ekranı masaüstünde sol form/sağ görsel, mobilde form önceliklidir.

## Erişilebilirlik ve performans kapıları

WCAG 2.2 AA hedefi, odak sırası, ekran okuyucu adı, hata ilişkisi, klavye, %200 zoom, kontrast, 44 px civarı dokunma alanı tasarım kararı olarak denetlenir. LCP p75 ≤ 2,5 s, INP p75 ≤ 200 ms, CLS ≤ 0,1 hedefleri gerçek cihaz/ağ ölçümüyle izlenir. Ağır grafik ve editör lazy-load; veri yoğun tablo sanallaştırılır; görseller responsive AVIF/WebP ve uygun öncelikle verilir. Hedef tutmazsa etkili neden bulunmadan gösterişli efekt eklenmez.

**Görsel kabul:** Storybook durumları + Playwright rol/tema/locale ekran görüntüleri + Axe erişilebilirlik + beş temsilî kullanıcı görev testi. Tam matris kombinatorik patlama yaratmayacak şekilde risk bazlı seçilir; TR/EN kritik akışlar tam, ek sekiz dilde tüm ürün giriş/ana/işlem/hata smoke, Arapça tüm kritik RTL akışlar ve uzun etiket regresyonu ayrı çalışır.
