import { describe, expect, test } from "vitest";
import { nextSlot } from "../convex/pace";
import { DAY_MS } from "../convex/lib";

const MIN = 60 * 1000;
const now = Date.parse("2026-11-17T12:00:00Z");

describe("nextSlot burst", () => {
  test("an empty queue posts now", () => {
    expect(nextSlot([], 12, now)).toBe(now);
  });

  test("two posts can go out together, the third waits for a refill", () => {
    expect(nextSlot([now], 12, now)).toBe(now);
    expect(nextSlot([now, now], 12, now)).toBe(now + 20 * MIN);
  });

  test("never schedules before the last reservation", () => {
    expect(nextSlot([now + 60 * MIN], 12, now)).toBe(now + 60 * MIN);
  });
});

describe("nextSlot daily cap", () => {
  test("a full day pushes the next post past the oldest slot in the window", () => {
    const slots = [now - 60 * MIN];
    expect(nextSlot(slots, 1, now)).toBe(now - 60 * MIN + DAY_MS + 1);
  });

  test("slots older than a day no longer count toward the cap", () => {
    expect(nextSlot([now - DAY_MS - 1], 1, now)).toBe(now);
  });

  test("keeps every result under the cap in any 24 hours", () => {
    const slots: number[] = [];
    for (let i = 0; i < 6; i++) slots.push(nextSlot(slots, 3, now));
    for (const s of slots) expect(slots.filter(x => x > s - DAY_MS && x <= s).length).toBeLessThanOrEqual(3);
  });
});
