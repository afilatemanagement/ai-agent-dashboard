import { describe, expect, it } from "vitest";
import { DEFAULTS, isAllowed, MODULE_PERMS } from "@/lib/access";

describe("role access", () => {
  it("Super Admin is always allowed, even when Away", () => {
    expect(isAllowed({ ...DEFAULTS, presence: "away" }, "Super Admin", MODULE_PERMS.settings)).toBe(true);
  });
  it("other roles are denied unless their switch is ON", () => {
    expect(isAllowed(DEFAULTS, "Franchise", MODULE_PERMS.settings)).toBe(false);
    const cfg = { ...DEFAULTS, perms: { Franchise: { [MODULE_PERMS.settings]: true } } };
    expect(isAllowed(cfg, "Franchise", MODULE_PERMS.settings)).toBe(true);
  });
  it("Away blocks other roles even with the switch ON", () => {
    const cfg = { ...DEFAULTS, presence: "away" as const, perms: { Franchise: { [MODULE_PERMS.settings]: true } } };
    expect(isAllowed(cfg, "Franchise", MODULE_PERMS.settings)).toBe(false);
  });
  it("Full Access Mode off blocks other roles", () => {
    const cfg = { ...DEFAULTS, fullAccess: false, perms: { Franchise: { [MODULE_PERMS.settings]: true } } };
    expect(isAllowed(cfg, "Franchise", MODULE_PERMS.settings)).toBe(false);
  });
  it("no role (locked) is denied", () => {
    expect(isAllowed(DEFAULTS, null, MODULE_PERMS.security)).toBe(false);
  });
});
