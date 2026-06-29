import { describe, it, expect } from "vitest";
import { fmtMoney } from "./format";

describe("fmtMoney", () => {
  it("formats a valid currency", () => {
    expect(fmtMoney(1000, "USD")).toContain("1,000");
  });

  it("does not throw on an incomplete/invalid currency code", () => {
    expect(() => fmtMoney(1000, "US")).not.toThrow();
    expect(() => fmtMoney(1000, "")).not.toThrow();
    expect(() => fmtMoney(1000, "ZZZ")).not.toThrow();
  });

  it("falls back to number + raw code when currency is invalid", () => {
    expect(fmtMoney(1000, "US")).toBe("1,000 US");
  });

  it("returns em dash for non-finite", () => {
    expect(fmtMoney(NaN)).toBe("—");
  });
});
