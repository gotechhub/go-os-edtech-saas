# Veri mimarisi ve sahiplik sözleşmesi

Bu dosya alanların **tasarım sözleşmesidir**. Tenant/üyelik/rol/entitlement/deneme için ilk yerel migration ve RLS iskeleti [Respongo OS Supabase foundation](../../supabase/README.md) içinde uygulanmıştır; aşağıdaki diğer ürün tabloları migration yazılana kadar taslaktır. Hosted doğrulama ayrıca gerekir.

## Ortak çekirdek kavramları

| Kavram | Sahip / ana alanlar | Kural |
|---|---|---|
| `tenants`, `portals`, `industry_packs` | Platform: id, durum, bölge, sektör/sürüm, deneyim/marka | Tenant kapatma/veri silme ayrı süreç; slug yetki kaynağı değil |
| `identities`, `memberships`, `teams`, `role_grants` | Platform: auth id, tenant, ekip, kapsam, başlangıç/bitiş | Kimlik birden çok tenant üyesi olabilir; tüm komutlar aktif bağlam doğrular |
| `operator_accounts`, `support_sessions` | HQ: ayrı iç kayıt, MFA, gerekçe, süre, hedef tenant | Müşteri rolünden türetilemez; destek oturumu audit zorunlu |
| `product_releases`, `entitlements`, `trials` | Platform: ürün, durum, başlangıç/bitiş UTC, kota, sözleşme | Tek tenant deneme saati; yeniden başlatma yok; iç demo hariç |
| `v3_storage.locations`, `assets`, `asset_versions`, `upload_intents`, `scan_events`, `processing_jobs`, `package_manifests`, `scorm_publications` | Platform: tenant bucket envanteri, S3 anahtar, hash, hak, karantina/tarama/yayın ve iş durumu | Migration 004–006 yerel akışında uygulanmıştır; ham nesne tarama, bütünlük, hak ve manifest doğrulaması olmadan yayımlanmaz |
| `audit_events`, `outbox_events`, `idempotency_keys` | Platform: aktör, tenant, neden, olay sürümü, sonuç | Tekrarlanan istek güvenli; denetim izi değiştirilemez kayıt modeli |
| `supported_locales`, `message_definitions`, `language_pack_versions`, `base_translations` | OS Core teknik yayın kararı; platform saklama/sunma: BCP 47 dil, ürün ad alanı/anahtar, checksum, placeholder, insan QA ve sürüm | TR/EN dahil; ek dil yalnızca onaylı temel paket ve Super Admin lisansıyla açılır |
| `tenant_language_entitlements`, `tenant_locale_settings`, `tenant_term_versions`, `tenant_label_versions`, `user_locale_preferences` | HQ lisans hakkı; platform tenant ayarı/overlay/kullanıcı tercihi | Sekiz ek dil lisanslı; müşteri yalnızca izinli görünen metni değiştirir, yeni anahtarlar overlay'i bozmadan gelir |
| `job_profiles`, `competency_definitions`, `proficiency_levels`, `role_competency_expectations` | Platform: tenant/sektör sözlüğü, sürüm, kaynak ve geçerlilik | GOLMS/GOLXP/GOPM aynı sabit kimliği tüketir; ürünler sözlüğü kopyalamaz |
| `ai_agents`, `ai_agent_versions`, `ai_prompt_versions`, `ai_tools`, `ai_tool_versions`, `ai_policy_versions` | GOAI Engine: sürümlü agent/prompt/araç/politika metadata'sı | Agent kullanıcı yetkisini genişletemez; ürün komutu ürün sahibinde kalır |
| `ai_conversations`, `ai_messages`, `ai_runs`, `ai_tool_calls`, `ai_approvals`, `ai_audit_events` | GOAI Engine: tenant kapsamlı etkileşim, plan, araç, onay ve sonuç izi | Ham içerik koşulsuz audit edilmez; veri sınıfı, redaksiyon, şifreleme ve saklama uygulanır |
| `ai_providers`, `ai_provider_configs`, `ai_model_routes` | Respongo OS Core yönetir; GOAI Engine uygular | Kimlik bilgisi secret manager'da, tabloda yalnız secret referansı ve politika metadata'sı bulunur |
| `ai_usage_events`, `ai_credit_ledger` | GOAI Engine ölçer; HQ fiyat/kredi politikası, tenant bütçe/hak görünümü | Append-only rezervasyon/settlement/refund; provider maliyeti müşteri rolüne açılmaz |
| `knowledge_sources`, `knowledge_documents`, `knowledge_chunks` | GOAI Engine indeks metadata'sı; belge/hak ilgili ürün veya tenant kaynağında | Tenant/ACL retrieval ve citation anında yeniden doğrulanır; silme indeks/cache'e yayılır |

