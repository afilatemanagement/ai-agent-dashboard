import { accessHeaders } from "@/lib/access-client";
import { createFileRoute } from "@tanstack/react-router";
import {
  Menu,
  FolderKanban,
  Users,
  BarChart3,
  Github,
  Server,
  Plug,
  TrendingUp,
  LineChart,
  Lightbulb,
  Zap,
  FileText,
  Target,
  Brain,
  Settings,
  KeyRound,
  ShieldCheck,
  Mic,
  Send,
  CircleDot,
  Sparkles,
  Cog,
  Activity,
  MessageSquare,
} from "lucide-react";
import { CommandSettings, useCenterConfig } from "@/components/CommandSettings";
import { AyraChat } from "@/components/AyraChat";
import { NotificationBell, OpsDashboard } from "@/components/EnterpriseOps";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isWorkspaceRunning } from "@/lib/command-center";
import { JarvisCore, stateLabel, type CoreState, type AyraLook } from "@/components/JarvisCore";
import { ModulePanel, type ModuleId } from "@/components/ModulePanel";
import { LookbookPanel } from "@/components/LookbookPanel";
import { ActionWorkspace } from "@/components/ActionWorkspace";
import { applyTaskEvent, type TaskEvent, type WorkspaceTask } from "@/lib/workspace-events";
const CommandCenterScene = lazy(() => import("@/components/CommandCenterScene"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AYRA Command Center — Software Vala" },
      {
        name: "description",
        content: "AYRA AI command center for Software Vala with settings, roles and security.",
      },
      { property: "og:title", content: "AYRA Command Center — Software Vala" },
      {
        property: "og:description",
        content: "Software Vala’s AYRA dashboard: live AI, settings, roles and security.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const nav = [
  [Settings, "Settings", "settings"],
  [KeyRound, "Roles & Permissions", "roles"],
  [ShieldCheck, "Security", "security"],
] as const;

const inputs = [
  [FolderKanban, "Projects"],
  [Users, "Customers"],
  [BarChart3, "Sales Data"],
  [Github, "GitHub"],
  [Server, "Servers"],
  [Plug, "APIs"],
  [TrendingUp, "Market Trends"],
] as const;
const outputs = [
  [LineChart, "Analysis"],
  [Lightbulb, "Smart Insights"],
  [Zap, "Auto Actions"],
  [FileText, "Reports"],
  [Target, "Predictions"],
  [Brain, "Recommendations"],
  [TrendingUp, "Growth Plan"],
] as const;

function Dashboard() {
  const [core, setCore] = useState<CoreState>("idle");
  const [workspaceTask, setWorkspaceTask] = useState<WorkspaceTask | null>(null);
  const requestCounter = useRef(0);
  const [cmd, setCmd] = useState("");
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [lookOverride, setLookOverride] = useState<AyraLook | null>(null);
  const [lookbook, setLookbook] = useState(false);
  const timers = useRef<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tilt, setTilt] = useState<[number, number]>([0, 0]);
  const [hidden, setHidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { cfg } = useCenterConfig();
  useEffect(() => {
    const v = () => setHidden(document.hidden);
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setMenuOpen((c) => !c);
      }
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("visibilitychange", v);
    window.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("visibilitychange", v);
      window.removeEventListener("keydown", k);
    };
  }, []);
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);
  const run = async () => {
    const command = cmd.trim();
    if (!command) return;
    const requestId = ++requestCounter.current;
    const started = performance.now();
    setWorkspaceTask({
      id: requestId,
      kind: "response",
      title: command,
      status: "running",
      output: "",
      bytes: 0,
      events: ["POST /api/ayra sent"],
    });
    const emit = (event: TaskEvent) =>
      setWorkspaceTask((task) => (task?.id === requestId ? applyTaskEvent(task, event) : task));
    clear();
    setReply("");
    setCore("thinking");
    setCmd("");
    const q = command.toLowerCase();
    const idx = q.includes("role") || q.includes("permission")
      ? 1
      : q.includes("secur")
        ? 2
        : q.includes("setting")
          ? 0
          : -1;
    try {
      const res = await fetch("/api/ayra", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...accessHeaders() },
        body: JSON.stringify({ command }),
      });
      emit({ type: "headers", status: res.status, latencyMs: Math.round(performance.now() - started) });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = data?.error ?? "AYRA could not process that command.";
        setReply(msg);
        emit({ type: "error", message: msg });
        setCore("error");
        timers.current.push(window.setTimeout(() => setCore("idle"), 4000));
        return;
      }
      setCore("executing");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let first = true;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (first) {
          setCore("speaking");
          first = false;
        }
        const delta = decoder.decode(value, { stream: true });
        text += delta;
        emit({ type: "chunk", text: delta, bytes: value.byteLength });
        setReply(text);
      }
      setCore("completed");
      emit({ type: "complete" });
      if (idx >= 0)
        timers.current.push(
          window.setTimeout(() => {
            setActive(idx);
            setOpen(idx);
          }, 1600),
        );
      timers.current.push(window.setTimeout(() => setCore("idle"), 6000));
    } catch {
      emit({ type: "error", message: "Connection to AYRA was lost. Please try again." });
      setReply("Connection to AYRA was lost. Please try again.");
      setCore("error");
      timers.current.push(window.setTimeout(() => setCore("idle"), 4000));
    }
  };
  const openModule = (i: number) => {
    setMenuOpen(false);
    setActive(i);
    setOpen(i);
  };
  return (
    <div
      className={`immersive-dashboard min-h-screen text-foreground ${hidden || open !== null ? "paused" : ""}`}
      style={{ filter: cfg.brightness < 100 ? `brightness(${0.3 + (cfg.brightness / 100) * 0.7})` : undefined }}
    >
      {cfg.presence === "away" && (
        <div role="alert" className="restricted-banner fixed inset-x-0 top-0 z-40 py-1.5 text-center font-display text-xs tracking-[0.3em]">
          RESTRICTED MODE
        </div>
      )}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="command-navigation" aria-describedby={undefined}>
          <SheetTitle className="font-display text-primary">Software Vala</SheetTitle>
          <nav aria-label="Dashboard navigation" className="dashboard-nav mt-5 flex flex-col gap-1">
            {nav.map(([I, label], i) => (
              <Button
                variant="ghost"
                key={label}
                onClick={() => openModule(i)}
                title={label}
                className={`depth-card flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${i === active ? "border-l-2 border-primary bg-primary/20 font-semibold" : "hover:bg-muted"}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-muted/50">
                  <I className="h-4 w-4 text-primary glow-icon" />
                </span>
                {label}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="dashboard-main grid min-w-0 content-start gap-4 px-3 py-3">
        <section
          className="dashboard-hero relative"
          data-task-running={isWorkspaceRunning(workspaceTask)}
          onMouseMove={(e) => {
            const b = e.currentTarget.getBoundingClientRect();
            setTilt([(e.clientX - b.left) / b.width - 0.5, (e.clientY - b.top) / b.height - 0.5]);
          }}
          onMouseLeave={() => setTilt([0, 0])}
        >
          <Suspense fallback={null}>
            <CommandCenterScene tilt={tilt} running={isWorkspaceRunning(workspaceTask)} />
          </Suspense>
          <div className="ayra-ticker" aria-label="Sample activity ticker (demo)">
        <div>
          <span>DEMO · Ayra: Scanning VPS ports...</span><span>Ayra: Fetching GitHub data...</span><span>Ayra: Listening for commands...</span>
        </div>
      </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((c) => !c)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu (Ctrl+B)"
            title="Toggle menu (Ctrl+B)"
            className="absolute left-3 top-3 z-20 rounded p-1 hover:bg-muted"
          >
            <Menu className="h-6 w-6 text-primary" />
          </Button>
          <div className="absolute left-14 top-3 z-20 flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setOpsOpen(true)} aria-label="Open Ayra Operations Dashboard" className="rounded-full">
              <Activity className="h-5 w-5 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setChatOpen(true)} aria-label="Chat with AYRA" className="rounded-full">
              <MessageSquare className="h-5 w-5 text-primary" />
            </Button>
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open Ayra Command Center settings"
              className="rounded-full"
            >
              <Cog className="h-6 w-6 text-primary" />
            </Button>
          </div>
          <div hidden={!isWorkspaceRunning(workspaceTask)} className="preserved-action-workspace">
            <ActionWorkspace task={workspaceTask} onTask={setWorkspaceTask} />
          </div>
          <div className="hero-identity relative min-w-0 text-center md:text-left">
            <button
              onClick={() => setLookbook(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-display text-[10px] tracking-widest text-primary transition hover:bg-primary/20"
            >
              <Sparkles className="h-3 w-3" />
              LOOKBOOK
            </button>
            <div aria-live="polite" className="mt-1 text-xs text-muted-foreground">
              {stateLabel[core]}
            </div>
            {reply && (
              <div className="panel anim-fade-up mx-auto mt-2 max-w-md px-4 py-2 text-left text-sm leading-relaxed text-foreground">
                <span className="mr-1 font-display text-[10px] tracking-widest text-accent">AYRA:</span>
                {reply}
              </div>
            )}
          </div>

          <div className="hero-avatar relative min-w-0">
            <JarvisCore
              state={core}
              tilt={tilt}
              override={lookOverride}
              commandKey={workspaceTask?.id ?? null}
            />
          </div>
        </section>
        <div className="hero-streams office-streams relative grid grid-cols-2 gap-3 p-3">
          {(
            [
              ["DATA INPUTS", inputs],
              ["AI OUTPUTS", outputs],
            ] as const
          ).map(([title, list], k) => (
            <div key={title} className={`flex flex-col gap-2 ${k ? "items-end" : ""}`}>
              <div className="mb-1 flex items-center gap-1 font-display text-xs text-accent">
                <CircleDot className="h-4 w-4" />
                {title}
              </div>
              {list.map(([I, l]) => (
                <div key={l} className="panel flex min-w-0 items-center gap-2 px-2 py-1.5 text-xs">
                  <I className="h-4 w-4 text-primary" />
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="dashboard-command panel mx-auto grid w-full max-w-4xl items-center gap-3 rounded-full px-3 py-2">
          <button
            aria-label="Talk to AYRA"
            onClick={() => {
              clear();
              setCore(core === "listening" ? "idle" : "listening");
              inputRef.current?.focus();
            }}
            className={`grid h-14 w-14 place-items-center rounded-full border-2 border-primary glow-icon ${core === "listening" ? "core-pulse bg-primary/20" : ""}`}
          >
            <Mic className="h-6 w-6 text-primary" />
          </button>
          {core === "listening" && (
            <div className="listen-wave" aria-label="Listening">
              {[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}
            </div>
          )}
          <input
            ref={inputRef}
            title="Focus with Ctrl+K"
            value={cmd}
            onChange={(e) => {
              setCmd(e.target.value);
              if (core === "idle" && e.target.value) setCore("listening");
              if (!e.target.value && core === "listening") setCore("idle");
            }}
            onKeyDown={(e) => e.key === "Enter" && run()}
            aria-label="Command AYRA"
            className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
            placeholder="Hey AYRA, how can I help you today?  (Ctrl+K)"
          />
          {nav.map(([Icon, l], i) => (
            <button key={l} onClick={() => openModule(i)} className="command-shortcut flex flex-col items-center px-2 text-xs">
              <Icon className="h-5 w-5 text-primary" />
              {l.split(" ")[0]}
            </button>
          ))}
          <button
            aria-label="Send command"
            onClick={run}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </main>
      {open !== null && nav[open] && (
        <ModulePanel
          index={open}
          id={nav[open][2] as ModuleId}
          title={nav[open][1]}
          Icon={nav[open][0]}
          onClose={() => setOpen(null)}
        />
      )}
      {settingsOpen && <CommandSettings onClose={() => setSettingsOpen(false)} />}
      {chatOpen && <AyraChat onClose={() => setChatOpen(false)} />}
      {opsOpen && <OpsDashboard onClose={() => setOpsOpen(false)} />}
      {lookbook && (
        <LookbookPanel
          current={lookOverride}
          onSelect={(l) => {
            setLookOverride(l);
            setLookbook(false);
          }}
          onClose={() => setLookbook(false)}
        />
      )}
    </div>
  );
}
