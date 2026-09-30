# Respongo OS · UX yön araştırması

**Durum:** karşılaştırma adayı; seçim yapılmadı.  
**21st dayanağı:** [dashboard bileşenleri rehberi](https://docs.21st.dev/blog/react-dashboard-components), [dashboard koleksiyonu](https://21st.dev/community/components/explore/ui-dashboard), [command palette koleksiyonu](https://21st.dev/community/components/explore/react-command-palette). Yalnız düzen ilkeleri incelendi; üçüncü taraf kodu ürüne kopyalanmadı.

## Değişmeyen kurallar

- Türkçe varsayılan; İngilizce ve sekiz lisanslı dil; RTL/CJK/uzun etiket testi.
- Okunaklı tırnaksız font, açık/koyu tema, semantik token ve görünür klavye odağı.
- OS Core, Super Admin, Control Center ve ürün rolü birbirinin yetkisini taklit etmez.
- Kartlar özet içindir; uzun kayıtlar sıralanabilir/filtrelenebilir tabloya geçer.
- Grafiklerin erişilebilir tablo karşılığı bulunur; yükleniyor/boş/hata/yasak/eski veri durumları tasarlanır.
- Sahte “canlı” veya kanıtsız başarı metriği gösterilmez.

## Yön A · Calm Command / Sakin Komuta

**Fikir:** yoğun yönetim işlerinde tek kritik durum, sıradaki işler ve ayrıntılı kayıt tablosu. Sol daraltılabilir navigasyon, üstte global arama/komut paleti, içerikte birincil uyarı → görev kuyruğu → kanıt tablosu hiyerarşisi.

- En uygun: OS Core, Super Admin, Control Center, GOLMS admin ve eğitmen.
- Fark: az kart, yüksek bilgi yoğunluğu; sağdaki bağlamsal denetçi paneli; her metrikte dönem/tazelik.
- Risk: öğrenen ekranında fazla operasyonel görünebilir; mobilde tablolar görev kartlarına dönüşmelidir.
- 21st referansı: collapsible sidebar, stats card ve data-grid bileşen sınıfları. Recharts yalnız grafik gerçekten karşılaştırma gerektiriyorsa kullanılır.

## Yön B · Guided Momentum / Yönlendirilmiş İlerleme

**Fikir:** kullanıcının tek sonraki eylemini öne çıkaran, görsel hikâye ve ilerleme odaklı deneyim. Üstte “şimdi devam et”, altında yolculuk, yaklaşan işler, öneri gerekçesi ve sosyal kanıt.

- En uygun: öğrenen, onboarding, GOLXP ve kişisel gelişim görünümü.
- Fark: içerik/kapak ağırlığı, yatay keşif ve kilometre taşı; küçük ödül animasyonu; alt mobil navigasyon.
- Risk: yönetim verisini kartlara dağıtıp karşılaştırmayı zorlaştırabilir; hareket reduced-motion ile kapanmalıdır.
- 21st referansı: progress metric, course card ve activity/timeline kompozisyonları. Dekoratif 3D/glow kullanılmaz.

## Yön C · Adaptive Workbench / Uyarlanabilir Çalışma Masası

**Fikir:** rol ve iş gününe göre sabitlenen modüler çalışma alanı. Kullanıcı izinli widget'ları sıralar; sistem görev türüne göre yoğunluk ve sağ paneli değiştirir. Command palette klavye kullanıcıları için birincil hızlandırıcıdır.

- En uygun: çok rollü kullanıcı, eğitmen + yönetici, içerik üreticisi ve ürünler arası operasyon.
- Fark: widget düzeni ve yoğunluk tercihi; çok ürünlü görev kutusu; bağlamsal GOAI paneli.
- Risk: ilk kullanım karmaşası, kişiselleştirme yükü ve düzen sürümü yönetimi. Varsayılanlar rol bazlı olmalı; kritik işler gizlenememeli.
- 21st referansı: command palette, nested sidebar ve bento/analytics panel kompozisyonları. Serbest yerleşim yerine erişilebilir, sınırlı grid kullanılır.

## Önerilen birleşim ve doğrulama

Kanonik başlangıç adayı **A tabanlı rol uyarlaması**dır: yönetim alanları Calm Command; öğrenen yüzeyi B'nin Guided Momentum düzenini; çok rollü ileri kullanıcılar C'nin sınırlı command palette ve sabitlenebilir görevlerini kullanır. Tek bir görünüm bütün rollere zorlanmaz.

| Ölçüt | A | B | C |
|---|---:|---:|---:|
| Yönetim görev hızı hipotezi | 5 | 2 | 4 |
| Öğrenen motivasyonu hipotezi | 3 | 5 | 3 |
| Mobil sadelik hipotezi | 3 | 5 | 3 |
| Veri karşılaştırma hipotezi | 5 | 2 | 4 |
| Öğrenme maliyeti hipotezi | 4 | 5 | 2 |
| Erişilebilirlik riski | Düşük | Orta | Orta-yüksek |

Puanlar tasarım ekibi hipotezidir. `UX-01` yalnız üç yön aynı beş rol görevinde prototiplenip gerçek kullanıcı oturumuyla puanlandıktan sonra doğrulanır.
