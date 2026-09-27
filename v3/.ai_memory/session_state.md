# V3 çalışma noktası

- Tarih: 2026-09-27.
- Aktif amaç: Temiz V3 GitHub/Supabase/Vercel ortamını ayağa kaldırmak; ardından program stüdyosu ve SCORM yükleme hattını tamamlamak.
- Korunan taban: V1/V2 ayrı tarihsel depoda kalır. Bu çalışma alanı yalnızca temiz `go-os-edtech-saas` V3 kaynağıdır.
- Gerçek durum: V3 kapsamı 137 modül/411 kabul adımıdır; doğrulanmış ilerleme %0'dır. Platform tenant/rol/14 günlük deneme, GOLMS LMS-01–04 çekirdeği, application/BFF sözleşmesi, rol kapsamlı read modeller ve bağımsız Next.js V3 web kabuğu yerelde çalışır. Türkçe varsayılan; TR/EN dahil ve sekiz ek dil lisansı kararı geçerlidir.
- Yerel doğrulama: temiz depoda son `pnpm check` geçti: 19 kritik yol, 39 test, TypeScript, takip/yapı kontrolü ve Next.js production build. Web rotaları başlangıç, admin program listesi, öğrenen atamaları ve iki GOLMS API endpointini içerir. Hosted migration, canlı auth ve kullanıcı kabulü henüz ayrı kanıttır.
- Sıradaki iş: ilk GitHub push; Supabase migration ve RLS doğrulaması; Vercel link/deploy; sonra admin program formu, SCORM özel S3 yükleme/tarama worker hattı ve gerçek rol uçtan uca testi.
- Dış bağımlılıklar: 21st hesabı/API hakkı, yeni V3 hosted kaynakları, içerik lisansları ve ilk müşteri kabulü henüz doğrulanmadı. Bunlar planlama engeli değil, ilgili üretim/yayın kapılarının girdileridir.

Bu dosya oturum özeti, ürün/şema gerçeği değildir. Durum değiştiğinde kısa ve tarihli güncelle.