Ürün tabloları alanına ait `tenant_id` ve kendi kök kimliğini taşır. Örnek kökler: `learning_objects`, `learning_object_versions`, `programs`, `program_versions`, `enrollments`, `assignments`, `attempts`, `assessment_attempts`, `evidence_records`, `compliance_requirements`, `certificates`, `sessions` (GOLMS); `learning_journeys`, `skill_passports`, `skill_evidence_links` (GOLXP); `catalog_items`, `licence_grants` (GOCATALOG); `author_projects`, `publications` (GOAUTHOR); `goals`, `review_cycles` (GOPM); `service_requests`, `projects`, `approvals`, `deliverables` (GOFACTORY). Bu adlar migration yazılana kadar sözleşme taslağıdır; V2 tablolarının birebir devamı değildir.

## Veri akışı ilkeleri

- Olay kaynaklı okuma modelleri ürünler arası bildirim için kullanılabilir; yetki ve tamamlanma gerçeği GOLMS/ürün sahibi kayıtlarında kalır. İşlemsel outbox ve idempotent tüketici, çift işlem ve kayıp olayı önlemek için planlanır.
- Tenant id'si istemciden tek başına güvenilir sayılmaz; oturum, üyelik, ürün hakkı ve nesne tenant'ı birlikte doğrulanır. RLS yanında güvenli sunucu komutları ve negatif çapraz tenant testleri gerekir.
- SCORM runtime ham anahtar/değer durumu ile normalleştirilmiş tamamlanma/puan farklı kayıttır; yeniden başlatma ve sürüm değişikliği geçmiş denemeyi silmez.
- Program ve içerik yayını immutable sürüm üretir. Atama/enrollment sürümü sabitler; yeni sürüme geçiş ayrı komut ve audit olayıdır.
- Enrollment/assignment, attempt, assessment, evidence ve certificate birbirinin durumu olarak tek sütunda tutulmaz; ayrı yaşam döngüleri ve referanslarla bağlanır.
- Beceri kanıtı kaynağını, sürümünü, güven düzeyini ve izin kapsamını taşır. Eğitim tamamlama otomatik yetkinlik veya performans puanı değildir.
- Analitik, kaynak komut verisinden türetilmiş ve tazelik etiketiyle gösterilen read modeldir; özel raporlar tenant ve alan izinlerini aşamaz.
- Kişisel veri için yaşam döngüsü, veri ikameti, dışa aktarma/silme talepleri ve saklama çizelgesi ülke/müşteri sözleşmesine göre belirlenir; tek küresel varsayılan süre uydurulmaz.
- Kurs, katalog, GOFACTORY teslimi ve GOPM görüşme gibi içerik çevirilerinin sahibi ilgili ürün/hizmettir; ortak platform yalnızca arayüz mesajı, terim/etiket ve dil tercihini yönetir. Veri ve çözümleme sırası [çok dillilik sözleşmesinde](localization-white-label.md) tanımlıdır.
- GOAI istemci bağlamındaki tenant/rol/izin değerini yetki kaynağı saymaz. Sunucu oturum, üyelik, ürün hakkı ve nesne tenant'ından `ResolvedAIContext` üretir. Tool call ilgili ürünün sürümlü application command/query sözleşmesine gider; model veya RAG katmanı doğrudan ürün tablosuna yazmaz.
- AI approval; tenant, actor, tool/version, normalize payload özeti, etkilenen kapsam, risk ve süreye bağlıdır. Payload veya araç sürümü değişirse yeniden onay gerekir. Replay idempotency ile engellenir.

## 14 günlük deneme durum makinesi

`internal_demo` ayrı bir iç portal türüdür ve müşteri deneme sayacına girmez. Müşteri yaşam döngüsü `not_activated → customer_trial(active, started_at UTC, ends_at UTC) → expired_read_only` şeklindedir; `paid_active` sözleşmeli yolu etkin denemeden veya süre sonundan açılabilir. Ürünler yalnızca yayımlanmış ve tenant hakkı varsa görünür/çalışır. Deneme tenant için bir kez açılır; ürün sürümü sonradan açılırsa sayaç yeniden başlamaz. Bitişte tenant verisi silinmez, yetkili okuma/rapor kalır, bütün müşteri yazmaları API/RPC ve RLS/komut kapısında reddedilir. İçe aktarma, kuyruk, e-posta tetiklemeli iş, mobil çevrimdışı senkron ve AI aracından yazma da aynı kapıyı kullanır. GOFACTORY sözleşmeli hizmeti deneme hakkına bağlı değildir.
