import { describe, expect, it } from "vitest";
import { effectivePermissions, hardwareGranted, readControl } from "@/lib/control-state";

const ALL = ["a", "b", "c"];

describe("presence-based permissions", () => {
  it("Away turns every permission off, even with full access", () => {
    expect(effectivePermissions(["a"], ALL, false, true)).toEqual([]);
  });
  it("In office with full access grants all permissions", () => {
    expect(effectivePermissions([], ALL, true, true)).toEqual(ALL);
  });
  it("In office without full access uses the role's own permissions", () => {
    expect(effectivePermissions(["b"], ALL, true, false)).toEqual(["b"]);
  });
  it("hardware access needs the toggle and the owner present", () => {
    expect(hardwareGranted(false, true)).toBe(false);
    expect(hardwareGranted(true, true)).toBe(true);
  });
  it("brightness defaults to 100 when not saved", () => {
    expect(readControl([]).systemControlState.brightness).toBe(100);
  });
});
