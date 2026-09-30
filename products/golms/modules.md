# GOLMS · öğrenme yönetimi · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| LMS-01 | F5 | Eğitim nesnesi ve içerik yönetişimi | 0/3 |
| LMS-02 | F5 | Program, müfredat ve öğrenme haritası | 0/3 |
| LMS-03 | F5 | Atama, kayıt, aday gösterme ve onay | 0/3 |
| LMS-04 | F5 | SCORM, xAPI, cmi5 ve LTI çalışma zamanı | 1/3 |
| LMS-05 | F5 | Soru bankası, sınav ve değerlendirme | 0/3 |
| LMS-06 | F5 | Anket, form ve eğitim değerlendirmesi | 0/3 |
| LMS-07 | F5 | Görev, gözlem ve iş başı kanıtı | 0/3 |
| LMS-08 | F5 | Zorunlu eğitim ve uyumluluk motoru | 0/3 |
| LMS-09 | F5 | Sertifika, yeniden eğitim ve dış kanıt | 0/3 |
| LMS-10 | F5 | Sınıf, sanal sınıf ve oturum yönetimi | 0/3 |
| LMS-11 | F5 | Eğitmen çalışma alanı | 0/3 |
| LMS-12 | F5 | Öğrenen alanı, öğrenme geçmişi ve kanıt cüzdanı | 0/3 |
| LMS-13 | F5 | Hat yöneticisi ekip öğrenme alanı | 0/3 |
| LMS-14 | F5 | Yetkinlik eşleme ve öğrenme kanıtı köprüsü | 0/3 |
| LMS-15 | F5 | Eğitim talebi ve ihtiyaç toplama | 0/3 |
| LMS-16 | F5 | Duyuru, hatırlatma ve yöneticiye yükseltme | 0/3 |
| LMS-17 | F5 | Öğrenme raporları ve rapor kurucu | 0/3 |
| LMS-18 | F5 | Toplu operasyon ve veri kalite merkezi | 0/3 |
| LMS-19 | F10 | Kurumsal ve öğrenme entegrasyonları | 0/3 |
| LMS-20 | F5 | İçerik erişimi ve yaşam döngüsü | 0/3 |
| LMS-21 | F5 | Denetim ve uyum kanıt paketi | 0/3 |
| LMS-22 | F10 | Mobil, çevrimdışı ve cihaz öğrenimi | 0/3 |
| LMS-23 | F5 | Çok dilli ve erişilebilir öğrenme operasyonu | 0/3 |
| LMS-24 | F5 | GOAI destekli öğrenme operasyonları | 0/3 |

## LMS-01 · Eğitim nesnesi ve içerik yönetişimi

Faz: **F5**. Alt modüller: Kurs/SCORM/video/PDF/bağlantı kaydı; Metadata/taksonomi/dil/sahip; Taslak-inceleme-yayın-arşiv; Sürüm/son kullanma/erişim kapsamı.

**Kabul senaryosu:** Yönetici onaylı içeriği sürümüyle yayımlar; öğrenen yalnızca yetkili ve geçerli sürümü açar.

## LMS-02 · Program, müfredat ve öğrenme haritası

Faz: **F5**. Alt modüller: SCORM/anket/sınav/görev/kaynak/oturum adımları; Sürükle-sırala ve bölüm; Ön koşul/dallanma/seçmeli adım; Taslak/yayın ve sürüm geçişi.

**Kabul senaryosu:** Yönetici listeden program oluşturur, adımları ve geçiş kurallarını düzenler; yayımlanan sürüm geçmiş atamaları bozmaz.

## LMS-03 · Atama, kayıt, aday gösterme ve onay

Faz: **F5**. Alt modüller: Kişi/ekip/rol/dinamik kural hedefi; Zorunlu/isteğe bağlı/kendi kaydolma; Aday gösterme/onay/bekleme listesi; Son tarih/iptal/yeniden atama/istisna.

**Kabul senaryosu:** Atama doğru hedefte tekil oluşur; onay ve bekleme adımları tamamlanmadan öğrenme hakkı açılmaz.

## LMS-04 · SCORM, xAPI, cmi5 ve LTI çalışma zamanı

Faz: **F5**. Alt modüller: ZIP manifest/güvenlik/antivirüs doğrulama; SCORM 1.2/2004 çalışma zamanı ve sıralama (sequencing); xAPI/cmi5 ifade ve deneme kaydı (statement/attempt); LTI 1.3 başlatma ve sonuç sınırı.

**Kabul senaryosu:** Referans paket güvenli açılır; başlatma, ara verme, devam, puan ve tamamlama sürümlü deneme kaydıyla (attempt) doğru raporlanır.

## LMS-05 · Soru bankası, sınav ve değerlendirme

