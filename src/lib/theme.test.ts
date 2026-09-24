import { describe, expect, it } from "vitest";
import { parseTheme } from "./theme";

describe("theme", () => {
  it("accepts the three choices and falls back to the phone's setting", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("pink")).toBe("system");
  });
});
