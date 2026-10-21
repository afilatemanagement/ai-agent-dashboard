import type { WorkspaceTask } from "./workspace-events";

/** Only operation evidence can expand the mission workspace. Avatar/UI state cannot. */
export function isWorkspaceRunning(task: WorkspaceTask | null) {
  return task?.status === "running";
}