Faz: **F5**. Alt modüller: Soru türü/havuz/etiket/sürüm; Rastgeleleştirme/süre/geçme/deneme; Sınav gözetimi (proctoring) adaptörü ve erişilebilir düzenleme; İtiraz ve madde analizi.

**Kabul senaryosu:** Sınav kuralı deneme kaydı (attempt) boyunca değişmez; sonuç, soru sürümü ve itiraz iziyle rapora yansır.

## LMS-06 · Anket, form ve eğitim değerlendirmesi

Faz: **F5**. Alt modüller: Anonim/kimlikli form; Kirkpatrick ve özel şablon; Koşullu soru/çok dil; Yanıt gizliliği ve analiz.

**Kabul senaryosu:** Form doğru olayda açılır; anonimlik kuralı korunur ve sonuç öğrenme puanıyla karışmaz.

## LMS-07 · Görev, gözlem ve iş başı kanıtı

Faz: **F5**. Alt modüller: Dosya/metin/video teslimi; Kontrol listesi ve saha gözlemi; Değerlendirici rubriği ve geri bildirim; Revizyon/onay/kanıt süresi.

**Kabul senaryosu:** Öğrenen kanıt gönderir; yetkili değerlendirici sürümlü rubrikle karar verir ve audit izi korunur.

## LMS-08 · Zorunlu eğitim ve uyumluluk motoru

Faz: **F5**. Alt modüller: Rol/ülke/politika gereksinimi; Tekrar/yenileme/son tarih/yöneticiye yükseltme (escalation); Muafiyet/eşdeğerlik/politika onayı; Uyum açığı ve kanıt paketi.

**Kabul senaryosu:** Gereksinim, atama ve geçerlilik aynı politika sürümünden hesaplanır; istisna yetkili onaysız uygulanmaz.

## LMS-09 · Sertifika, yeniden eğitim ve dış kanıt

Faz: **F5**. Alt modüller: Şablon/tasarım/seri/QR doğrulama; Geçerlilik/yenileme/retraining; Dış sertifika yükleme/doğrulama; İptal ve yeniden üretim.

**Kabul senaryosu:** Sertifika yalnızca geçerli tamamlanma kanıtıyla üretilir; süresi ve doğrulama durumu bağımsız kontrol edilir.

## LMS-10 · Sınıf, sanal sınıf ve oturum yönetimi

Faz: **F5**. Alt modüller: Etkinlik/sınıf/oturum/takvim; Kapasite/bekleme/yoklama; Mekân/eğitmen/partner/envanter; Teams/Zoom/GoToTraining katılım uzlaştırma.

**Kabul senaryosu:** Kayıt, kapasite, takvim ve katılım aynı oturum kimliğinde uzlaşır; çakışma ve fazla kapasite engellenir.

## LMS-11 · Eğitmen çalışma alanı

Faz: **F5**. Alt modüller: Oturum ve katılım; Görev/sınav değerlendirme kuyruğu; Öğrenen soruları ve duyuru; Sınıf ilerleme ve içerik geri bildirimi.

**Kabul senaryosu:** Eğitmen yalnızca atandığı sınıf/öğrenenleri görür; değerlendirme ve iletişim audit kaydıyla tamamlanır.

## LMS-12 · Öğrenen alanı, öğrenme geçmişi ve kanıt cüzdanı

Faz: **F5**. Alt modüller: Atanan/devam/tamamlanan/geciken; Devam et/takvim/kayıt/yer imi; Öğrenme geçmişi (transcript)/sertifika/dış kanıt; Soru/yardım ve eğitim talebi.

**Kabul senaryosu:** Öğrenen atamadan oynatmaya, tamamlamaya ve öğrenme geçmişi kanıtına kesintisiz gider; durumlar aynı kaynaktan gelir.

## LMS-13 · Hat yöneticisi ekip öğrenme alanı

Faz: **F5**. Alt modüller: Ekip risk ve yaklaşan/geciken eğitim; Aday gösterme/onay/önerme; Geri bildirim ve gelişim görevi; Yetkili ekip raporu.

**Kabul senaryosu:** Yönetici yalnızca geçerli raporlama hattını görür; ekip atama/onay eylemi GOLMS kuralını aşmaz.

## LMS-14 · Yetkinlik eşleme ve öğrenme kanıtı köprüsü

Faz: **F5**. Alt modüller: Ortak rol/yetkinlik kimliği tüketimi; Kurs-program-sınav kanıt eşleme; Seviye/son kullanım ve doğrulayıcı; GOLXP beceri pasaportuna izinli olay.

**Kabul senaryosu:** GOLMS resmî öğrenme kanıtını üretir; ortak sözlüğü veya GOLXP beceri hükmünü kopyalamadan kaynak ve geçerlilik taşır.

