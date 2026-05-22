import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.*s");
type T = ReturnType<typeof convexTest>;

beforeEach(() => { vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("no network in tests"); })); });
afterEach(() => { vi.unstubAllGlobals(); });

const user = (t: T) => t.run(ctx => ctx.db.insert("users", {
  deviceId: "phone", niche: "test", tz: "UTC", freezesLeft: 0, postingMode: "dryRun", pacePerDay: 12, drainPaused: true,
  createdAt: 0, scoutAt: Date.now(),
}));

const video = (t: T, userId: Id<"users">, rank: number, extra: Record<string, unknown> = {}) => t.run(async ctx => ctx.db.insert("videos", {
  userId, status: "ready", rank, attempts: 0, createdAt: 0, storageId: await ctx.storage.store(new Blob(["v"])),
  script: { hook: "hook " + rank, lines: [], cta: "", caption: "", title: "", angle: "" }, ...extra,
}));

describe("feed:swipe left", () => {
  test("a reason saves a taste note and queues a remake after the third waiting card", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t);
    const first = await video(t, userId, 1);
    for (const r of [2, 3, 4, 5]) await video(t, userId, r);
    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: first, dir: "left", reason: "hook", dwellMs: 2000 });
    const remake = await t.run(ctx => ctx.db.query("videos").filter(q => q.eq(q.field("parentId"), first)).unique());
    expect(remake).toMatchObject({ status: "queued", remakeReason: "hook", rank: 4.5 });
    const notes = await t.run(ctx => ctx.db.query("tasteNotes").collect());
    expect(notes.map(n => [n.reasonKey, n.text])).toEqual([["hook", "Hook too slow"]]);
  });

  test("an unknown reason becomes a note, trimmed and capped at 280 characters", async () => {
    const t = convexTest(schema, modules);
    const userId = await user(t);
    const v = await video(t, userId, 1);
    await t.mutation(api.feed.swipe, { deviceId: "phone", videoId: v, dir: "left", reason: "custom", note: "  " + "x".repeat(300), dwellMs: 0 });
    const remake = await t.run(ctx => ctx.db.query("videos").filter(q => q.eq(q.field("parentId"), v)).unique());
    expect(remake?.remakeReason).toBe("more");
    expect(remake?.remakeNote).toBe("x".repeat(280));
  });

});
