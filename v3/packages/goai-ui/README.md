# `@respongo-os/goai-ui` · hedef ortak UI paketi

Bu klasör GOAI'nın ürünlerin içine gömülen web/native deneyim sözleşmesidir. Ayrı GOAI uygulaması veya dashboard değildir. Uygulama kodu AI-18 fazında açılacaktır.

Planlanan yüzeyler:

- `GOAIButton`, `GOAIPanel`, `GOAIMessage`;
- `GOAIActionCard`, `GOAIApprovalCard`, `GOAIResultCard`;
- `GOAIInsightCard`, `GOAISourceCitation`, `GOAIToolProgress`;
- `GOAICreditEstimate`, `GOAICommandSuggestion`.

Kurallar:

- tenant/rol/izin UI prop'undan yetkilendirilmez;
- ürün yalnız `GOAIProductRegistration` ile araç ve öneri kaydeder;
- R2–R4 eylem etki önizlemesi ve geçerli onay olmadan çalışmaz;
- desktop varsayılanı non-modal sağ panel, mobil varsayılanı tam ekran sheet'tir;
- kaynak, kullanılan araç, bekleme/iptal ve hata durumu görünürdür;
- light/dark, 10 dil, RTL, klavye, ekran okuyucu ve reduced-motion desteklenir.

Kanonik sözleşme: [GOAI ürün ve teknik mimarisi](../../intelligence/goai-engine/product-architecture.md).

