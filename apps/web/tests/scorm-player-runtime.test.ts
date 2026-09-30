import { describe, expect, it } from "vitest";
import { assertPlayerHost, hashPlayerSecret, normalizeScormPath, playerCookieName, validatePlayerRange } from "../src/lib/scorm-player-runtime";

describe("SCORM player boundary", () => {
  it("normalizes only relative object paths", () => {
    expect(normalizeScormPath(["content", "index.html"])).toBe("content/index.html");
    expect(() => normalizeScormPath(["..", "secret"])).toThrow(/PLAYER_OBJECT_PATH_INVALID/);
    expect(() => normalizeScormPath(["content%2F..%2Fsecret"])).toThrow(/PLAYER_OBJECT_PATH_INVALID/);
    expect(() => normalizeScormPath(["https:%2F%2Fevil.test"])).toThrow(/PLAYER_OBJECT_PATH_INVALID/);
  });

  it("creates a scoped cookie name and one-way secret digest", () => {
    const id = "81000000-0000-4000-8000-000000000001";
    expect(playerCookieName(id)).toBe(`respongo-scorm-${id}`);
    expect(hashPlayerSecret("secret")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts only one valid byte range", () => {
    expect(validatePlayerRange("bytes=0-1023")).toBe("bytes=0-1023");
    expect(validatePlayerRange("bytes=-512")).toBe("bytes=-512");
    expect(() => validatePlayerRange("bytes=0-1,4-5")).toThrow(/PLAYER_RANGE_INVALID/);
  });

  it("accepts only the configured player host", () => {
    const previous = process.env.SCORM_PLAYER_ORIGIN;
    process.env.SCORM_PLAYER_ORIGIN = "https://player.example.test";
    expect(assertPlayerHost(new Request("https://player.example.test/api/v1/player/scorm"))).toBeInstanceOf(URL);
    expect(() => assertPlayerHost(new Request("https://app.example.test/api/v1/player/scorm"))).toThrow(/PLAYER_HOST_FORBIDDEN/);
    if (previous === undefined) delete process.env.SCORM_PLAYER_ORIGIN;
    else process.env.SCORM_PLAYER_ORIGIN = previous;
  });
});
