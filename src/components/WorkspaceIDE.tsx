import { useEffect, useState } from "react";
import { FileCode2, Folder, Globe, SquareTerminal } from "lucide-react";

// DEMO: mock IDE view. Ayra "types" sample code / opens a portal; nothing is executed.
const SAMPLE = `export async function deploy() {\n  const build = await runBuild();\n  await uploadToServer(build);\n  return "Deployed ✓";\n}`;
const FILES = ["src/", "  deploy.ts", "  server.ts", "package.json", "README.md"];
export type WorkspaceTab = "browser" | "code" | "terminal";

export function pickTab(task: string): WorkspaceTab {
  const t = task.toLowerCase();
  if (/(portal|website|browser|open|site)/.test(t)) return "browser";
  if (/(terminal|run|shell|command|deploy)/.test(t)) return "terminal";
  return "code";
}

export function WorkspaceIDE({ task }: { task: string }) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>(() => pickTab(task));
  const [typed, setTyped] = useState(0);
  useEffect(() => setActiveWorkspaceTab(pickTab(task)), [task]);
  useEffect(() => {
    setTyped(0);
    const id = window.setInterval(() => setTyped((n) => (n >= SAMPLE.length ? n : n + 2)), 40);
    return () => clearInterval(id);
  }, [task, activeWorkspaceTab]);
  const tabs = [["browser", "Browser Portal", Globe], ["code", "Code Editor", FileCode2], ["terminal", "Terminal", SquareTerminal]] as const;
  return (
    <div className="mb-3 overflow-hidden rounded-md border border-border/60 bg-background/70 text-xs">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/40 px-2 py-1">
        {tabs.map(([k, l, I]) => (
          <button key={k} onClick={() => setActiveWorkspaceTab(k)} aria-pressed={activeWorkspaceTab === k} className={`flex items-center gap-1 rounded px-2 py-1 ${activeWorkspaceTab === k ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
            <I className="h-3.5 w-3.5" /> {l}
          </button>
        ))}
        <span className="ml-auto rounded bg-accent/20 px-1.5 text-[9px] text-accent">DEMO</span>
      </div>
      {activeWorkspaceTab === "browser" ? (
        <div className="p-3">
          <div className="mb-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">https://portal.example.com</div>
          <p className="text-accent">Ayra is opening a web portal…</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (typed / SAMPLE.length) * 100)}%` }} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-[110px_1fr]">
          <div className="border-r border-border/60 p-2 font-mono text-muted-foreground">
            <div className="mb-1 flex items-center gap-1 text-accent"><Folder className="h-3.5 w-3.5" /> EXPLORER</div>
            {FILES.map((f) => <div key={f} className={f.trim() === "deploy.ts" ? "text-primary" : ""}>{f}</div>)}
          </div>
          <div className="flex min-h-40 flex-col">
            <pre className="flex-1 p-2 font-mono text-foreground">{activeWorkspaceTab === "code" ? SAMPLE.slice(0, typed) : ""}{activeWorkspaceTab === "code" && <span className="animate-pulse text-primary">▌</span>}</pre>
            <pre className="border-t border-border/60 bg-muted/40 p-2 font-mono text-success">$ {activeWorkspaceTab === "terminal" ? `bun run deploy\n${typed >= SAMPLE.length ? "Deployed ✓ (demo)" : "running…"}` : "ready"}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
