# Respongo OS proje bağlamı haritası

Bu harita *hangi bilginin nerede olduğunu* gösterir. Her görevde yalnızca kısa proje özeti ve kuralları, sonra konuya uygun belgeyi oku.

| Belge | Amaç | Ne zaman? |
|---|---|---|
| [`proje-ozeti.md`](proje-ozeti.md) | Ürün ailesi ve mevcut gerçek durum | Respongo OS görevinin başında |
| [`kurallar-ve-sinirlar.md`](kurallar-ve-sinirlar.md) | Sürüm, veri, yetki ve kabul sınırları | Respongo OS görevinin başında |
| [`hedefler.md`](hedefler.md) | Ölçülebilir ürün hedefleri | Plan ve öncelik kararında |
| [`kararlar.md`](kararlar.md) | Tarihli, kesinleşmiş karar günlüğü | Mimari/kapsam değişikliğinde |
| [`acik-kararlar.md`](acik-kararlar.md) | Üretim öncesi seçenek ve dış bağımlılıklar | Bir varsayımı uygulamaya çevirirken |
| [`ajan-is-akisi.md`](ajan-is-akisi.md) | Codex ve Claude dosya, iş devri ve skill koordinasyonu | İki ajan arasında çalışma devrinde |
| [`kaynaklar/README.md`](kaynaklar/README.md) | Ham kaynak saklama kuralı | Yeni kaynak eklerken |
| [`kaynaklar/kaynak-indeksi.md`](kaynaklar/kaynak-indeksi.md) | Gerçek dosya ve bağlantı envanteri | Kaynağa dayanırken |
| [`../.ai_memory/session_state.md`](../.ai_memory/session_state.md) | Son çalışma ve sıradaki iş | Uzun aradan sonra |
| [`../docs/architecture/localization-white-label.md`](../docs/architecture/localization-white-label.md) | HQ dil paketi, lisans, tenant overlay ve sürüm sözleşmesi | Her ürünün görünen metni veya dil hakkı değişirken |
| [`../intelligence/goai-engine/product-architecture.md`](../intelligence/goai-engine/product-architecture.md) | GOAI ürün içi deneyim, motorlar, risk/onay ve iki yönetim düzlemi | AI, agent, RAG, araç, MCP veya kredi değişirken |

Tek gerçeklik düzeni: ürün kararı için `context/kararlar.md`; kapsam için ürün belgeleri; görev ve kabul için `project-tracker.json`; kod davranışı için ileride çalışan kod/test; veri için migration. Bir bağlam dosyası eklenir/taşınırsa bu haritayı güncelle. Sohbetin tamamını hafızaya kopyalama.
