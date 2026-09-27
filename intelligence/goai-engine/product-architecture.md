# GOAI Engine · kanonik ürün ve teknik mimari

**Karar tarihi:** 2026-09-27  
**Durum:** V3 kanonik mimari  
**Kapsam:** GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI ve GOFACTORY içinde çalışan ortak zekâ katmanı

## 1. Kesin ürün kararı

GOAI, müşterinin satın aldığı ayrı bir son kullanıcı portalı veya yedinci SaaS ürün kutusu değildir. Kullanıcı bulunduğu ürünün içinde **Ask GOAI**, **AI Coach**, **Performance Coach**, **AI Discovery** veya **Creative Copilot** deneyimini kullanır.

```text
GOLMS ───── Ask GOAI / Learning Assistant ───┐
GOLXP ───── Ask GOAI / AI Coach ─────────────┤
GOPM ────── Ask GOAI / Performance Coach ────┤
GOCATALOG ─ AI Discovery ────────────────────┼── GOAI Engine
GOAUTHOR AI  Creative Copilot ───────────────┤
GOFACTORY ── Internal Production Assistance ─┘
```

- **Beş SaaS ürünü:** GOLMS, GOLXP, GOPM, GOCATALOG, GOAUTHOR AI.
- **Yönetilen hizmet:** GOFACTORY. Müşteri proje talebi, onay ve teslimi görür; üretimi Respongo yürütür.
- **Ortak yetenek:** GOAI Engine. Ürün verisinin veya iş kuralının sahibi olmaz.
- **İletişim:** `Powered by GOAI` kullanılabilir; ayrı learner/admin GOAI ana sayfası kullanılmaz.
- GOLXP içindeki `AI Coach` sayfası GOLXP özelliğidir; ayrı GOAI ürünü değildir.

## 2. Kontrol düzlemleri

GOAI yönetimi tek ekranda bütün yetkileri birleştirmez.

| Düzlem | Kullanıcı | Yönetebildiği alan | Yönetemediği alan |
|---|---|---|---|
| Ürün içi deneyim | learner, instructor, manager, product admin | Mevcut rolü içindeki konuşma, öneri, taslak ve izinli araç | Rolünü aşan veri veya komut |
| Control Center · Tenant AI Governance | tenant owner/admin, AI admin, security admin | Tenant agent etkinliği, bilgi kaynağı, bütçe, izin, onay kuyruğu, tenant audit görünümü | Global sağlayıcı sırrı, başka tenant, platform maliyeti |
| Respongo HQ · GOAI Operations | platform admin, AI operations, security operations | Sağlayıcı kasası, global model rotası, sağlık, maliyet, eval, rollout ve kill switch | Süreli destek oturumu olmadan tenant içeriği |

`tenant_admin` hiçbir zaman `platform_admin` değildir. HQ müdahalesi MFA, gerekçe, kapsam, süre ve audit kaydı ister.

## 3. Mantıksal bileşenler

```text
intelligence/goai-engine/
  src/domain/             risk, policy, approval, credit ve agent sözleşmeleri
  src/application/        run, plan, approve, execute, evaluate kullanım akışları
  src/infrastructure/     provider, vector store, queue, secret ve telemetry adapterleri
  src/ui/                 yalnız GOAI'ya özgü bağlayıcılar; ortak UI packages/goai-ui'da

packages/goai-ui/      web/native ortak durum ve bileşen sözleşmesi
platform/control-center/ tenant AI governance yüzeyi
operations/respongo-hq/  iç GOAI operations yüzeyi
```

Başlangıç modüler monolittir. Uzun agent, medya ve indeksleme işleri kuyruk/worker üzerinden çalışır. Ölçülmüş kapasite, veri bölgesi veya bağımsız yayın gereksinimi oluşmadan mikroservis ayrımı yapılmaz.

Temel motorlar:

