# V3 çalışma noktası

- Tarih: 2026-09-27.
- Aktif amaç: GOAI kanonik mimari düzeltmesini takip ve bağlam dosyalarıyla tamamlamak; ardından canlı V3 temelinin üzerine gerçek Auth/RLS ve GOLMS program/SCORM akışını geliştirmek.
- Korunan taban: V1/V2 ayrı tarihsel depoda kalır. Bu çalışma alanı yalnızca temiz `go-os-edtech-saas` V3 kaynağıdır.
- Gerçek durum: V3 kapsamı 137 modül/411 kabul adımıdır; doğrulanmış ilerleme %0'dır. Platform tenant/rol/14 günlük deneme, GOLMS LMS-01–04 çekirdeği, application/BFF sözleşmesi, rol kapsamlı read modeller ve bağımsız Next.js V3 web kabuğu yerelde çalışır. Türkçe varsayılan; TR/EN dahil ve sekiz ek dil lisansı kararı geçerlidir.
- Yerel doğrulama: temiz depoda son `pnpm check` geçti: 19 kritik yol, 39 test, TypeScript, takip/yapı kontrolü ve Next.js production build. Web rotaları başlangıç, admin program listesi, öğrenen atamaları ve iki GOLMS API endpointini içerir.
- Hosted temel: `go-os-edtech-saas` GitHub `main` dalı oluşturuldu. Üç V3 migration yeni Supabase projesine uygulandı ve yerel/uzak migration numaraları eşleşti. Mevcut Vercel projesinin Git entegrasyonu `gotechhub/go-os-edtech-saas` deposuna geçirildi; ikinci proje açılmadı. Vercel production dağıtımı `READY`; kalıcı URL `https://saas-edtech-platform-360.vercel.app`. `/tr` ve üç GOLMS sayfası 200, güvenlik başlıkları aktif, oturumsuz program API'si 401 döndürüyor. 2026-09-27 canlı altyapı kontrolünde üretim sayfası ve Supabase Auth sağlık uç noktası 200 döndürdü; Production/Preview Supabase ortam değişkenleri Vercel'de görüldü.
- Mimari karar: GOAI ayrı ürün/dashboard değildir. Ürün içine gömülü ortak motor ve `goai-ui` sözleşmesidir. Tenant yönetişimi Control Center, global provider/secret/maliyet/eval/rollout Respongo HQ alanındadır. Model yalnız kayıtlı ürün araçlarıyla çalışır; R2–R4 eylemler payload'a bağlı insan onayı ister.
- Sıradaki iş: gerçek giriş/davet/MFA akışı; tenant ve rol fixture'larıyla hosted RLS negatif testleri; admin program formu; özel S3 SCORM yükleme/tarama worker hattı; gerçek rol uçtan uca testi.
- Dış bağımlılıklar: 21st hesabı/API hakkı, S3 bucket/KMS/tarama altyapısı, içerik lisansları ve ilk müşteri kabulü henüz doğrulanmadı. Bunlar planlama engeli değil, ilgili üretim/yayın kapılarının girdileridir.

Bu dosya oturum özeti, ürün/şema gerçeği değildir. Durum değiştiğinde kısa ve tarihli güncelle.
