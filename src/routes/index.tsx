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
import { TopBar, AgentStage, BrowserPanel, ActivityPanel } from "@/components/AyraWorld";
import { useQuery } from "@tanstack/react-query";
import { accessStatus } from "@/lib/admin.functions";
import { AyraChat } from "@/components/AyraChat";
import { NotificationBell, OpsDashboard } from "@/components/EnterpriseOps";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { isWorkspaceRunning } from "@/lib/command-center";
import { stateLabel, type CoreState, type AyraLook } from "@/components/JarvisCore";
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
  const [muted, setMuted] = useState(false);
  const roleQ = useQuery({ queryKey: ["access-status"], queryFn: () => accessStatus(), retry: false });
  const role = roleQ.data?.role ?? "Locked";
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
  const run = async (override?: string) => {
    const command = (override ?? cmd).trim();
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
  const statusText =
    core === "idle" ? "Waiting for your command..." : core === "error" ? reply || "Command not recognised" : stateLabel[core];
  const onTools = (k: string) => {
    if (k === "chat") setChatOpen(true);
    else if (k === "ops") setOpsOpen(true);
    else if (k === "lookbook") setLookbook(true);
    else openModule(k === "settings" ? 0 : k === "roles" ? 1 : 2);
  };
  return (
    <div
      className="ayra-world"
      style={{ filter: cfg.brightness < 100 ? `brightness(${0.3 + (cfg.brightness / 100) * 0.7})` : undefined }}
    >
      {cfg.presence === "away" && (
        <div role="alert" className="restricted-banner fixed inset-x-0 top-0 z-40 py-1.5 text-center font-display text-xs tracking-[0.3em]">
          RESTRICTED MODE
        </div>
      )}
      <TopBar
        cmd={cmd}
        setCmd={setCmd}
        onRun={run}
        listening={core === "listening"}
        onMic={() => setCore(core === "listening" ? "idle" : "listening")}
        onTools={onTools}
        onSettings={() => setSettingsOpen(true)}
        role={role}
        inputRef={inputRef}
      />
      <main className="aw-main">
        <AgentStage
          core={core}
          look={lookOverride}
          setLook={setLookOverride}
          reply={reply}
          muted={muted}
          setMuted={setMuted}
          onTalk={() => {
            clear();
            setCore(core === "listening" ? "idle" : "listening");
            inputRef.current?.focus();
          }}
          onEnd={() => {
            clear();
            setReply("");
            setCmd("");
            setCore("idle");
          }}
          onShortcut={(c, url) => {
            if (url) window.open(url, "_blank", "noopener");
            void run(c);
          }}
        />
        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
          <BrowserPanel />
          <ActivityPanel core={core} status={statusText} />
        </div>
      </main>
      <footer className="aw-foot">Powered by Software Vala™</footer>
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
