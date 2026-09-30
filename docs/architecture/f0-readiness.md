# F0 · mimari hazırlık ve kapanış denetimi

**Tarih:** 2026-09-30  
**Karar:** F0 tanım çalışması ilerliyor; kullanıcı araştırması ve UX yön seçimi tamamlanmadığı için faz kapanmadı.

| Modül | Tanım kanıtı | Durum | Eksik kapanış kanıtı |
|---|---|---|---|
| FOUND-01 Ürün araştırması | `research/competitive-landscape.md`, Invince ekran denetimi, ürün README/modülleri | Aktif | İki sektör ve gerçek rollerle tarihli görev oturumları; ürün bazlı yap/sonra/yapma kararı |
| FOUND-02 Alan sahipliği | mimari README, veri/API/olay sözleşmeleri, V3-016/V3-017, teslim sırası ve `architecture:check` | Tanım + uygulama doğrulandı | Kabul için tüm veri kökleri ve sürümlü sözleşmelerin migration/test üzerinden sahiplik denetimi |
| FOUND-03 Güvenlik/veri | `threat-model.md`, `security-operations.md`, depolama ve veri sözleşmeleri | Tanım doğrulandı | Hukuk/veri ikameti kararı, bağımsız güvenlik incelemesi ve negatif test uygulaması |
| FOUND-04 Bütçe/ölçek | `capacity-cost-baseline.md`, teslim ve release kapıları | Tanım doğrulandı | Gerçek beta yük testi, ölçülmüş maliyet ve geri dönüş kapasitesi |
| UX-01 Deneyim araştırması | rol görev envanteri, 21st brief, deneyim kalite sözleşmesi | Aktif | Üç görsel yön, görev puanlaması, erişilebilirlik incelemesi ve kullanıcı seçimi |

## Değişiklik etki kuralı

Kalıcı bir mimari değişiklikte sırasıyla ürün sahibi, veri sahibi, API/olay tüketicileri, RLS/tenant/deneme kapısı, OS Core/Super Admin/Control Center yetkisi, web/native/yerelleştirme etkisi, migration/rollback ve tracker kanıtı kontrol edilir. Etkilenen sözleşme ve test bulunmadan değişiklik kabul edilmez.

## F0'dan F1'e geçiş

F1 kodu teknik keşif olarak bulunabilir; ancak F0 kapısı kapanmış sayılmaz. Geçiş için `FOUND-01` ve `UX-01` kullanıcı kanıtı, A-01 veri bölgesi kararı ve bütün F0 tanım görevlerinin tarihli kanıtı gerekir. Uygulama başlayabilir, beta kabulü bu açıkları atlayamaz.
