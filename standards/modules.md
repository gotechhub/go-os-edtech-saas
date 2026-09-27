# Standartlar ve entegrasyon · modül dökümü

**Tek görev kaynağı:** [Respongo OS takip](../project-tracker.json). Her modül üç kabul adımına sahiptir: tanım/araştırma, uygulama, kanıtlı kabul.

| ID | Faz | Modül | Durum |
|---|---|---|---|
| STD-01 | F6 | Öğrenme standartları uyumu | 0/3 |
| STD-02 | F6 | Kimlik ve kurumsal bağlantılar | 0/3 |
| STD-03 | F6 | Erişilebilirlik ve yerelleştirme | 0/3 |
| STD-04 | F6 | Açık API ve dış veri | 0/3 |

## STD-01 · Öğrenme standartları uyumu

Faz: **F6**. Alt modüller: SCORM 1.2/2004 paket testleri; xAPI/cmi5 kayıt; LTI sınır ve uygunluk.

**Kabul senaryosu:** Referans paket ve conformance testi sürüme bağlanır.

## STD-02 · Kimlik ve kurumsal bağlantılar

Faz: **F6**. Alt modüller: SAML/OIDC/SCIM; HRIS eşleme; Teams/Zoom/GoToTraining.

**Kabul senaryosu:** Bağlayıcı hata/retry/idempotency ve hak senaryosu geçer.

## STD-03 · Erişilebilirlik ve yerelleştirme

Faz: **F6**. Alt modüller: WCAG 2.2 AA; Klavye/okuyucu/altyazı; 10 dil, RTL ve CJK yazı sistemi.

**Kabul senaryosu:** Kritik akışlarda erişilebilirlik, on dil ve Arapça RTL QA kaydı var.

## STD-04 · Açık API ve dış veri

Faz: **F6**. Alt modüller: Sürüm/hız sınırı; Webhook imza/yeniden deneme; Veri taşınabilirliği.

**Kabul senaryosu:** Dış entegrasyon tenant yetki ve audit sınırında çalışır.
