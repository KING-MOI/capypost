import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.*s");
const device = (c: string) => c.repeat(43);

beforeEach(() => { vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("no network in tests"); })); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("feed:ensureUser", () => {
  test("refuses a short device id or an unknown time zone", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.feed.ensureUser, { deviceId: "short", tz: "UTC" })).rejects.toThrow("bad device id");
    await expect(t.mutation(api.feed.ensureUser, { deviceId: device("a"), tz: "Mars/Olympus" })).rejects.toThrow("bad time zone");
  });

  test("creates a dryRun user once and follows a time zone change", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(api.feed.ensureUser, { deviceId: device("a"), tz: "UTC" })).toEqual({ mode: "dryRun" });
    await t.mutation(api.feed.ensureUser, { deviceId: device("a"), tz: "Asia/Tokyo" });
    const users = await t.run(ctx => ctx.db.query("users").collect());
    expect(users.map(u => u.tz)).toEqual(["Asia/Tokyo"]);
  });

  test("turns new devices away once MAX_USERS is reached", async () => {
    vi.stubEnv("MAX_USERS", "1");
    const t = convexTest(schema, modules);
    await t.mutation(api.feed.ensureUser, { deviceId: device("a"), tz: "UTC" });
    await expect(t.mutation(api.feed.ensureUser, { deviceId: device("b"), tz: "UTC" })).rejects.toThrow("full right now");
    await expect(t.mutation(api.feed.ensureUser, { deviceId: device("a"), tz: "UTC" })).resolves.toEqual({ mode: "dryRun" });
  });
});
