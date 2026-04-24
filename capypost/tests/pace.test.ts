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
