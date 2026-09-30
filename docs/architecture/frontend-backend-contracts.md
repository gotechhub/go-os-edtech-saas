# Ön yüz / arka uç uygulama sözleşmesi

**Durum: hedef mimari.** Uygulama ve hosted API henüz yoktur. Bu sözleşme Respongo OS'nin ilk kod diliminden itibaren korunur.

## Uçtan uca istek

`Web veya Expo ekranı → yetkili BFF/API komutu → ürün application servisi → domain kuralı → ürün verisi / outbox → sürümlü read model → rol/tenant/locale ile ekran`. İstek bağlamı sunucu tarafından oturum, tenant üyeliği, aktif rol, ürün entitlement, 14 günlük deneme ve dil lisansından kurulur. İstemcinin tenant/role/locale parametresi tek başına yetki kaynağı değildir.

| Ön yüz sorumluluğu | Arka uç sorumluluğu |
|---|---|
| Gerçek URL, rol bazlı yönlendirme, erişilebilir bileşen ve ekran durumları | Komut yetkisi, RLS, ürün/deneme/lisans kapısı ve audit |
| `loading/error/stale/offline` açıklaması, optimistik eylem ancak geri alma ile | İdempotency, tutarlı hata kodu, transaction, outbox ve yeniden deneme |
| Tema/dil/etiket manifesti ve kullanıcı tercihi | OS Core temel paket yayını, Super Admin tenant ek lisansı, overlay sürümü, üç yönlü yükseltme, güvenli fallback ve cache anahtarı |
| Veri kaynağı ve tazelik etiketi; uzun liste sayfalama/sanallaştırma | Filtre/sıralama, izinli alan projeksiyonu, cursor, read model tazeliği |
| Form doğrulama ve anlaşılır hata | Şema doğrulama, iş kuralı ve erişim kontrolü; istemci doğrulamasına güvenmeme |

## Sürüm ve hata sözleşmesi

API isteği `request_id`, `tenant_context`, ürün, idempotency key ve gerektiğinde `expected_version` taşır. Yanıt `schema_version`, veri tazeliği, izinli aksiyonlar ve makinece okunur hata kodu döndürür; kullanıcı mesajı yerelleştirilmiş katalogdan çözülür. Hata metni yetki kararı veya veri sızdıran debug çıktısı değildir. Locale ve label değişikliği endpoint, route ID, olay kodu veya rapor metrik kimliğini değiştirmez. Dil manifesti yalnızca OS Core tarafından yayımlanmış ve Super Admin tarafından bu tenant'a lisanslanmış locale paketini kullanır; müşteri overlay yayını `expected_base_version` ve `expected_overlay_revision` ile yarışan değişiklikleri engeller.

Okuma modelleri ürün sahibi veriden türetilir; ürünler birbirinin tablosuna yazmaz. Uzun dosya işleme, çeviri, AI ve toplu rapor istekten ayrılmış kuyruğa gider; iş durumu tenant/rol denetiminden geçerek UI'ya döner. Mobil çevrimdışı taslak yeniden bağlanınca aynı sürüm/idempotency kapısıyla çatışma yönetir.

## Teknik kalite

- TypeScript strict, şema doğrulama ve sözleşme testleri; erişilebilir bileşen durumları ve iki tenant/rol negatif testleri. Kod modüler monolit sınırlarında kalır; mikroservis yalnızca ölçülen gerekçeyle çıkarılır.
- İstemci paketi ve API bağımlılığı bütçesi, yavaş mobil ağ testi, gözlemlenebilir istek izi ve ürüne göre hız/yanıt hedefleri. Web sayfaları sunucu tarafı erişilebilir ilk HTML üretir; sır ve servis anahtarı istemci paketine girmez.
- Supabase migration ve RLS, izinli RPC, S3 özel nesne, worker, bildirim ve GOAI araç çağrıları aynı entitlement/tenant sözleşmesini uygular. Cache anahtarı tenant+ürün+rol+locale+temel paket/overlay sürümünü kapsar; çapraz müşteri yanıtı paylaşılmaz.
- En az bir gerçek admin → atama → öğrenen → rapor ve HQ → dil lisansı → müşteri özelleştirme → paket güncelleme → rollback zinciri uçtan uca doğrulanmadan “hazır” ilan edilmez.
