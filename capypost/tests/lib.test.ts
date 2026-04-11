import { describe, expect, test } from "vitest";
import { shiftDay } from "../convex/lib";

describe("shiftDay", () => {
  test("moves across month, year and leap-day boundaries", () => {
    expect(shiftDay("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftDay("2027-02-28", 1)).toBe("2027-03-01");
  });

  test("is stable across a daylight saving change", () => {
    expect(shiftDay("2026-03-08", 1)).toBe("2026-03-09");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
  });

  test("zero is a no-op", () => {
    expect(shiftDay("2026-11-17", 0)).toBe("2026-11-17");
  });
});
