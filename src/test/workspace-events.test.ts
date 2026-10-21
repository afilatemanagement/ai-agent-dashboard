import { describe, expect, it } from "vitest";
import { applyTaskEvent, type WorkspaceTask } from "@/lib/workspace-events";
const initial: WorkspaceTask = {
  id: 1,
  kind: "response",
  title: "Actual request",
  status: "running",
  output: "",
  bytes: 0,
  events: [],
};
describe("Truthful workspace events", () => {
  it("does not manufacture progress before a real chunk", () => {
    const task = applyTaskEvent(initial, { type: "headers", status: 200, latencyMs: 123 });
    expect(task.bytes).toBe(0);
    expect(task.output).toBe("");
    expect(task.status).toBe("running");
    expect(task.latencyMs).toBe(123);
  });
  it("counts only received bytes and completes only on stream end", () => {
    const task = applyTaskEvent(initial, { type: "chunk", text: "real output", bytes: 11 });
    expect(task.bytes).toBe(11);
    expect(task.status).toBe("running");
    expect(applyTaskEvent(task, { type: "complete" }).status).toBe("completed");
  });
  it("preserves real failure and does not later mark it completed", () => {
    const failed = applyTaskEvent(initial, { type: "error", message: "Connection lost" });
    expect(applyTaskEvent(failed, { type: "complete" }).status).toBe("error");
    expect(failed.output).toBe("Connection lost");
  });
});
