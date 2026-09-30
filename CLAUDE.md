# Respongo OS · Codex ve Claude ortak çalışma sözleşmesi

Bu dosya iki ajanın aynı projede kullanacağı tek üst düzey talimattır. Ayrıntıyı kopyalamak yerine [`context/README.md`](context/README.md) haritasından göreve uygun belgeye git.

1. Aktif Respongo OS ürününü depo kökünde geliştir. Tarihsel V1/V2 kaynaklarını bu temiz depoya, Oguz Law Academy kodunu, seed verisini veya eski UI'ı başlangıç girdisi olarak taşıma. İlk müşteri/demo portalı ancak genel sistem kurulduktan sonra Respongo HQ'dan açılacak.
2. Sınırlar: GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI bağımsız ürün alanları; GOAI Engine ortak zekâ katmanı; GOFACTORY Respongo'nun yönettiği hizmet; müşteri Control Center ve iç Respongo HQ farklı yetki alanlarıdır. GOHR/GORECRUIT kapsam dışıdır.
3. Kaynak önceliği: çalışan kod ve testler → migration/veri sözleşmesi → kabul kaydı `project-tracker.json` → karar kayıtları → oturum notu. Çelişkiyi görünür kıl; hafıza notundan kod gerçeği uydurma.
4. Yeni kalıcı karar veya ürün kapsamı değiştiğinde ilgili ürün belgesini, `context/kararlar.md` kaydını ve takip kaynağını aynı çalışmada güncelle. Geçici fikirleri karar gibi yazma; kaynakları tarih ve bağlantıyla kaydet.
5. Her özellikte tenant (müşteri) izolasyonu, sunucu/veritabanı yetkisi, deneme hakkı, audit (işlem izi), erişilebilirlik ve hata durumu değerlendir. Müşteri rol önizlemesi iç operatör hakkı sağlamaz.
6. Tamamlanma yalnızca kod + senaryo testi + güvenlik/erişilebilirlik kontrolleri + tarihli kabul kanıtıyla kaydedilir. Yerel doğrulamayı hosted kurulum veya kullanıcı kabulü diye sunma.
7. Gizli anahtarları, gerçek müşteri verisini ve erişim bağlantılarını belgeye, koda veya 21st.dev istemlerine yazma. Üçüncü taraf kodunu lisans, bağımlılık, erişilebilirlik ve performans incelemesi olmadan alma.
8. Türkçe yaz; ilk kullanımda önemli İngilizce teknik terimi Türkçe karşılığıyla açıkla. Gereksiz tekrar ve tüm kod tabanını her görevde okuma zorunluluğu oluşturma.

İki ajan arasında dosya sahipliği, çatışma ve kısa iş devri için [`context/ajan-is-akisi.md`](context/ajan-is-akisi.md) kullan.

Odaklı iş akışları `.claude/skills/` altında tek kopya olarak tutulur; Codex için `.agents/skills/` ince yönlendirme dosyaları bulunur.
