# Üretim öncesi açık kararlar

Bunlar kararlaştırılmış gerçekler değildir. F0/F1 araştırmasında seçenek, maliyet, güvenlik ve kullanıcı kanıtıyla netleşir; kesinleşince `kararlar.md` ve ilgili modül güncellenir.

| ID | Karar konusu | Geçici çalışma varsayımı | Karar kapısı |
|---|---|---|---|
| A-01 | İlk beta bölgesi, veri ikameti ve sözleşmeler | Tek kontrollü bölge; başka ülke müşterisine otomatik veri yerleşimi vaadi yok | Hukuk ve kurumsal müşteri gereksinimi, F0 |
| A-02 | Deneme sonrası ücret/koltuk/kota ve ödeme | Tek 14 günlük sayaç; ücret ve ödeme sağlayıcısı henüz seçilmedi | Ticari model, F1 |
| A-03 | Background worker (arka plan işçisi) | Vercel isteği dışında kuyruklu iş | Yük profili, güvenlik ve maliyet karşılaştırması, F1 |
| A-04 | AI sağlayıcı, model ve veri işleme bölgesi | Değiştirilebilir ağ geçidi; müşteri içeriği varsayılan olarak eğitim verisi olmaz | DPA, bölge, eval ve maliyet, F5 |
| A-05 | İçerik/partner lisansları ve isEazy bağlayıcısı | Resmî izin ve API kanıtı olmadan katalog veya çift yönlü entegrasyon açılmaz | Partner sözleşmesi/teknik deneme, F3–F4 |
| A-06 | SCORM/xAPI kapsamının resmî destek etiketi | Önce gerçek referans paketleri ve test matrisi | Uyumluluk deneyi, F2 |
| A-07 | 21st.dev hesabı, API hakkı ve bileşen lisansı | Erişim yoksa tasarım sistemi yerel araştırma/uyarlamayla devam eder | Lisans ve tasarım yönü, F0 |
| A-08 | İlk sektör ve demo portalı | Sektör bağımsız çekirdek önce; Oguz ancak HQ fabrikasından sonra | Genel çekirdek kabulü, F6 |
| A-09 | AWS tam geçiş eşiği | Beta Vercel/Supabase/özel S3 | Kapasite, SLO, uyumluluk veya ticari gerekçe, yayın sonrası |
| A-10 | Sekiz ek dilin ticari yayın sırası, fiyatı ve bölgesel varyantları | `platform/locales.json`: TR/EN dahil, sekiz ek lisans hedef; tümü planlı, etkin değil | İlk müşteri ülkeleri, yerel çevirmen, sözleşme ve QA kapasitesi, F0–F6 |

Hiçbir satır “karar verildi” anlamına gelmez. Bir karar özelliğin ilerlemesini gerçekten durdurursa ilgili tracker görevi `blocked` durumuna ve gerekçesine geçirilir.
