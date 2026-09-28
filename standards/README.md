# Öğrenme standartları

Standart adaptörleri ürünlerden ayrıdır; GOLMS çalışma zamanı ve GOAUTHOR AI dışa aktarımında kullanılır. V3 başlangıcında hiçbir standart “uyumlu” diye sertifikalandırılmamıştır.

- **SCORM 1.2 / SCORM 2004:** ZIP/manifest/launch, kesin 2004 3rd/4th Edition kimliği, SCO oturumu, CMI verisi, tamamlama/başarı, sequencing (sıralama) ve suspend/resume ayrı test edilir. Edition belirlenemeyen 2004 paketi varsayımla etiketlenmez. [ADL 2004 test belgesi](https://adlnet.gov/assets/uploads/SCORM_2004_4ED_v1_1_TR_20090814.pdf).
- **xAPI:** olay sözlüğü, aktör, etkinlik, sonuç, yetkili LRS ve tekrar/idempotency. Genel olay toplamak tek başına xAPI uyumluluğu değildir.
- **cmi5:** paketleme/launch ve xAPI profili; [ADL rehberi](https://www.adlnet.gov/assets/uploads/cmi5%20Best%20Practices%20Guide%20-%20From%20Conception%20to%20Conformance.pdf).
- **LTI 1.3/Advantage:** dış araç güvenli açılışı, rol/derin bağlantı/not hizmetleri; [1EdTech](https://www.1edtech.org/standards/lti).

İlk uygulama dilimi [`scorm/`](scorm/) altında bulunur. ZIP ve manifest güvenlik kapıları ile SCORM 1.2/2004 launch doğrulaması uygulanmıştır; player, sequencing ve resmî uygunluk iddiası henüz yoktur.

Her standart için test paketi, dış sistem çapraz testi, hata matrisi ve desteklenen sürüm kaydı gerekir. [Modüller](modules.md).