1. **Context Engine:** tenant, gerçek kullanıcı, rol, izin, ürün, rota, seçili nesne, dil, veri sınıfı ve kullanılabilir araçları kurar.
2. **Provider Gateway:** OpenAI, Anthropic, Azure OpenAI, Bedrock, Gemini ve onaylı özel modelleri tek sözleşmeyle çağırır.
3. **Agent Orchestrator:** sürümlü agent/prompt, plan, araç döngüsü, iptal, retry ve timeout yönetir.
4. **Tool Registry:** ürün application command/query sözleşmelerini şemalı, izinli ve denetlenebilir araç olarak yayımlar.
5. **Policy Engine:** tenant, ürün, veri sınıfı, bölge, rol, risk, bütçe ve provider politikasını değerlendirir.
6. **Approval Engine:** yüksek etkili eylemi değişmez etki özeti üzerinden insan onayına bağlar.
7. **Knowledge Engine:** ACL miraslı indeks, kaynak gösterimi, silme ve yeniden indeksleme yürütür.
8. **Usage & Credits:** rezervasyon, kullanım kesinleştirme, iade, limit ve maliyet defteri tutar.
9. **Audit & Evals:** karar izi, güvenlik/kalite ölçümü, yayın kapısı ve olay incelemesi sağlar.
10. **MCP Gateway:** aynı Tool Registry'yi dış AI istemcilerine ayrı OAuth kapsamlarıyla açar.

## 4. Güvenli bağlam sözleşmesi

İstemci yalnızca UX ipucu gönderir:

```ts
interface ClientAIContextHint {
  product: "golms" | "golxp" | "gopm" | "gocatalog" | "goauthor" | "gofactory";
  route: string;
  entity?: { type: string; id: string };
  selectedIds?: string[];
  locale: string;
}
```

Sunucu bağlamı oturum ve veriden yeniden çözer:

```ts
interface ResolvedAIContext {
  tenantId: string;
  actorId: string;
  roleGrants: string[];
  permissions: string[];
  product: string;
  route: string;
  entity?: { type: string; id: string; tenantId: string };
  locale: string;
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  allowedToolIds: string[];
  policyVersion: string;
  requestId: string;
}
```

Tenant, rol, izin ve nesne kapsamı frontend değerinden kabul edilmez. Seçili nesnenin tenant'ı ayrıca doğrulanır. Cache anahtarı tenant, yetki özeti, veri sürümü ve locale içerir.

## 5. Araç ve komut modeli

Model doğrudan veritabanına yazamaz. Her eylem kayıtlı ürün aracından geçer:

```ts
interface GOAIToolDefinition {
  id: string;
  version: string;
  product: string;
  permission: string;
  risk: "R0" | "R1" | "R2" | "R3" | "R4";
  inputSchema: object;
  outputSchema: object;
  maxBulkSize: number;
  supportsDryRun: boolean;
  idempotent: boolean;
  approvalPolicyId?: string;
}
```

- **R0 Read:** Yetkili okuma; ayrıca onay gerekmez.
- **R1 Draft:** Yalnız taslak üretir; canlı kaydı değiştirmez.
- **R2 Write:** Etki önizlemesi ve kullanıcı onayı gerekir.
- **R3 Bulk/Sensitive:** Açık etki özeti, yeniden doğrulama ve güçlü onay gerekir.
- **R4 Destructive/High impact:** Step-up authentication ve politika gerektiriyorsa ikinci onay gerekir.

Approval belgesi `tenant + actor + tool/version + normalized payload hash + affected scope + risk + expiry` değerlerine bağlıdır. Payload değişirse onay geçersiz olur. Çalıştırma idempotency anahtarı taşır; sonuç ürün komutundan geri okunarak doğrulanır.

## 6. Agent ve prompt yaşam döngüsü

Her agent aşağıdakileri sürümlü tutar:

- kimlik, açıklama ve sahip;
- izinli ürün, rol ve araçlar;
- system policy ve prompt template sürümü;
- bilgi kaynağı seçimi;
- model routing ve fallback;
- risk/onay/kredi politikası;
- offline eval sonucu, yayın durumu ve rollback hedefi.

Tenant özel agent yayınlama ileri fazdır. Taslak → sandbox test → güvenlik/eval → onay → kademeli yayın → izleme → rollback akışı uygulanır. Agent talimatı platform güvenlik politikasını veya ürün yetkisini genişletemez.

## 7. Bilgi ve RAG güvenliği

