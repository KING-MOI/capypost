import { describe, expect, test } from "vitest";
import type { Doc } from "../convex/_generated/dataModel";
import { rewardLabel } from "../convex/bounties";
import { starsFor } from "../convex/raids";

const bounty = (b: Partial<Doc<"bounties">>) => b as Doc<"bounties">;

describe("rewardLabel", () => {
  test("per-view bounties show the rate per 1K, dropping whole-dollar cents", () => {
    expect(rewardLabel(bounty({ rewardKind: "per_view", ratePer1kCents: 200 }))).toBe("$2 / 1K views");
    expect(rewardLabel(bounty({ rewardKind: "per_view", ratePer1kCents: 150 }))).toBe("$1.50 / 1K views");
  });

  test("per-post bounties show the flat reward", () => {
    expect(rewardLabel(bounty({ rewardKind: "per_submission", rewardCents: 2500 }))).toBe("$25 per approved post");
  });

  test("a missing amount falls back to words", () => {
    expect(rewardLabel(bounty({ rewardKind: "per_view" }))).toBe("Paid per 1K views");
    expect(rewardLabel(bounty({ rewardKind: "per_submission" }))).toBe("Paid per approved post");
  });
});

describe("starsFor", () => {
  test("each star lights on its own", () => {
    expect(starsFor(0, 0, 900)).toEqual([false, false, false]);
    expect(starsFor(450, 0, 900)).toEqual([true, false, false]);
    expect(starsFor(0, 1, 900)).toEqual([false, true, false]);
    expect(starsFor(900, 1, 900)).toEqual([true, true, true]);
  });
});
