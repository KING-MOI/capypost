import { describe, expect, test } from "vitest";
import { dayOf, shiftDay, streakOf, weekdayOf } from "../convex/lib";

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

describe("weekdayOf", () => {
  test("returns 0 for Sunday through 6 for Saturday", () => {
    expect(weekdayOf("2026-11-15")).toBe(0);
    expect(weekdayOf("2026-11-17")).toBe(2);
    expect(weekdayOf("2026-11-21")).toBe(6);
  });
});

describe("dayOf", () => {
  test("formats the calendar day in the user's time zone", () => {
    const at = Date.parse("2026-11-17T06:30:00Z");
    expect(dayOf(at, "UTC")).toBe("2026-11-17");
    expect(dayOf(at, "America/Los_Angeles")).toBe("2026-11-16");
    expect(dayOf(at, "Asia/Tokyo")).toBe("2026-11-17");
  });
});

describe("streakOf", () => {
  const today = "2026-11-17";
  const on = (...back: number[]) => (day: string) => back.some(n => shiftDay(today, -n) === day);

  test("counts consecutive active days back from today", () => {
    expect(streakOf(today, on(0, 1, 2), 0)).toEqual({ streak: 3, frozen: [], freezesLeft: 0 });
  });

  test("an empty today does not break yesterday's streak", () => {
    expect(streakOf(today, on(1, 2), 0).streak).toBe(2);
  });

  test("a freeze bridges one missed day once an earlier active day carries the streak", () => {
    expect(streakOf(today, on(0, 1, 3), 1)).toEqual({ streak: 3, frozen: [shiftDay(today, -2)], freezesLeft: 0 });
  });

  test("an unused freeze stays when the gap is wider than the allowance", () => {
    expect(streakOf(today, on(0, 1, 4), 1)).toEqual({ streak: 2, frozen: [], freezesLeft: 1 });
  });

  test("no activity at all is a zero streak", () => {
    expect(streakOf(today, () => false, 2)).toEqual({ streak: 0, frozen: [], freezesLeft: 2 });
  });
});
