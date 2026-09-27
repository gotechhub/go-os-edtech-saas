# GOAI Engine · ortak zekâ · modül dökümü

**Tek görev kaynağı:** [V3 takip](../../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| AI-01 | F5 | Model ağ geçidi ve politika | 0/3 |
| AI-02 | F5 | Kaynaklı arama ve bilgi | 0/3 |
| AI-03 | F5 | Öneri ve beceri zekâsı | 0/3 |
| AI-04 | F5 | Doğal dille rapor ve agent işleri | 0/3 |
| AI-05 | F6 | AI değerlendirme ve izleme | 0/3 |
| AI-06 | F5 | Çok dilli AI ve çeviri güvenliği | 0/3 |
| AI-07 | F5 | İçerik zekâsı ve metadata yardımcısı | 0/3 |
| AI-08 | F5 | Ölçme ve değerlendirme yardımcısı | 0/3 |
| AI-09 | F5 | Rol bazlı operasyon yardımcıları | 0/3 |

## AI-01 · Model ağ geçidi ve politika

Faz: **F5**. Alt modüller: Sağlayıcı soyutlama; Tenant/bölge izinleri; Kota/maliyet/deneme limiti.

**Kabul senaryosu:** Yetkisiz veri modele gitmez, limit aşımında çağrı durur.

## AI-02 · Kaynaklı arama ve bilgi

Faz: **F5**. Alt modüller: İzin kapsamlı indeks; Kaynak/provenans bağlantısı; Silme ve yeniden indeks.

**Kabul senaryosu:** İki tenant arasında sonuç sızmaz; kaynak geri çağrılır.

## AI-03 · Öneri ve beceri zekâsı

Faz: **F5**. Alt modüller: Neden gösterimi; İnsan onayı; Etkililik ölçümü.

**Kabul senaryosu:** Öneri açıklanır, reddedilir ve ölçüm nedensellik iddia etmez.

## AI-04 · Doğal dille rapor ve agent işleri

Faz: **F5**. Alt modüller: Yetkili sorgu planı; Onaylı aksiyon; Araç/audit sınırı.

**Kabul senaryosu:** Serbest metin, rolü aşan veri veya yazma işlemi üretemez.

## AI-05 · AI değerlendirme ve izleme

Faz: **F6**. Alt modüller: Kalite/güvenlik eval; Prompt/sürüm izi; Maliyet ve hata gözlemi.

**Kabul senaryosu:** Kritik gerileme yayını durdurur; örneklerde müşteri sırrı yoktur.

## AI-06 · Çok dilli AI ve çeviri güvenliği

Faz: **F5**. Alt modüller: Arayüz/kaynak/yanıt dili ayrımı; 10 dil kalite ve kaynaklılık eval'i; İzinli çeviri/insan onayı.

**Kabul senaryosu:** Model yanıtı seçilen dilde kaynaklıdır; tenant verisi ve gizli yorum izin dışına çıkmaz.

## AI-07 · İçerik zekâsı ve metadata yardımcısı

Faz: **F5**. Alt modüller: Özet/etiket/taksonomi taslağı; Beceri ve rol eşleme önerisi; Benzer/tekrar içerik sinyali; Kaynak ve güven skoru.

**Kabul senaryosu:** AI önerisi mevcut sözlüğe aday olarak düşer; insan onayı olmadan katalog veya beceri kimliği değiştirmez.

## AI-08 · Ölçme ve değerlendirme yardımcısı

Faz: **F5**. Alt modüller: Öğrenme çıktısından soru taslağı; Zorluk/yanıltıcı/önyargı kontrolü; Madde analizi önerisi; Uzman onayı ve sürüm.

**Kabul senaryosu:** AI sorusu kaynak, hedef ve uzman onayı olmadan canlı sınava girmez; model çıktısı cevap anahtarının tek kanıtı değildir.

## AI-09 · Rol bazlı operasyon yardımcıları

Faz: **F5**. Alt modüller: Admin/eğitmen/yönetici/öğrenen bağlamı; İzinli sıradaki iş önerisi; Önizleme-onay-uygulama; Araç kapsamı ve geri alma.

**Kabul senaryosu:** Yardımcı gerçek rolü aşamaz; yüksek etkili komut açık onay ve ürün API'si olmadan çalışmaz.
