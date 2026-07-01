import { describe, it, expect } from "vitest";
import { verifyLicense } from "./license";

// A real key minted offline for test@example.com via scripts/gen-license.mjs.
const EMAIL = "test@example.com";
const KEY = "RWP1-Mq5X5n0qJphFrzT2p40A739zf_MgBVDqBOrevPnLhw9u1UuBA_VQtdE0BpM9ugpx1GKVmMZ48_DTczj8Qr0ngQ";

describe("verifyLicense", () => {
  it("accepts a valid email+key pair", async () => {
    expect(await verifyLicense(EMAIL, KEY)).toBe(true);
  });

  it("normalizes email casing and whitespace", async () => {
    expect(await verifyLicense("  TEST@Example.COM  ", KEY)).toBe(true);
  });

  it("accepts the key without the RWP1- prefix", async () => {
    expect(await verifyLicense(EMAIL, KEY.replace("RWP1-", ""))).toBe(true);
  });

  it("rejects the key against a different email", async () => {
    expect(await verifyLicense("other@example.com", KEY)).toBe(false);
  });

  it("rejects a tampered / garbage key", async () => {
    expect(await verifyLicense(EMAIL, "RWP1-not-a-real-signature")).toBe(false);
    expect(await verifyLicense(EMAIL, KEY.slice(0, -4) + "AAAA")).toBe(false);
  });

  it("rejects empty input", async () => {
    expect(await verifyLicense("", KEY)).toBe(false);
    expect(await verifyLicense(EMAIL, "")).toBe(false);
  });
});
