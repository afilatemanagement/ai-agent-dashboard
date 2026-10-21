import { describe, it, expect } from "vitest";
import { micStatusFromError } from "@/lib/use-speech";
describe("mic status", () => {
  it("blocked permission shows blocked", () => { expect(micStatusFromError("NotAllowedError")).toBe("blocked"); expect(micStatusFromError("not-allowed")).toBe("blocked"); });
  it("missing mic shows no-device", () => { expect(micStatusFromError("NotFoundError")).toBe("no-device"); });
  it("other errors are generic", () => { expect(micStatusFromError("network")).toBe("error"); });
});