## LMS-15 · Eğitim talebi ve ihtiyaç toplama

Faz: **F5**. Alt modüller: Bireysel/ekip eğitim talebi; Gerekçe/bütçe/öncelik; Yönetici-L&D onayı; Program/katalog/GOFACTORY sonucuna bağlama.

**Kabul senaryosu:** Talep karar ve gerekçesiyle kapanır; onay tek başına satın alma veya eğitim tamamlama oluşturmaz.

## LMS-16 · Duyuru, hatırlatma ve yöneticiye yükseltme

Faz: **F5**. Alt modüller: Öğrenme olayı tetikleri; Hedef ve kanal tercihi; Son tarih/yenileme/yükseltme (escalation); Platform şablon ve teslim kaydı.

**Kabul senaryosu:** Aynı olay yinelenen mesaj üretmez; kanal/tercih/şablon platform sınırında, öğrenme tetik kuralı GOLMS'te kalır.

## LMS-17 · Öğrenme raporları ve rapor kurucu

Faz: **F5**. Alt modüller: Standart rol bazlı rapor kataloğu; Boyut/ölçü/filtre/detaya inme (drill-down); Zamanlı yetkili dağıtım; Veri tazeliği ve dışa aktarım.

**Kabul senaryosu:** Gösterge paneli, detay, öğrenme geçmişi ve sertifika aynı ölçü sözlüğüyle uzlaşır; yanlış tenant/alıcı rapor alamaz.

## LMS-18 · Toplu operasyon ve veri kalite merkezi

Faz: **F5**. Alt modüller: Kullanıcı/atama/oturum/kanıt import; Şablon/eşleme/önizleme; Satır bazlı hata ve düzeltme; Idempotent yeniden deneme ve toplu geri alma.

**Kabul senaryosu:** Hatalı toplu işlem kısmi sonucu görünür kılar; yeniden deneme kayıt veya atama çoğaltmaz.

## LMS-19 · Kurumsal ve öğrenme entegrasyonları

Faz: **F10**. Alt modüller: HRIS/SCIM/SSO eşleme; VILT/takvim bağlayıcıları; İçerik sağlayıcı/LTI/xAPI; Hata kuyruğu/sağlık/yeniden oynatma.

**Kabul senaryosu:** Her bağlayıcı tenant kapsamı, sürüm, idempotency ve veri sahipliği sözleşmesiyle çalışır.

## LMS-20 · İçerik erişimi ve yaşam döngüsü

Faz: **F5**. Alt modüller: Katalog/grup/rol erişim kuralı; İnceleme ve son kullanma tarihi; Yeni sürüme geçiş/geri çekme; Arşiv ve geçmiş kanıt koruma.

**Kabul senaryosu:** Geri çekilen içerik yeni başlatmayı engeller; geçmiş deneme kaydı (attempt) ve denetim kanıtı sürümüyle korunur.

## LMS-21 · Denetim ve uyum kanıt paketi

Faz: **F5**. Alt modüller: Atama nedeni ve politika sürümü; İçerik/deneme kaydı (attempt)/sınav/görev kanıtı; İstisna/yenileme/denetim (audit) izi; İmzalı dışa aktarım ve saklama.

**Kabul senaryosu:** Yetkili denetçi tek paket içinde kim, neden, neyi, hangi sürümde ve ne zaman tamamladı sorularını doğrular.

## LMS-22 · Mobil, çevrimdışı ve cihaz öğrenimi

Faz: **F10**. Alt modüller: Native görev odaklı navigasyon; İzinli indirme ve şifreli önbellek (cache); Çevrimdışı ilerleme ve çakışma çözümü; Push/deep link/cihaz iptali.

**Kabul senaryosu:** Kullanıcı izinli içeriği çevrimdışı tamamlar; yeniden bağlanınca deneme kaydı (attempt) tekilleşir ve iptal edilmiş cihaz veri açamaz.

## LMS-23 · Çok dilli ve erişilebilir öğrenme operasyonu

Faz: **F5**. Alt modüller: Program/atama/sınav/rapor yerelleştirme; İçerik dil sürümü ve fallback; Sertifika/bildirim locale kuralları; WCAG uyumlu player ve düzenleme.

**Kabul senaryosu:** Dil veya erişilebilirlik tercihi kanıt kimliğini değiştirmez; olmayan içerik çevirisi varmış gibi gösterilmez.

## LMS-24 · GOAI destekli öğrenme operasyonları

Faz: **F5**. Alt modüller: Program ve soru taslağı; Risk/eksik içerik özeti; Doğal dil rapor planı; Kaynak gösterimi/insan onayı/kota.

**Kabul senaryosu:** GOAI yalnızca yetkili veriden açıklanabilir taslak üretir; atama, puan, sertifika veya yayın insan onayı olmadan değişmez.
