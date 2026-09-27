# GOAI mimari girdi incelemesi

**İnceleme tarihi:** 2026-09-27  
**Girdi:** Kullanıcı tarafından sağlanan `Respongo_GOAI_Final_Architecture_Codex.md` v1.0  
**Sonuç:** Ana ürün kararı kabul edildi; kontrol düzlemi, güvenlik ve sahiplik ayrımları düzeltilerek kanonik mimariye işlendi.

## Korunan kararlar

- GOAI ayrı learner/admin ürünü değildir; ürünlerin içinde çalışır.
- Ortak Context Engine, Provider Gateway, Agent/Tool/Policy/Approval, Knowledge, Usage, Audit, MCP ve eval katmanı gerekir.
- Model doğrudan DB yazmaz; izinli ürün araçlarını kullanır.
- AI yetkisi oturum kullanıcısının yetkisini aşamaz.
- R0–R4 risk sınıfı, önizleme ve insan onayı uygulanır.
- GOAUTHOR değişiklikleri sürümlü, önizlenebilir ve geri alınabilir olmalıdır.
- GOAI UI tek ortak paket olup ürün bağlamıyla yapılandırılmalıdır.

## Düzeltilen noktalar

| Girdideki belirsizlik | V3 kararı |
|---|---|
| GOFACTORY ana ürünlerle aynı listede | GOFACTORY SaaS ürünü değil, Respongo yönetilen üretim hizmetidir. |
| Tenant ve Respongo iç rolleri aynı GOAI Management alanında | Tenant yönetimi Control Center; global provider/secret/maliyet/rollout Respongo HQ alanındadır. |
| AI automation bütün workflow'ların sahibi gibi | Deterministik workflow platform/ürün sahibinde; GOAI taslak ve izinli agent orkestrasyonu sağlar. |
| Audit'te ham user request zorunlu | Veri sınıfına bağlı redaksiyon, şifreleme ve saklama; ham içerik koşulsuz loglanmaz. |
| Approval yalnız ekran onayı | Onay tenant, araç sürümü, payload hash, kapsam, risk ve süreye bağlıdır. |
| Provider config veritabanı kaydı | Kimlik bilgisi secret manager'da; veritabanında yalnız referans ve politika metadata'sı. |
| MCP doğrudan motor erişimi | MCP kararlı Tool Registry üzerinde OAuth/OIDC scope'lu adapter'dır. |

## Kanonik kaynak

Uygulama ve sonraki kararlar için [`GOAI product architecture`](../intelligence/goai-engine/product-architecture.md) kullanılır. Bu inceleme kaynak notudur; kod, migration veya görev kabulünün yerine geçmez.

