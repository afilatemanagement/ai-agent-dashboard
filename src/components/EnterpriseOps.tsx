import { AccessGate } from "@/components/AccessGate";
import { MODULE_PERMS } from "@/lib/access";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Download, Plus, X } from "lucide-react";
import { securityStatus } from "@/lib/admin.functions";
import { Switch } from "@/components/ui/switch";

// Demo-only panels (labelled DEMO) except Audit Logs, which reads the real audit log table.
const DemoTag = () => <span className="rounded bg-accent/20 px-1.5 text-[9px] text-accent">DEMO</span>;
const label = "mb-2 flex items-center gap-2 font-display text-[10px] tracking-widest text-accent";
const card = "rounded-md border border-border/60 bg-muted/30 p-3";

const ALERTS = [
  { id: 1, text: "Ayra successfully deployed the server.", tone: "border-success/60 bg-success/15 text-success" },
  { id: 2, text: "Warning: High CPU usage detected on VPS.", tone: "border-danger/60 bg-danger/15 text-danger" },
  { id: 3, text: "New login attempt from unknown IP.", tone: "border-accent/60 bg-accent/15 text-accent" },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
        <Bell className="h-5 w-5 text-primary" />
        {alerts.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />}
      </button>
      {open && (
        <div className="settings-glass anim-fade-up absolute right-0 top-11 z-50 w-72 rounded-lg p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>ALERTS <DemoTag /></span>
            <button onClick={() => setAlerts([])} className="text-xs text-primary hover:underline">Clear All</button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No alerts.</p>
          ) : (
            <div className="grid gap-2">
              {alerts.map((a) => <div key={a.id} className={`rounded-md border px-2.5 py-2 text-xs ${a.tone}`}>{a.text}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TASKS7 = [4, 7, 5, 9, 8, 12, 10];

export function OpsDashboard({ onClose }: { onClose: () => void }) {
  const max = Math.max(...TASKS7);
  const pts = TASKS7.map((v, i) => `${(i / 6) * 280 + 10},${90 - (v / max) * 75}`).join(" ");
  const [flows, setFlows] = useState([
    { id: 1, trigger: "New GitHub Push", action: "Ayra deploys to VPS & Sends Discord Alert", on: true },
    { id: 2, trigger: "User goes 'Away'", action: "Ayra locks the system and enters Restricted Mode", on: true },
  ]);
  const [draft, setDraft] = useState<{ trigger: string; action: string } | null>(null);
  return (
    <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm anim-fade-up" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ayra Operations Dashboard">
      <aside className="settings-glass settings-slide absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-primary glow-text">AYRA OPERATIONS</h2>
          <button onClick={onClose} aria-label="Close dashboard" className="rounded-full border border-border p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <AccessGate perm={MODULE_PERMS.ops}>
        <div className="grid gap-5">
          <div>
            <div className={label}>API USAGE & COST <DemoTag /></div>
            <div className="grid grid-cols-3 gap-2">
              {[["Tokens Today", "48.2K"], ["API Cost", "$1.84"], ["Server Cost", "$12.00"]].map(([k, v]) => (
                <div key={k} className={card}><div className="text-[10px] text-muted-foreground">{k}</div><div className="font-display text-lg text-primary">{v}</div></div>
              ))}
            </div>
          </div>
          <div>
            <div className={label}>TASKS COMPLETED — LAST 7 DAYS <DemoTag /></div>
            <div className={card}>
              <svg viewBox="0 0 300 100" className="h-28 w-full">
                <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
                {TASKS7.map((v, i) => <circle key={i} cx={(i / 6) * 280 + 10} cy={90 - (v / max) * 75} r="3" fill="var(--accent)" />)}
              </svg>
            </div>
          </div>
          <div>
            <div className={label}>SYSTEM HEALTH <DemoTag /></div>
            <div className={`${card} flex items-center gap-4`}>
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--muted)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray="99.9 100" />
              </svg>
              <div><div className="font-display text-xl text-success">99.9%</div><div className="text-xs text-muted-foreground">Uptime</div></div>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className={label}>AYRA AUTOMATIONS <DemoTag /></span>
              <button onClick={() => setDraft({ trigger: "", action: "" })} className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Create Workflow</button>
            </div>
            {draft && (
              <div className={`${card} mb-2 grid gap-2`}>
                <input value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })} placeholder="Trigger (e.g. New order)" className="rounded border border-border bg-background/60 px-2 py-1 text-sm" />
                <input value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} placeholder="Action (e.g. Ayra sends report)" className="rounded border border-border bg-background/60 px-2 py-1 text-sm" />
                <button
                  disabled={!draft.trigger.trim() || !draft.action.trim()}
                  onClick={() => { setFlows((f) => [...f, { id: Date.now(), ...draft, on: true }]); setDraft(null); }}
                  className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >Save Workflow</button>
              </div>
            )}
            <div className="grid gap-2">
              {flows.map((f) => (
                <div key={f.id} className={`${card} flex items-center justify-between gap-3 text-xs`}>
                  <div><span className="text-accent">Trigger:</span> {f.trigger}<br /><span className="text-primary">Action:</span> {f.action}</div>
                  <Switch aria-label={`Enable ${f.trigger}`} checked={f.on} onCheckedChange={(v) => setFlows((all) => all.map((x) => (x.id === f.id ? { ...x, on: v } : x)))} />
                </div>
              ))}
            </div>
          </div>
        </div>
        </AccessGate>
      </aside>
    </div>
  );
}

export function AuditLogs() {
  const fetchStatus = useServerFn(securityStatus);
  const q = useQuery({ queryKey: ["security"], queryFn: () => fetchStatus(), refetchInterval: 15000, retry: false });
  const rows = q.data?.log ?? [];
  const download = () => {
    const csv = [["Timestamp", "User/Agent", "Action", "Status", "IP Address"], ...rows.map((r) => [r.created_at, "Dashboard", `${r.action} ${r.target}`, "Success", "not recorded"])]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={label}>AUDIT LOGS (LIVE)</span>
        <button onClick={download} disabled={!rows.length} className="flex items-center gap-1 rounded-md border border-primary px-2.5 py-1 text-xs text-primary disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Download Logs (.csv)</button>
      </div>
      {q.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No actions recorded yet. Changes to settings and roles appear here.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border/60">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-muted/50 text-muted-foreground"><tr>{["Timestamp", "User/Agent", "Action", "Status", "IP"].map((h) => <th key={h} className="px-2 py-1.5">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="whitespace-nowrap px-2 py-1.5">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-2 py-1.5">Dashboard</td>
                  <td className="px-2 py-1.5">{r.action} {r.target}</td>
                  <td className="px-2 py-1.5 text-success">Success</td>
                  <td className="px-2 py-1.5 text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">IP addresses aren't recorded yet because the dashboard has no login.</p>
    </div>
  );
}
