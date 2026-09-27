# Codex ve Claude ortak çalışma düzeni

İki ajan **aynı dosyaları** okur; birbirlerinin sohbet belleğine otomatik eriştikleri varsayılmaz. Handoff (iş devri) ve kararlar bu depodaki sürümlü kayıtlardan anlaşılır. Böylece geçmiş sohbetin kopyası veya ayrı, çelişen “AI gerçeği” oluşmaz.

| İş | Tek kaynak | Güncelleme zamanı |
|---|---|---|
| Ürün ve yetki kararı | `context/kararlar.md` + ilgili alan `README.md` | Kesin mimari/kapsam değiştiğinde |
| Modül ve ilerleme | `project-tracker.json` | Modül kapsamı veya tarihli kabul kanıtı değiştiğinde |
| Kısa devir | `.ai_memory/session_state.md` | Önemli çalışma sonunda veya engel değiştiğinde |
| Dosya yönlendirmesi | `context/README.md` + `.ai_memory/graph_index.json` | Yeni kritik belge/bağ eklendiğinde |
| Çalışan davranış | Kod, test, migration | Üretim başladığında her uygulama değişiminde |

**Çakışma kuralı:** Aynı klasörde eşzamanlı düzenleme yapılacaksa önce ayrı dal/çalışma alanı veya dosya sahipliği belirlenir. Diğer ajanın yerel değişikliği silinmez; `git diff` incelenir, çatışma açıkça çözülür. Bir ajan diğerinin çalışmasını yalnızca kendi yapay zekâ değerlendirmesiyle “onaylandı” yapamaz.

**İş devri biçimi:** amaç; değişen dosyalar ve commit; yerel/hosted doğrulama; açık hata ve dış bağımlılık; sıradaki tek somut adım. `session_state.md` bunun kısa kaydıdır. Uzun araştırma ilgili `research/` dosyasına, ham kaynak yolu `kaynak-indeksi.md` içine gider.

**Skill (tekrarlanabilir iş akışı) yönlendirmesi:** `.claude/skills/` kanonik kısa talimatlardır; `.agents/skills/` Codex için bu dosyalara işaret eder. `respongo-v3-context` hafıza ve handoff; `architecture` ürün sahipliği; `data-security` veri/yetki; `learning-runtime` SCORM/xAPI; `experience` UI/21st; `release` kabul/yayın. Skill bir “uzman personel” veya otomatik karar/onay yetkisi değildir.
