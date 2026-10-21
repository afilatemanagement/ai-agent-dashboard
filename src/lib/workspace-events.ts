export type WorkspaceKind =
  "response" | "extraction" | "files" | "calls" | "research" | "code" | "agents" | "network";
export type WorkspaceTask = {
  id: number;
  kind: WorkspaceKind;
  title: string;
  status: "running" | "completed" | "error";
  output: string;
  bytes: number;
  records?: number;
  httpStatus?: number;
  latencyMs?: number;
  events: string[];
};
export type TaskEvent =
  | { type: "headers"; status: number; latencyMs: number }
  | { type: "chunk"; text: string; bytes: number }
  | { type: "complete" }
  | { type: "error"; message: string };
export function applyTaskEvent(task: WorkspaceTask, event: TaskEvent): WorkspaceTask {
  if (task.status !== "running") return task;
  if (event.type === "headers")
    return {
      ...task,
      httpStatus: event.status,
      latencyMs: event.latencyMs,
      events: [...task.events, `HTTP ${event.status} · response headers received`],
    };
  if (event.type === "chunk")
    return { ...task, output: task.output + event.text, bytes: task.bytes + event.bytes };
  if (event.type === "error")
    return {
      ...task,
      status: "error",
      output: event.message,
      events: [...task.events, event.message],
    };
  return { ...task, status: "completed", events: [...task.events, "Response stream ended"] };
}