- Kaynak bağlantısındaki ACL ve tenant kapsamı indeks kaydına taşınır.
- Retrieval öncesi ve sonuç/citation aşamasında izin yeniden kontrol edilir.
- Kullanıcının erişemediği belge, özet veya embedding yoluyla da görünmez.
- Prompt injection işaretleri kaynak içeriği ile sistem talimatını ayıran politika katmanında ele alınır.
- Kaynak sürümü, chunk kimliği, son senkron ve silme durumu izlenir.
- Kaynak silinince indeks ve cache için doğrulanabilir silme/yeniden indeks işi çalışır.
- Model yanıtı gerekli kullanım alanında kaynak, belirsizlik ve tazelik gösterir.

## 8. Otomasyon sınırı

Deterministik workflow motoru shared platform veya ilgili ürünün sahibidir. GOAI:

- doğal dili sürümlü workflow taslağına çevirebilir;
- koşul ve eylem önerebilir;
- kayıtlı araçlarla onaylı agent işi yürütebilir.

GOAI ürün olayının, atamanın, bildirimin veya performans kararının sahibi olmaz. Zamanlama, retry, dead-letter, idempotency ve audit ortak iş altyapısında; iş kuralı ilgili üründe kalır.

## 9. Sağlayıcı, model ve sır yönetimi

- Provider anahtarı istemciye veya genel veritabanı sütununa yazılmaz; secret manager referansı tutulur.
- Provider seçimi görev, veri sınıfı, tenant sözleşmesi, bölge, kalite, maliyet ve sağlık üzerinden yapılır.
- Fallback daha düşük veri politikası olan sağlayıcıya sessiz geçiş yapamaz.
- Her çağrı provider/model sürümü, bölge, politika sürümü, latency, token/media kullanımı ve maliyet taşır.
- Tenant BYOK ancak enterprise sözleşme, secret kasası ve ayrı rotalama politikasıyla açılır.

## 10. Veri modeli

Başlıca varlıklar:

```text
ai_conversations, ai_messages, ai_runs, ai_run_steps
ai_agents, ai_agent_versions, ai_prompt_versions
ai_tools, ai_tool_versions, ai_tool_calls
ai_approvals, ai_policy_versions, ai_policy_decisions
ai_providers, ai_provider_configs, ai_model_routes
ai_usage_events, ai_credit_ledger
knowledge_sources, knowledge_documents, knowledge_chunks
ai_evaluation_suites, ai_evaluation_runs
ai_audit_events
```

Her tenant kaydı `tenant_id` taşır. Provider sırrı yerine secret referansı saklanır. Mesaj/audit için ham içeriği koşulsuz saklamak yasaktır; veri sınıfına göre redaksiyon, şifreleme, saklama süresi, legal hold ve silme uygulanır. Kredi defteri append-only rezervasyon/settlement/refund hareketleriyle uzlaştırılır.

## 11. Ortak UX sözleşmesi

`packages/goai-ui` aşağıdaki web/native durumlarını paylaşır:

- `GOAIButton`, `GOAIPanel`, `GOAIMessage`;
- `GOAIActionCard`, `GOAIApprovalCard`, `GOAIResultCard`;
- `GOAIInsightCard`, `GOAISourceCitation`, `GOAIToolProgress`;
- `GOAICreditEstimate`, `GOAICommandSuggestion`.

Desktop'ta non-modal sağ panel; mobilde tam ekran sheet kullanılır. Mevcut sayfa bağlamı görünür, araç ilerlemesi/iptali ve kaynaklar gösterilir. Ürün bağlamı şunları kaydeder:

```ts
interface GOAIProductRegistration {
  product: string;
  routeMatchers: string[];
  contextResolverId: string;
  allowedToolSets: string[];
  promptSuggestionIds: string[];
  featureFlag: string;
}
```

## 12. Ürün davranışları

