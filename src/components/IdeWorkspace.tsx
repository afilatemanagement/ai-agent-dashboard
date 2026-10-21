import { useEffect, useState } from "react";
import { Code2, FileCode, FileText, Globe, Terminal } from "lucide-react";
import { ActionWorkspace } from "@/components/ActionWorkspace";
import type { WorkspaceTask } from "@/lib/workspace-events";

export type WorkspaceTab = "browser" | "code" | "terminal";

/** AYRA picks the tab from what her live task is actually producing. */
export function autoTab(task: WorkspaceTask | null): WorkspaceTab {
  if (!task) return "browser";
  if (task.kind === "code" || task.output.includes("```")) return "code";
  if (task.status === "error") return "terminal";
  return "browser";
}

const tabs = [
  ["browser", "Browser Portal", Globe],
  ["code", "Code Editor", Code2],
  ["terminal", "Terminal", Terminal],
] as const;

export function IdeWorkspace({ task, onTask }: { task: WorkspaceTask | null; onTask: (t: WorkspaceTask) => void }) {
  const [manual, setManual] = useState<WorkspaceTab | null>(null);
  useEffect(() => setManual(null), [task?.id]);
  const activeWorkspaceTab = manual ?? autoTab(task);
  const [file, setFile] = useState<"request" | "response">("response");
  const lines = (file === "request" ? task?.title ?? "" : task?.output ?? "").split("\n");
  const typing = task?.status === "running" && file === "response";

  return (
    <div className="ide">
      <nav className="ide-tabs" aria-label="Workspace tabs">
        {tabs.map(([k, label, Icon]) => (
          <button key={k} aria-pressed={activeWorkspaceTab === k} onClick={() => setManual(k)} className="ide-tab">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <span className="ml-auto pr-2 text-[10px] text-muted-foreground">
          {manual ? "Manual" : "AYRA controlled"} · {task?.status ?? "idle"}
        </span>
      </nav>
      <div className="ide-body">
        <aside className="ide-explorer">
          <div className="ide-label">EXPLORER</div>
          {task ? (
            <>
              <button aria-pressed={file === "request"} onClick={() => { setFile("request"); setManual("code"); }}>
                <FileText className="h-3.5 w-3.5" /> request.txt
              </button>
              <button aria-pressed={file === "response"} onClick={() => { setFile("response"); setManual("code"); }}>
                <FileCode className="h-3.5 w-3.5" /> response.md
              </button>
            </>
          ) : (
            <p className="px-2 text-[11px] text-muted-foreground">No files yet</p>
          )}
        </aside>
        <div className="ide-main">
          {activeWorkspaceTab === "browser" && <ActionWorkspace task={task} onTask={onTask} />}
          {activeWorkspaceTab === "code" && (
            <pre className="ide-editor">
              {task ? (
                lines.map((l, i) => (
                  <div key={i}>
                    <span className="ide-ln">{i + 1}</span>
                    {l}
                    {typing && i === lines.length - 1 && <span className="ide-caret" />}
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">No code yet — AYRA writes here when a task produces code.</span>
              )}
            </pre>
          )}
          {activeWorkspaceTab === "terminal" && <TerminalView task={task} big />}
        </div>
      </div>
      {activeWorkspaceTab !== "terminal" && <TerminalView task={task} />}
    </div>
  );
}

function TerminalView({ task, big }: { task: WorkspaceTask | null; big?: boolean }) {
  return (
    <div className={`ide-terminal ${big ? "ide-terminal-big" : ""}`}>
      <div className="ide-label">TERMINAL</div>
      {task ? (
        task.events.map((e, i) => <div key={i}>&gt; {e}</div>)
      ) : (
        <div className="text-muted-foreground">&gt; waiting for AYRA…</div>
      )}
      {task?.status === "running" && <div>&gt; <span className="ide-caret" /></div>}
    </div>
  );
}
