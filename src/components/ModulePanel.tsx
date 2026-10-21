import { X, Trash2 } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PERMISSIONS,
  deleteRole,
  deleteSetting,
  listRoles,
  listSettings,
  saveRole,
  saveSetting,
  securityStatus,
} from "@/lib/admin.functions";

const transitions = ["anim-holo", "anim-warp", "anim-slide", "anim-iris"];
export type ModuleId = "settings" | "roles" | "security";

/** Expanding holographic panel for a module; each module shows live records from the database. */
export function ModulePanel({
  index,
  id,
  title,
  Icon,
  onClose,
}: {
  index: number;
  id: ModuleId;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm anim-fade-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        key={title}
        className={`panel holo-scan max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto p-6 ${transitions[index % transitions.length]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Icon className="h-7 w-7 shrink-0 text-primary glow-icon" />
          <h2 className="min-w-0 break-words font-display text-xl tracking-widest text-primary glow-text">
            {title.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto shrink-0 rounded-full border border-border p-2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {id === "settings" && <SettingsModule />}
        {id === "roles" && <RolesModule />}
        {id === "security" && <SecurityModule />}
      </div>
    </div>
  );
}

const field =
  "w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary";
const btn =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";

function State({ loading, error, empty, children }: { loading: boolean; error: unknown; empty: boolean; children: ReactNode }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-danger">{(error as Error).message}</p>;
  if (empty) return <p className="text-sm text-muted-foreground">Nothing saved yet.</p>;
  return <>{children}</>;
}

function SettingsModule() {
  const qc = useQueryClient();
  const list = useServerFn(listSettings);
  const save = useServerFn(saveSetting);
  const del = useServerFn(deleteSetting);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => list() });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["security"] });
  };
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const add = useMutation({
    mutationFn: () => save({ data: { key, value } }),
    onSuccess: () => {
      setKey("");
      setValue("");
      refresh();
    },
  });
  const remove = useMutation({ mutationFn: (k: string) => del({ data: { key: k } }), onSuccess: refresh });
  const ctl = readControl(q.data);
  const set = (k: string, v: string) => save({ data: { key: k, value: v } }).then(refresh);
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-md border border-border/60 p-3">
        <h3 className="font-display text-xs tracking-widest text-accent">ACCESS & PRESENCE</h3>
        <div className="flex flex-wrap gap-2">
          {(["in_office", "away"] as const).map((p) => (
            <button
              key={p}
              onClick={() => set(CONTROL_KEYS.presence, p)}
              className={`rounded-full border px-3 py-1 text-xs ${(p === "in_office") === ctl.isUserPresent && q.data ? "border-primary bg-primary/20 text-primary" : "border-border"}`}
            >
              {p === "in_office" ? "In Office" : "Away"}
            </button>
          ))}
          <Toggle label="Full Access Mode" on={ctl.fullAccess} onChange={(v) => set(CONTROL_KEYS.fullAccess, v ? "on" : "off")} />
        </div>
        <p className={`rounded-md px-3 py-2 text-xs ${ctl.isUserPresent ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
          {ctl.isUserPresent
            ? ctl.fullAccess
              ? "You are in office — Full Permissions are ACTIVE."
              : "You are in office — each role's own permissions are active."
            : "You are away — all permissions are RESTRICTED / OFF."}
        </p>
      </section>
      <section className="grid gap-3 rounded-md border border-border/60 p-3">
        <h3 className="font-display text-xs tracking-widest text-accent">SYSTEM CONTROL</h3>
        <label className="grid gap-1 text-xs">
          Screen Brightness: {ctl.systemControlState.brightness}%
          <input
            type="range"
            min={20}
            max={100}
            defaultValue={ctl.systemControlState.brightness}
            key={ctl.systemControlState.brightness}
            onPointerUp={(e) => set(CONTROL_KEYS.brightness, (e.target as HTMLInputElement).value)}
            onKeyUp={(e) => set(CONTROL_KEYS.brightness, (e.target as HTMLInputElement).value)}
            className="accent-[var(--primary)]"
          />
          <span className="text-muted-foreground">Dims this dashboard. A website cannot change your monitor's brightness.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Download Module" on={ctl.systemControlState.downloadModule} onChange={(v) => set(CONTROL_KEYS.download, v ? "on" : "off")} />
          <Toggle label="System Upgrade" on={ctl.systemControlState.systemUpgrade} onChange={(v) => set(CONTROL_KEYS.upgrade, v ? "on" : "off")} />
          <Toggle label="Hardware Access" on={ctl.systemControlState.hardwareAccess} onChange={(v) => set(CONTROL_KEYS.hardware, v ? "on" : "off")} />
        </div>
        {(() => {
          const ok = hardwareGranted(ctl.isUserPresent, ctl.systemControlState.hardwareAccess);
          return (
            <div className={`font-display text-xs tracking-widest ${ok ? "text-success" : "text-danger"}`}>
              AYRA HAS HARDWARE ACCESS: {ok ? "GRANTED" : "DENIED"}
            </div>
          );
        })()}
        <p className="text-xs text-muted-foreground">These switches are saved permissions. No device is actually controlled from the browser.</p>
      </section>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) add.mutate();
        }}
      >
        <input className={field} placeholder="Setting name" value={key} onChange={(e) => setKey(e.target.value)} />
        <input className={field} placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className={btn} disabled={add.isPending || !key.trim()}>Save</button>
      </form>
      {add.error && <p className="text-sm text-danger">{add.error.message}</p>}
      <State loading={q.isLoading} error={q.error} empty={!q.data?.length}>
        <div className="grid gap-2">
          {q.data?.map((s) => (
            <div key={s.key} className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm">
              <span className="font-semibold">{s.key}</span>
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                defaultValue={s.value}
                onBlur={(e) => e.target.value !== s.value && save({ data: { key: s.key, value: e.target.value } }).then(refresh)}
              />
              <button aria-label={`Delete ${s.key}`} onClick={() => remove.mutate(s.key)}>
                <Trash2 className="h-4 w-4 text-danger" />
              </button>
            </div>
          ))}
        </div>
      </State>
    </div>
  );
}

