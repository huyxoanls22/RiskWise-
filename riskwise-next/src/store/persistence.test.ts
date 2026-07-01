import { describe, it, expect } from "vitest";
import { migrate } from "./persistence";

describe("migrate", () => {
  it("wraps a legacy v1 flat `checklist` into a named checklist set", () => {
    const legacy = {
      version: 1,
      checklist: [{ id: "a", text: "Xu hướng đồng thuận", isChecked: false, isRequired: true }],
    };
    const data = migrate(legacy);
    expect(data.checklists).toHaveLength(1);
    expect(data.checklists[0].name).toBe("Mặc định");
    expect(data.checklists[0].items[0].text).toBe("Xu hướng đồng thuận");
    expect(data.activeChecklistId).toBe(data.checklists[0].id);
    expect(data.license.premium).toBe(false);
  });

  it("keeps the new `checklists` shape and a valid active id", () => {
    const data = migrate({
      checklists: [{ id: "x", name: "Scalp", items: [] }],
      activeChecklistId: "x",
      license: { premium: true, key: "RW-1" },
    });
    expect(data.checklists[0].name).toBe("Scalp");
    expect(data.activeChecklistId).toBe("x");
    expect(data.license.premium).toBe(true);
  });

  it("repairs a dangling activeChecklistId to the first set", () => {
    const data = migrate({ checklists: [{ id: "x", name: "A", items: [] }], activeChecklistId: "gone" });
    expect(data.activeChecklistId).toBe("x");
  });

  it("falls back to defaults for empty/garbage input", () => {
    const data = migrate(null);
    expect(data.checklists.length).toBeGreaterThan(0);
    expect(data.activeChecklistId).toBe(data.checklists[0].id);
  });
});
