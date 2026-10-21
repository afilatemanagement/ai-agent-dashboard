import { useEffect, useRef, useState } from "react";
import { Box, Clock, FileText, Plus, Rocket, Shield, Terminal, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Demo-only state: no real server is connected. Everything here is labelled "DEMO".
type Proc = { pid: number; name: string; cpu: number; mem: number };
type Cron = { id: number; name: string; when: string; active: boolean };
type Ctr = { name: string; image: string; running: boolean };

const label = "mb-2 flex items-center gap-2 font-display text-[10px] tracking-widest text-accent";
const card = "rounded-md border border-border/60 bg-muted/30 p-3 text-xs";
const btn = "rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted";
const primary = "flex items-center justify-center gap-2 rounded-md border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10";

const DemoTag = () => <span className="rounded bg-warning/20 px-1.5 text-[9px] text-warning">DEMO</span>;

export function ServerOps() {
  const [procs, setProcs] = useState<Proc[]>([
    { pid: 1024, name: "nginx", cpu: 2.1, mem: 48 },
    { pid: 2210, name: "node", cpu: 14.6, mem: 312 },
    { pid: 3307, name: "python", cpu: 7.9, mem: 186 },
  ]);
  const [crons, setCrons] = useState<Cron[]>([
    { id: 1, name: "Database Backup", when: "Daily at 02:00 AM", active: true },
    { id: 2, name: "Log Rotation", when: "Weekly, Sun 03:00 AM", active: true },
    { id: 3, name: "Cache Cleanup", when: "Every 6 hours", active: false },
  ]);
  const [ctrs, setCtrs] = useState<Ctr[]>([
    { name: "ayra-api", image: "node:20-alpine", running: true },
    { name: "ayra-db", image: "postgres:16", running: true },
    { name: "ayra-worker", image: "python:3.12", running: false },
  ]);
  const [monitor, setMonitor] = useState(true);
  const [term, setTerm] = useState<null | "shell" | "logs">(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const t = setInterval(() => setProcs((p) => p.map((x) => ({ ...x, cpu: Math.max(0.1, +(x.cpu + (Math.random() - 0.5) * 3).toFixed(1)) }))), 3000);
    return () => clearInterval(t);
  }, []);

  const addCron = () => {
    const name = window.prompt("Task name?");
    if (!name) return;
    const when = window.prompt("Schedule (e.g. Daily at 02:00 AM)?") || "Daily at 00:00";
    setCrons((c) => [...c, { id: Date.now(), name, when, active: true }]);
  };
  const deploy = () => {
    const image = window.prompt("Image (e.g. redis:7)?");
    if (!image) return;
    setCtrs((c) => [...c, { name: `ayra-${image.split(":")[0]}`, image, running: true }]);
  };

  return (
    <div className="grid gap-5">
      <section>
        <div className={label}>ACTIVE PROCESSES & SYSTEM HEALTH <DemoTag /></div>
        <div className={card}>
          <table className="w-full">
            <thead className="text-[10px] text-muted-foreground">
              <tr><th className="text-left">PID</th><th className="text-left">Name</th><th>CPU %</th><th>MEM MB</th><th /></tr>
            </thead>
            <tbody className="font-mono">
              {procs.map((p) => (
                <tr key={p.pid} className="border-t border-border/40">
                  <td className="py-1.5">{p.pid}</td><td>{p.name}</td>
                  <td className="text-center">{p.cpu}</td><td className="text-center">{p.mem}</td>
                  <td className="text-right">
                    <button className={`${btn} border-destructive/60 text-destructive`} onClick={() => setProcs((x) => x.filter((y) => y.pid !== p.pid))}>Kill</button>
                  </td>
                </tr>
              ))}
              {!procs.length && <tr><td colSpan={5} className="py-2 text-muted-foreground">No processes.</td></tr>}
            </tbody>
          </table>
        </div>
        <button className={`${primary} mt-2 w-full`} onClick={() => setTerm("shell")}><Terminal className="h-4 w-4" /> Open Full Linux Terminal</button>
      </section>

      <section>
        <div className={label}><Clock className="h-3 w-3" /> TASK SCHEDULER (CRON JOBS) <DemoTag /></div>
        <div className="grid gap-2">
          {crons.map((c) => (
            <div key={c.id} className={`${card} flex items-center justify-between`}>
              <div><div className="font-semibold">{c.name}</div><div className="text-muted-foreground">{c.when} · {c.active ? "Active" : "Paused"}</div></div>
              <Switch aria-label={`Toggle ${c.name}`} checked={c.active} onCheckedChange={(v) => setCrons((x) => x.map((y) => (y.id === c.id ? { ...y, active: v } : y)))} />
            </div>
          ))}
        </div>
        <button className={`${primary} mt-2 w-full`} onClick={addCron}><Plus className="h-4 w-4" /> Add New Cron Job</button>
      </section>

      <section>
        <div className={label}><Shield className="h-3 w-3" /> NETWORK SECURITY <DemoTag /></div>
        <div className={card}>
          <div className="mb-2 font-semibold text-success">Status: Firewall Active (UFW)</div>
          {["22 (SSH)", "80 (HTTP)", "443 (HTTPS)"].map((p) => (
            <div key={p} className="flex justify-between border-t border-border/40 py-1 font-mono"><span>Port {p}</span><span className="text-success">Allowed</span></div>
          ))}
        </div>
        <button className={`${primary} mt-2 w-full`} onClick={() => setNote("Demo only: no real server is connected, so firewall rules can't be changed yet.")}>Configure Firewall</button>
      </section>

      <section>
        <div className={label}><Box className="h-3 w-3" /> DOCKER CONTAINERS <DemoTag /></div>
        <div className="grid gap-2">
          {ctrs.map((c) => (
            <div key={c.name} className={card}>
              <div className="flex items-center justify-between">
                <div><div className="font-semibold">{c.name}</div><div className="font-mono text-muted-foreground">{c.image}</div></div>
                <span className={c.running ? "text-success" : "text-destructive"}>● {c.running ? "Running" : "Stopped"}</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                {(["Start", "Stop", "Restart"] as const).map((a) => (
                  <button key={a} className={btn} onClick={() => setCtrs((x) => x.map((y) => (y.name === c.name ? { ...y, running: a !== "Stop" } : y)))}>{a}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className={`${primary} mt-2 w-full`} onClick={deploy}><Rocket className="h-4 w-4" /> Deploy New Container</button>
      </section>

      <section>
        <div className={label}><FileText className="h-3 w-3" /> SYSTEM LOGS & MONITORING <DemoTag /></div>
        <button className={`${primary} w-full`} onClick={() => setTerm("logs")}>View System Logs (/var/log/syslog)</button>
        <div className={`${card} mt-2 flex items-center justify-between`}>
          <span>Auto-Monitor System Alerts (CPU/RAM &gt; 90%)</span>
          <Switch aria-label="Auto-monitor alerts" checked={monitor} onCheckedChange={setMonitor} />
        </div>
      </section>

      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {term && <TerminalModal mode={term} procs={procs} onClose={() => setTerm(null)} />}
    </div>
  );
}

function TerminalModal({ mode, procs, onClose }: { mode: "shell" | "logs"; procs: Proc[]; onClose: () => void }) {
  const now = () => new Date().toTimeString().slice(0, 8);
  const [lines, setLines] = useState<string[]>(
    mode === "logs"
      ? [`${now()} ayra systemd[1]: Started nginx.service`, `${now()} ayra kernel: eth0 link up`, `${now()} ayra CRON[812]: (root) CMD (backup.sh)`, "-- demo log, no real server connected --"]
      : ["Ayra demo shell — no real server connected. Type 'help'."],
  );
  const [cmd, setCmd] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView(), [lines]);

  const run = (c: string) => {
    const out: Record<string, string> = {
      help: "commands: help, whoami, uptime, ps, ls, clear",
      whoami: "ayra",
      uptime: "up 3 days, 4:12 (demo)",
      ls: "bin  etc  home  var  ayra",
      ps: procs.map((p) => `${p.pid}  ${p.name}`).join("\n"),
    };
    if (c === "clear") return setLines([]);
    setLines((l) => [...l, `ayra@server:~$ ${c}`, ...(out[c] ?? `${c}: command not found`).split("\n")]);
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/70 p-4" onClick={onClose}>
      <div className="terminal-screen w-full max-w-2xl rounded-lg border border-success/40 font-mono text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-success/30 px-3 py-2">
          <span>{mode === "logs" ? "/var/log/syslog" : "ayra@server: ~"}</span>
          <button aria-label="Close terminal" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="h-80 overflow-y-auto whitespace-pre-wrap p-3">
          {lines.map((l, i) => <div key={i}>{l}</div>)}
          {mode === "shell" && (
            <form onSubmit={(e) => { e.preventDefault(); if (cmd.trim()) run(cmd.trim()); setCmd(""); }} className="flex">
              <span>ayra@server:~$&nbsp;</span>
              <input autoFocus aria-label="Terminal command" value={cmd} onChange={(e) => setCmd(e.target.value)} className="flex-1 bg-transparent outline-none" />
            </form>
          )}
          <div ref={end} />
        </div>
      </div>
    </div>
  );
}
