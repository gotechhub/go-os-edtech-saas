# Görsel, ikon ve hareket varlık planı

| Kategori | Varyant/kullanım | Kayıt şartı |
|---|---|---|
| Respongo ana marka ve ürün işaretleri | light/dark, yatay/dikey, SVG ve raster | Hak sahibi, sürüm, boşluk ve minimum ölçü |
| Sektör paketleri | hukuk ilk demo **sonra**; otelcilik ve diğerleri veri temelli | Ayrı sektör seed'i, hukuki içerik onayı, kaynak |
| Giriş/hero | 16:9/4:3/mobil odak, fotoğraf veya özgün illüstrasyon | Lisans, alt metin, odak noktası, WebP/AVIF |
| Eğitim kapakları | kurs, program, yol, katalog ve GOFACTORY teslimi | İçerik hakkı, tema, dil, güvenli varsayılan |
| Avatar/profil | sentetik demo kimlikleri, gerçek kullanıcı rızalı yükleme | Boyut, crop, varsayılan ve gizlilik |
| SVG ikonlar | ortak stroke sistemi; yön, durum ve eylem | Anlam/etiket, kontrast, klavye erişimi |
| Boş/hata ekranları | ürün ve rol bağlamına göre | Durum eylemi ve açıklama |
| Başarı/rozet/sertifika | düşük hareket varyantı ve baskı tasarımı | Puan kuralı, doğrulama, sahtecilik önlemi |
| E-posta/push | sistem şablonları, tenant marka, dil | Erişilebilir metin, önizleme ve gönderim izni |

Tek `asset-manifest` kaydı kaynak URL/dosya, lisans, ölçü, hash, alt metin, odak, tema/dil, yayın durumu, tenant sahipliği ve sürüm tutar. AI ile üretilen görselin üretim kaynağı ve kullanım hakkı ayrıca işaretlenir. Eski Oguz görselleri V3'e aktarılmaz; yeni marka/hukuk demo varlığı ancak ilgili portal açılınca hazırlanır.

Font ve sertifika/e-posta şablonlarının Latin, Kiril, Arap ve CJK (Japonca/Çince) yazı sistemlerini kapsayan lisanslı fallback varyantları gerekir. Görsel içindeki metin yerelleştirilebilir ayrı katman olarak üretilir; on dil için bitmap üzerine gömülü tek dilli yazı kullanılmaz.

Motion: 150–220 ms mikro geçiş, 400–700 ms anlamlı tamamlanma; `prefers-reduced-motion` ve düşük cihaz kapasitesi alternatifleri. Animasyon puan kazanımı, eylem sonucu veya uyarı açıklığının önüne geçmez.
