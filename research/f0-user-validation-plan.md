# F0 kullanıcı ve görev doğrulama planı

Bu dosya araştırma planıdır; tamamlanmış kullanıcı görüşmesi kanıtı değildir. Amaç, masa başı rakip incelemesini gerçek görev başarısıyla sınamak ve ürün yol haritasını görüşe göre yeniden önceliklendirmektir.

## Örneklem

- İki sektör: hukuk ve konaklama/otelcilik.
- Her sektörde en az beş görev sahibi: öğrenen, L&D/tenant admini, eğitmen/içerik sahibi, hat yöneticisi ve kurum karar vericisi.
- Respongo iç operasyonundan ayrıca bir Super Admin ve bir OS Core teknik operatör oturumu.
- Toplam en az 12 moderasyonlu görev oturumu; aynı kişi birden çok rolü temsil ederse rol çatışması not edilir.

## Doğrulanacak kritik görevler

| Rol | Görev | Başarı kanıtı |
|---|---|---|
| Öğrenen | Zorunlu eğitimini bul, kaldığın yerden devam et, kanıtını gör | Yardımsız başarı, süre, hata ve güven puanı |
| Tenant admini | Program oluştur, içerik ekle, zorunluluk koy, hedef kitleye ata, sonucu raporla | Tamamlama süresi, geri dönüş ve veri doğruluğu |
| Eğitmen | Oturum ve değerlendirme kuyruğunu yönet | Bekleyen işi bulma, toplu işlem hatası, mobil başarı |
| Hat yöneticisi | Geciken kişi ve beceri açığını gör, gelişim eylemi öner | Doğru kişiyi/kanıtı bulma ve karar açıklanabilirliği |
| Kurum karar vericisi | Deneme, ürün hakkı, kullanım ve risk görünümünü anla | Lisans/deneme durumunu doğru yorumlama |
| Super Admin | Demo/müşteri portalı oluştur, paket/lisans ata, desteği devret | İç demo ile müşteri denemesini karıştırmama |
| OS Core | Sistem olayını bul, tenant etkisini sınırla, kontrollü geri al | Ayrıcalıklı komut, gerekçe, onay ve audit doğruluğu |

## Yöntem ve ölçüm

1. Kişisel veya müşteri verisi içermeyen tıklanabilir prototip ve sentetik kayıt kullanılır.
2. Katılımcıya ekran öğretilmez; görev ve başarı sonucu verilir.
3. Yardımsız başarı, toplam süre, geri dönüş sayısı, kritik hata, tek soru kolaylık puanı ve açık yorum kaydedilir.
4. En az iki katılımcının aynı kritik noktada başarısız olması tasarım/akış sorunu adayıdır.
5. Her bulgu ürün, rol, önem, kanıt bağlantısı ve alınan kararla kayıt altına alınır.
6. Görüşme notu açık rıza olmadan isim/e-posta içermez; ham kayıt saklama süresi araştırma başlamadan belirlenir.

## F0 çıkış şartı

`FOUND-01` tanım görevi ancak kaynaklı rakip matrisi, bu oturumların tarihli kanıtı ve her ürün için `yap / sonra / yapma` öncelik kararı birlikte bulunduğunda doğrulanır. Tasarım yönü `UX-01` için en az üç anlamlı yön aynı görevlerle puanlanır.
