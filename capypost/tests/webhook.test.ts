import { describe, expect, test } from "vitest";
import { fromPayment, verifyWebhook } from "../convex/whop";

const SECRET = "whsec_test";

async function sign(id: string, ts: string, body: string, secret = SECRET) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
  return btoa(String.fromCharCode(...mac));
}

const headers = (id: string, ts: string, sig: string) =>
  new Headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": sig });

describe("verifyWebhook", () => {
  const body = JSON.stringify({ type: "payment.succeeded" });
  const now = () => String(Math.floor(Date.now() / 1000));

  test("accepts a fresh v1 signature, even beside other versions", async () => {
    const ts = now();
    const sig = await sign("msg_1", ts, body);
    expect(await verifyWebhook(body, headers("msg_1", ts, `v1,${sig}`), SECRET)).toBe(true);
    expect(await verifyWebhook(body, headers("msg_1", ts, `v0,xyz v1,${sig}`), SECRET)).toBe(true);
  });

  test("refuses a wrong secret, a changed body or missing headers", async () => {
    const ts = now();
    const sig = await sign("msg_1", ts, body, "other");
    expect(await verifyWebhook(body, headers("msg_1", ts, `v1,${sig}`), SECRET)).toBe(false);
    const good = await sign("msg_1", ts, body);
    expect(await verifyWebhook(body + " ", headers("msg_1", ts, `v1,${good}`), SECRET)).toBe(false);
    expect(await verifyWebhook(body, new Headers(), SECRET)).toBe(false);
  });

  test("refuses a timestamp more than five minutes off", async () => {
    const ts = String(Math.floor(Date.now() / 1000) - 301);
    const sig = await sign("msg_1", ts, body);
    expect(await verifyWebhook(body, headers("msg_1", ts, `v1,${sig}`), SECRET)).toBe(false);
  });
});