- **GOLMS:** program/uyum/rapor taslağı, öğrenen açıklama ve sınav hazırlığı. Atama, sertifika ve puan ürün onayını aşamaz.
- **GOLXP:** açıklanabilir öneri, beceri boşluğu ve gelişim planı. AI Coach geçmişi GOLXP yetki ve saklama politikasındadır.
- **GOPM:** görüşme hazırlığı ve gelişim planı taslağı. AI tek başına performans, terfi veya çalışan kararı vermez.
- **GOCATALOG:** semantik arama, eşleştirme ve koleksiyon taslağı. Lisans hakkı yoksa erişim öneriyle açılamaz.
- **GOAUTHOR AI:** proje graph üzerinde önizlenebilir, geri alınabilir ve sürümlü değişiklik. Yayın insan/iş akışı onayındadır.
- **GOFACTORY:** iç brief, senaryo, QA, lokalizasyon ve kapasite yardımı. Müşterinin gördüğü proje/onay/teslim kaydı GOFACTORY hizmetinde kalır.

## 13. Yönetim yüzeyleri

### Control Center → Tenant AI Governance

- tenant AI kullanım özeti ve bütçe;
- etkin agent ve özellikler;
- bilgi kaynağı bağlantıları;
- ürün/rol/araç izinleri;
- bekleyen onaylar;
- tenant audit ve saklama politikası görünümü.

### Respongo HQ → GOAI Operations

- provider secret referansları ve sağlık;
- model kataloğu, global rota ve bölge politikası;
- agent/prompt ana sürümleri ve eval;
- platform maliyeti, normalize kredi oranı ve anomali;
- özellik bayrağı, kademeli rollout ve kill switch;
- tenant içeriğini açmadan anonim/toplulaştırılmış filo sağlığı.

## 14. MCP ve dış istemci sınırı

MCP, Tool Registry üzerindeki ayrı bir adapter'dır. OAuth/OIDC kimliği, tenant üyeliği, açık scope, read/write ayrımı, onay, hız sınırı ve audit zorunludur. Dış istemci GOAI iç servis hesabı veya provider anahtarı alamaz. Kararlı olmayan ürün aracı MCP üzerinden yayımlanmaz.

## 15. Kalite, güvenlik ve işletim kapıları

- iki tenant, her gerçek rol, iptal edilmiş üyelik ve süresi bitmiş deneme negatif testi;
- R0–R4 araç/onay/replay/payload değiştirme testleri;
- prompt injection, veri sızıntısı, hassas veri ve kaynak uydurma eval'leri;
- Türkçe, İngilizce ve lisanslı dillerde görev doğruluğu/uzunluk/kaynaklılık;
- provider kesintisi, timeout, fallback, maliyet limiti ve kuyruk tekrar testi;
- konuşma silme/saklama, kaynak ACL değişimi ve yeniden indeks testi;
- agent/prompt/model sürümüne bağlı kalite regresyon kapısı;
- yüksek etkili HR ve öğrenme kararlarında insan onayı ve itiraz yolu.

## 16. Uygulama sırası

1. Context Engine ve ürün kayıt sözleşmesi.
2. Provider Gateway, secret referansı ve model routing.
3. Tool Registry, R0–R4 risk ve dry-run.
4. Approval, audit ve kredi defteri.
5. Shared GOAI UI ve ilk GOLMS read-only yardımcı.
6. Tenant Governance ve HQ Operations yüzeyleri.
7. Knowledge/RAG, agent registry ve eval pipeline.
8. Ürün bazlı yazma araçları, otomasyon ve MCP.

İlk dikey dilim yalnız GOLMS read-only sorgusu ve kaynaklı yanıtla başlar. Yazma aracı, approval/audit/idempotency kapıları tamamlanmadan açılmaz.

## 17. Kabul ölçütü

GOAI mimarisi ancak aşağıdakiler birlikte kanıtlandığında tamamlanmış sayılır:

- ayrı learner veya normal admin GOAI ürünü bulunmaz;
- bütün ürünler ortak motoru ürün bağlamıyla kullanır;
- AI yetkisi kullanıcı yetkisini ve tenant sınırını aşmaz;
- model doğrudan veritabanı yazmaz;
- R2–R4 eylemler doğru onay ve ürün komutundan geçer;
- provider/model değişebilir ve veri bölgesi politikası korunur;
- kaynak, araç, onay, maliyet ve sonuç aynı run izinde doğrulanır;
- Control Center ile Respongo HQ yetkileri karışmaz;
- kritik eval gerilemesi yayını durdurur.

