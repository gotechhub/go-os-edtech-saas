# Respongo OS · F0 tehdit modeli ve veri güvenliği temeli

**Kapsam:** Vercel web/BFF, Supabase PostgreSQL/Auth, özel S3/CloudFront, worker/kuyruk, web/native istemci, dış entegrasyon ve GOAI sağlayıcıları. Bu belge hukukî uygunluk beyanı değildir; F1 uygulama ve bağımsız güvenlik incelemesinin girdisidir.

## Güven sınırları

1. Tarayıcı/native istemci güvenilir değildir; tenant, rol, ürün hakkı ve nesne kapsamı sunucuda yeniden çözülür.
2. Tenant verisi başka tenant, iç Super Admin veya OS Core tarafından varsayılan olarak okunamaz.
3. Super Admin müşteri yaşam döngüsünü yönetir; migration, secret, altyapı ve global güvenlik komutu çalıştırmaz.
4. OS Core ayrı iç kimlik, MFA, görev ayrılığı, süreli yetki ve audit olmadan ayrıcalıklı komut çalıştırmaz.
5. S3 karantina nesnesi tarama, bütünlük, hak ve format kontrolünden önce yayın alanına geçmez.
6. GOAI modeli veritabanına doğrudan yazmaz; kayıtlı, sürümlü ve risk sınıflı ürün aracı kullanır.

## Öncelikli tehditler ve kontrol

| Tehdit | Etki | Zorunlu kontrol | Kabul kanıtı |
|---|---|---|---|
| Tenant kimliği/nesne ID değiştirme | Çapraz müşteri veri sızıntısı | RLS + sunucu üyelik/entitlement/nesne kontrolü | İki tenant negatif API/DB testi |
| Rol önizlemesiyle yetki yükseltme | İç veya yönetici komutu | Önizleme yalnız UI bağlamı; gerçek grant sunucudan | Her rol için forbidden testi |
| Deneme bitişini istemciden aşma | Lisanssız yazma | Ortak DB/RPC write gate, kuyruk ve çevrimdışı senkron kontrolü | Süresi bitmiş tenantta bütün yazma yolları reddi |
| Dosya/ZIP/SCORM saldırısı | Zararlı içerik, path traversal, çerez erişimi | Karantina, MIME/hash, zip sınırı, malware, ayrı player origin/CSP | Zararlı/bozuk/replay paket testleri |
| Secret sızıntısı | AWS/AI/veri ihlali | OIDC, secret manager referansı, redaksiyon, döndürme | Git/log/client bundle secret taraması |
| Kuyruk/webhook replay | Çift kayıt ve maliyet | İmza, idempotency, lease, dead-letter | Aynı olayın tekrarında tek sonuç |
| GOAI prompt injection/veri kaçışı | Gizli veri veya yetkisiz komut | Kaynak/ACL yeniden kontrolü, tool allowlist, R2–R4 onay | Injection, yanlış tenant ve payload değiştirme eval'i |
| Super Admin/Core görev karışması | Aşırı ayrıcalık | Ayrı permission namespace, oturum ve komut yüzeyi | Super Admin teknik komutta 403; Core müşteri içeriğinde süreli erişim ister |
| Silme/retention hatası | KVKK/GDPR ve sözleşme riski | Veri sınıfı, saklama politikası, legal hold, doğrulanabilir silme | DB/S3/indeks/cache silme tatbikatı |
| Bölge/alt işleyen sapması | Veri ikameti ihlali | Bölge envanteri, DPA ve provider policy | Tenant bölge politikası ve veri akış kaydı |

## Veri sınıfları

- **Public:** yayımlanmış pazarlama/yardım bilgisi.
- **Internal:** platform operasyon metadata'sı; müşteri rolüne açılmaz.
- **Confidential:** kullanıcı profili, öğrenme, performans ve sözleşme verisi.
- **Restricted:** kimlik belgesi, hassas değerlendirme, secret, güvenlik olayı ve özel müşteri içeriği.

Her tablo/asset/message bir sınıf ve saklama sahibine bağlanır. Log ve audit, gereksiz ham içerik yerine aktör, eylem, kapsam, karar ve korelasyon kimliği saklar.

## F1/F10 doğrulama kapıları

- F1: tehditlerin DB/API negatif test karşılığı, secret envanteri, bölge veri akışı ve olay sahipleri.
- F2: OS Core ayrıcalıklı erişim, break-glass ve olay müdahalesi.
- F10: bağımsız güvenlik incelemesi, geri yükleme/silme tatbikatı, bağımlılık/SBOM ve müşteri sözleşme kontrolü.
