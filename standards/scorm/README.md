# SCORM paket kabul motoru

Bu paket, karantinaya yüklenmiş SCORM ZIP dosyasını **dosyaları diske çıkarmadan** inceler. GOLMS çalışma zamanı veya player değildir.

## Uygulanan kapılar

- ZIP yapısı ve bozuk arşiv kontrolü
- Mutlak yol, `..`, ters eğik çizgi, URI ve yinelenen yol engeli
- Şifreli dosya ve sembolik bağlantı engeli
- Dosya sayısı, tek dosya boyutu, toplam açılmış boyut ve sıkıştırma oranı sınırı
- Kök `imsmanifest.xml` zorunluluğu ve manifest boyut sınırı
- DTD ve entity yasağı
- SCORM 1.2 / 2004 sürüm tespiti
- SCO, launch hedefi ve pakette gerçek launch dosyası doğrulaması

## Bilinçli sınırlar

- Malware kararı ayrı tarama sağlayıcısından gelir; bu paket antivirüs değildir.
- Başarılı paket analizi tek başına yayımlama yapmaz. Hak kontrolü, temiz malware sonucu ve idempotent yayın worker'ı ayrıca gerekir.
- Sequencing, SCORM API adapter, suspend/resume ve conformance testi sonraki çalışma zamanı adımıdır.
