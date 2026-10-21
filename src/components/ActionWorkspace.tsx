import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bot,
  Code2,
  Database,
  FileText,
  Network,
  Phone,
  Search,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceKind, WorkspaceTask } from "@/lib/workspace-events";

const modes = [
  ["response", "AYRA", Bot],
  ["extraction", "Extraction", Database],
  ["files", "Files", FileText],
  ["calls", "Calls", Phone],
  ["research", "Research", Search],
  ["code", "Code", Code2],
  ["agents", "Workers", Activity],
  ["network", "Network", Network],
] as const;
const missing: Partial<Record<WorkspaceKind, string>> = {
  calls: "Calling service not connected",
  research: "Web research service not connected",
  code: "Code execution environment not connected",
  agents: "Worker execution service not connected",
};
export function ActionWorkspace({
  task,
  onTask,
}: {
  task: WorkspaceTask | null;
  onTask: (task: WorkspaceTask) => void;
}) {
  const [selected, setSelected] = useState<WorkspaceKind | null>(null);
  useEffect(() => { setSelected(null); }, [task?.id]);
  const input = useRef<HTMLInputElement>(null);
  const mode = selected ?? task?.kind ?? "response";
  const relevant =
    task && (mode === task.kind || (mode === "network" && task.kind === "response")) ? task : null;
  const readFile = async (file: File) => {
    setSelected(null);
    const id = Date.now();
    const next: WorkspaceTask = {
      id,
      kind: mode === "extraction" ? "extraction" : "files",
      title: file.name,
      status: "running",
      output: "",
      bytes: 0,
      events: ["Local file selected", "Reading file in this browser"],
    };
    onTask(next);
    try {
      const text = await file.text();
      if (mode === "extraction") {
        const data: unknown = JSON.parse(text);
        const records = Array.isArray(data) ? data : [data];
        onTask({
          ...next,
          status: "completed",
          bytes: file.size,
          records: records.length,
          output: JSON.stringify(records, null, 2),
          events: [...next.events, "JSON parsed", `${records.length} records extracted`],
        });
      } else {
        onTask({
          ...next,
          status: "completed",
          bytes: file.size,
          output: text,
          events: [...next.events, "Local file read completed"],
        });
      }
    } catch (e) {
      onTask({
        ...next,
        status: "error",
        output: e instanceof Error ? e.message : "File read failed",
        events: [...next.events, "File operation failed"],
      });
    }
  };
  const download = () => {
    if (!relevant || relevant.status !== "completed") return;
    const url = URL.createObjectURL(new Blob([relevant.output], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = mode === "extraction" ? "ayra-records.json" : "ayra-output.txt";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="action-workspace" aria-label="AYRA action workspace">
      <header className="workspace-heading">
        <div>
          <div className="font-display text-xs text-accent">ACTION WORKSPACE</div>
          <div className="mt-1 text-xs text-muted-foreground">SOFTWARE VALA / OPERATIONS</div>
        </div>
        <Radio className="h-5 w-5 text-primary" />
      </header>
      <nav aria-label="Workspace views" className="workspace-modes">
        {modes.map(([key, label, Icon]) => (
          <Button
            key={key}
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            aria-pressed={mode === key}
            onClick={() => setSelected(key)}
            className={mode === key ? "bg-primary/20 text-accent" : "text-muted-foreground"}
          >
            <Icon />
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(null)}
          aria-pressed={selected === null}
        >
          Auto
        </Button>
      </nav>
      <div className="workspace-title">
        <h2 className="font-display text-sm">{modes.find(([key]) => key === mode)?.[1]}</h2>
        <span
          className={
            relevant?.status === "error"
              ? "text-danger"
              : relevant?.status === "completed"
                ? "text-success"
                : "text-accent"
          }
        >
          {relevant?.status ?? "Standing by"}
        </span>
      </div>
      {(mode === "files" || mode === "extraction") && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            ref={input}
            hidden
            type="file"
            accept={
              mode === "extraction"
                ? ".json,application/json"
                : "text/*,.json,.csv,.md,.ts,.js,.log"
            }
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="ghost" onClick={() => input.current?.click()}>
            <Upload />
            {mode === "extraction" ? "Extract JSON" : "Open local file"}
          </Button>
          {relevant?.status === "completed" && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Download real output"
              title="Download output"
              onClick={download}
            >
              <Download />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">Local browser only</span>
        </div>
      )}
      {relevant ? (
        <div key={relevant.id} className="workspace-live anim-fade-up">
          <div className="workspace-request">
            <span className="text-xs text-muted-foreground">
              {mode === "network" ? "POST /api/ayra" : "CURRENT TASK"}
            </span>
            <p>{relevant.title}</p>
          </div>
          <dl className="workspace-metrics">
            <div>
              <dt>Received</dt>
              <dd>{relevant.bytes.toLocaleString()} B</dd>
            </div>
            <div>
              <dt>{relevant.records !== undefined ? "Records" : "HTTP status"}</dt>
              <dd>{relevant.records ?? relevant.httpStatus ?? "—"}</dd>
            </div>
            <div>
              <dt>Headers latency</dt>
              <dd>{relevant.latencyMs !== undefined ? `${relevant.latencyMs} ms` : "—"}</dd>
            </div>
          </dl>
          {(relevant.kind === "files" || relevant.kind === "extraction") && (
            <div className="workspace-file-scene" data-status={relevant.status}>
              <FolderVisual />
              <div className="workspace-file-document">
                <FileText className="h-6 w-6 text-accent" />
                <span>{relevant.title}</span>
                <span className="text-xs text-muted-foreground">{relevant.bytes.toLocaleString()} B · {relevant.status}</span>
              </div>
            </div>
          )}
          {(mode === "network" || relevant.kind === "response") && (
            <div className="workspace-request-path" key={`${relevant.id}-${relevant.bytes}`}>
              <span><Network className="h-4 w-4" />Browser</span>
              <span className="workspace-path-line" />
              <span><ServerVisual />AYRA</span>
              <span className="text-xs text-muted-foreground">{relevant.httpStatus ?? "Awaiting headers"}</span>
            </div>
          )}
          <div className="workspace-output">
            <div className="flex items-center gap-2 text-xs text-accent mb-2">
              {relevant.status === "error" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : relevant.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              {relevant.status === "error"
                ? "Actual error · awaiting a new request"
                : relevant.status === "completed"
                  ? "Output received"
                  : "Waiting for response / receiving output"}
            </div>
            <pre>{relevant.output || "No output received yet"}</pre>
          </div>
          <ol className="workspace-events">
            {relevant.events.map((event, i) => (
              <li key={`${i}-${event}`}>{event}</li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="workspace-idle">
          <div className="workspace-reticle">
            <Network className="h-12 w-12 text-primary" />
          </div>
          <h3 className="font-display text-sm text-accent">{missing[mode] ?? "Standing by"}</h3>
          <p className="text-sm text-muted-foreground">
            {missing[mode]
              ? "No operations running"
              : mode === "files"
                ? "No file selected"
                : mode === "extraction"
                  ? "No JSON source selected"
                  : "No active request"}
          </p>
          <div className="workspace-idle-line" />
        </div>
      )}
    </section>
  );
}

function FolderVisual() {
  return <div className="workspace-folder" aria-hidden="true"><div className="workspace-folder-back" /><div className="workspace-folder-front" /></div>;
}
function ServerVisual() {
  return <Bot className="h-4 w-4" />;
}
