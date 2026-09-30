# Kalıcı kurallar ve sınırlar

- `v1/` ve `v2/` tarihsel kopya olarak kalır. Respongo OS'de eski kod, müşteri seed'i, marka görseli veya kimlik bilgisi başlangıç girdisi olmaz.
- İş alanları `docs/architecture/README.md` sahiplik tablosuna uyar. Ortak platform ürün özel iş kuralını sahiplenmez. GOFACTORY hizmettir; GOHR/GORECRUIT ürün olarak gizlice kurulmaz.
- Respongo OS Core teknik operatörleri, Super Admin müşteri operatörleri ve müşteri Control Center rolleri ayrı ilkelerle yetkilendirilir; arayüzde rol seçimi yetki vermez.
- 14 günlük deneme tenant etkinleştirmesinde bir kez başlar. İç demo sayacı başlatmaz; süre sonu veri silmez. Ürün kapısı API ve veritabanı komutlarında uygulanır.
- Üçüncü taraf içerik hakları, S3 nesneleri, AI istemleri ve kullanıcı verileri tenant ve lisans kapsamıyla sınırlanır. Gerçek sırlar, parolalar ve kişisel kayıtlar belgelere/harici tasarım istemlerine yazılmaz.
- Canlı entegrasyon, hosted migration, ödeme, müşteriyle iletişim veya yayın yalnızca gerçek yetki ve doğrulanmış sonuçla yapılır. Yerel test canlı kabul yerine geçmez.
- Görev ancak tarihli kanıt ve ilgili güvenlik, erişilebilirlik, mobil, iş akışı kontrolleriyle doğrulanmış sayılır. `project-tracker.json` yüzdesi pazarlama hedefi olarak değiştirilmez.
- Varsayılan kullanıcı dili `tr-TR` olur. Müşterinin yayımladığı etiket yalnızca görünen metni değiştirir; anahtar, izin, audit, yasal/işlemsel beyan ve ürün kimliği genel etiket editörüyle değişmez. On dilin her biri QA geçmeden etkin/çevirisi tamamlanmış diye gösterilmez.
