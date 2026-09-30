# Sıfırdan V3 deneyim ve görsel sistem

V1/V2 fontu, marka görünümü veya Oguz ekranı tasarım başlangıcı değildir. Yeni marka dili, Respongo OS için açık/koyu tema, güçlü okunaklı **tırnaksız** tipografi, sade ikon, anlamlı fotoğraf/illüstrasyon, kontrollü animasyon ve ürünler arası tutarlı bileşenlerle kurulacak. Tipografi adayları lisans ve Türkçe karakter testinden sonra seçilir; keyfî font kararı kod öncesi kabul edilir.

**Tasarım ayrımı:** öğrenen GOLXP/GOLMS ekranı görsel ve yönlendirici; müşteri Control Center veriye/işe dönük; eğitmen değerlendirme ve canlı oturuma; hat yöneticisi ekip riskine; Respongo HQ portal filosu ve destek operasyonuna odaklı. Tek tip “Netflix karuseli” yönetim tablolarına zorlanmaz. Mobil web ile native aynı token ve durum sözleşmesine dayanır.

**Giriş:** masaüstünde iki panelli tam ekran: sol tarafta sade form/SSO/MFA/KVKK, sağda ürüne uygun, temalı görsel ve kısa değer mesajı. Mobilde form birincil, görsel sadeleşir. Sektör/tenant markası yalnızca portal açıldıktan sonra ve güvenli asset manifestinden gelir.

**Dil ve yazı sistemleri:** tüm ekranlar `tr-TR` varsayılanıyla tasarlanır; İngilizce ve sekiz ek dilde metin uzaması test edilir. Arapça sağdan sola (RTL) düzen, Japonca/Çince satır kırımı ve yazı tipi fallback'i için locale duyarlı tokenlar kullanılır. Ekran okuyucunun `lang`/`dir` bilgisi ve görsel/ikon alt metni seçilen dille uyuşur. Müşterinin terim değişikliği menü genişliğini veya mobil eylemi kırmamalıdır. [On dilli sözleşme](../docs/architecture/localization-white-label.md).

**21st.dev:** [resmî MCP/CLI akışı](https://21st.dev/blog/introducing-agents-cli) ile tasarım yönü ve bileşen araması. Her öneri tasarım sistemi, lisans, bağımlılık, erişilebilirlik, performans ve gerçek kullanıcı işiyle denetlenir; müşteri verisi isteme girmez, Respongo varlıkları yayımlanmaz. API anahtarı yalnızca işletim sistemi gizli değişkeninde tutulur; kredi yoksa tasarım ilerlemesi durmaz.

[Rol ekranları](role-flows.md) · [Üç UX yönü](experience-directions.md) · [UX/UI ve ön yüz kalite sözleşmesi](experience-engineering.md) · [21st brief](21st-brief.md) · [asset planı](asset-plan.md) · [modül/kabul listesi](modules.md).
