import { describe, expect, it } from "vitest";
import { listingBadge } from "./seen";

describe("listing badge", () => {
  it("shows Nové first, then whether Adelka opened the listing", () => {
    expect(listingBadge(true, false)).toBe("new");
    expect(listingBadge(true, true)).toBe("new");
    expect(listingBadge(false, true)).toBe("seen");
    expect(listingBadge(false, false)).toBe("unseen");
  });
});
