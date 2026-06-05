import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.*s");
type T = ReturnType<typeof convexTest>;

const user = (t: T) => t.run(ctx => ctx.db.insert("users", {
  deviceId: "phone", niche: "test", tz: "UTC", freezesLeft: 0, postingMode: "dryRun", pacePerDay: 12, drainPaused: true, createdAt: 0,
}));

describe("earnings:summary", () => {
  test("a new user has no score and nothing earned", async () => {
    const t = convexTest(schema, modules);
    await user(t);
    const s = await t.query(api.earnings.summary, { deviceId: "phone" });
    expect(s).toMatchObject({ approvedCents: 0, pendingCents: 0, forecastCents: 0, unsubmittedCents: 0, posts: [], perVideo: [] });
    expect(s.taste).toMatchObject({ state: "empty", score: null, needed: 5 });
  });

  test("swipes alone give a calibrating score from pickiness", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t);
    await t.run(async ctx => {
      for (const [i, dir] of (["left", "left", "left", "right"] as const).entries()) {
        const videoId = await ctx.db.insert("videos", { userId, status: dir, rank: i, attempts: 0, createdAt: 0 });
        await ctx.db.insert("swipes", { userId, videoId, dir, dwellMs: 1000, day: "2026-11-17", at: i });
      }
    });
    const { taste } = await t.query(api.earnings.summary, { deviceId: "phone" });
    expect(taste).toMatchObject({ state: "calibrating", seenClips: 4, approvedClips: 1, pickiness: 0.25, score: 63, scored: 0 });
  });
});