function RolesModule() {
  const qc = useQueryClient();
  const list = useServerFn(listRoles);
  const save = useServerFn(saveRole);
  const del = useServerFn(deleteRole);
  const q = useQuery({ queryKey: ["roles"], queryFn: () => list() });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["roles"] });
    void qc.invalidateQueries({ queryKey: ["security"] });
  };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const add = useMutation({
    mutationFn: () => save({ data: { name, description, permissions: [] } }),
    onSuccess: () => {
      setName("");
      setDescription("");
      refresh();
    },
  });
  type Perm = (typeof PERMISSIONS)[number];
  const toggle = (r: { id: string; name: string; description: string; permissions: string[] }, p: Perm) => {
    const set = new Set(r.permissions as Perm[]);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    void save({ data: { id: r.id, name: r.name, description: r.description, permissions: [...set] } }).then(refresh);
  };
  const settingsFn = useServerFn(listSettings);
  const sq = useQuery({ queryKey: ["settings"], queryFn: () => settingsFn() });
  const ctl = readControl(sq.data);
  const missingStd = STANDARD_ROLES.filter((n) => !q.data?.some((r) => r.name.toLowerCase() === n.toLowerCase()));
  return (
    <div className="grid gap-4">
      <p className={`rounded-md px-3 py-2 text-xs ${ctl.isUserPresent ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
        {ctl.isUserPresent
          ? `In Office — ${ctl.fullAccess ? "Full Access Mode: every permission active" : "role permissions active"}`
          : "Away — permissions are restricted. Ticked boxes stay saved but are OFF until you are in office."}
      </p>
      {q.data && missingStd.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Add role:</span>
          {missingStd.map((n) => (
            <button
              key={n}
              className="rounded-full border border-border px-3 py-1 hover:bg-primary/20"
              onClick={() => save({ data: { name: n, description: n === "Ayra-Agent" ? "AYRA's own permissions" : `${n} role`, permissions: [] } }).then(refresh)}
            >
              + {n}
            </button>
          ))}
        </div>
      )}
      <form
        className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
      >
        <input className={field} placeholder="Role name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className={btn} disabled={add.isPending || !name.trim()}>Add role</button>
      </form>
      {add.error && <p className="text-sm text-danger">{add.error.message}</p>}
      <State loading={q.isLoading} error={q.error} empty={!q.data?.length}>
        <div className="grid gap-3">
          {q.data?.map((r) => (
            <div key={r.id} className="rounded-md border border-border/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-display text-sm text-primary">{r.name}</span>
                <span className="flex-1 text-xs text-muted-foreground">{r.description}</span>
                <button aria-label={`Delete ${r.name}`} onClick={() => del({ data: { id: r.id } }).then(refresh)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 rounded border border-border/60 px-2 py-1 text-xs">
                    <input type="checkbox" checked={r.permissions.includes(p)} onChange={() => toggle(r, p)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </State>
    </div>
  );
}

function SecurityModule() {
  const status = useServerFn(securityStatus);
  const q = useQuery({ queryKey: ["security"], queryFn: () => status(), refetchInterval: 15000 });
  return (
    <State loading={q.isLoading} error={q.error} empty={false}>
      <div className="grid gap-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">Database</div>
            <div className="font-semibold">{q.data?.database}</div>
          </div>
          <div className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">AI connection</div>
            <div className={`font-semibold ${q.data?.aiKeyConfigured ? "text-success" : "text-danger"}`}>
              {q.data?.aiKeyConfigured ? "Configured" : "Not configured"}
            </div>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-display text-xs tracking-widest text-accent">ACTIVITY LOG</h3>
          {!q.data?.log.length ? (
            <p className="text-muted-foreground">No changes recorded yet.</p>
          ) : (
            q.data.log.map((l) => (
              <div key={l.id} className="flex gap-3 border-t border-border/40 py-1.5 text-xs">
                <span className="w-14 uppercase text-primary">{l.action}</span>
                <span className="flex-1">
                  {l.target}: {l.detail}
                </span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </State>
  );
}
