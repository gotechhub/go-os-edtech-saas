import { describe, expect, it } from "vitest";
import { renderScormPlayerShell } from "../src/lib/scorm-player-shell";

describe("SCORM player shell", () => {
  it("exposes both SCORM APIs and restores state without script injection", () => {
    const html = renderScormPlayerShell({
      sessionId: "81000000-0000-4000-8000-000000000001",
      launchPath: "content/index.html",
      standard: "scorm_2004_4th",
      initialState: { "cmi.location": "unit-2", note: "</script><script>bad()</script>" },
      initialSequence: 4,
    });
    expect(html).toContain("window.API=");
    expect(html).toContain("window.API_1484_11=");
    expect(html).toContain("initialSequence\":4");
    expect(html).not.toContain("</script><script>bad()");
    expect(html).toContain("\\u003c/script\\u003e");
  });
});
