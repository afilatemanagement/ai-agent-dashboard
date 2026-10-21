import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, RefreshCw, ShieldCheck, X } from "lucide-react";
import { listSettings, saveSetting } from "@/lib/admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ROLES = ["Super Admin", "Franchise", "Normal User", "Ayra Agent"] as const;
export const ROLE_PERMS = [
  "Allow System Coding (VS Code)",
  "Allow Web Portal Access",
  "Allow Hardware Control (Brightness/Modules)",
  "Allow Franchise Data Access",
] as const;
export const VOICES = ["Female - Professional", "Female - Friendly", "Male - Jarvis"] as const;

export type CenterConfig = {
  presence: "office" | "away";
  perms: Record<string, Record<string, boolean>>;
  brightness: number;
  voice: string;
  liveReactions: boolean;
};
const KEY = "command_center";
const DEFAULTS: CenterConfig = { presence: "office", perms: {}, brightness: 100, voice: VOICES[0], liveReactions: false };

/** Super Admin gets every permission unless explicitly saved otherwise. */
export function permFor(cfg: CenterConfig, role: string, perm: string) {
  return cfg.perms[role]?.[perm] ?? role === "Super Admin";
}

/** Command center config, saved for real in the app settings table. */
export function useCenterConfig() {
  const list = useServerFn(listSettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => list() });
  const raw = q.data?.find((s) => s.key === KEY)?.value;
  let cfg = DEFAULTS;
  try {
    if (raw) cfg = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<CenterConfig>) };
  } catch {
    /* keep defaults */
  }
  return { cfg, loading: q.isLoading };
}

export function CommandSettings({ onClose }: { onClose: () => void }) {
  const { cfg, loading } = useCenterConfig();
  const qc = useQueryClient();
  const save = useServerFn(saveSetting);
  const [role, setRole] = useState<string>(ROLES[0]);
  const [brightness, setBrightness] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const m = useMutation({
    mutationFn: (next: CenterConfig) => save({ data: { key: KEY, value: JSON.stringify(next) } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["security"] });
    },
  });
  const update = (patch: Partial<CenterConfig>) => m.mutate({ ...cfg, ...patch });
  const row = "flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 text-sm";
  const label = "mb-2 font-display text-[10px] tracking-widest text-accent";

  return (
    <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm anim-fade-up" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ayra Command Center">
      <aside className="settings-glass settings-slide absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-primary glow-text">AYRA COMMAND CENTER</h2>
          <button onClick={onClose} aria-label="Close settings" className="rounded-full border border-border p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="roles">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles" className="text-xs">Roles & Permissions</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System Control</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">AI Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-5 grid gap-5">
              <div>
                <div className={label}>USER PRESENCE</div>
                <div className={row}>
                  <span>{cfg.presence === "office" ? "In Office" : "Away"}</span>
                  <Switch aria-label="In office" checked={cfg.presence === "office"} onCheckedChange={(v) => update({ presence: v ? "office" : "away" })} />
                </div>
              </div>
              <div>
                <div className={label}>ROLE MANAGEMENT</div>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger aria-label="Role"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[60]">
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="mt-3 grid gap-2">
                  {ROLE_PERMS.map((p) => (
                    <div key={p} className={row}>
                      <span>{p}</span>
                      <Switch
                        aria-label={p}
                        checked={permFor(cfg, role, p)}
                        onCheckedChange={(v) => update({ perms: { ...cfg.perms, [role]: { ...cfg.perms[role], [p]: v } } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="mt-5 grid gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-success/60 bg-success/15 px-3 py-1 font-display text-[10px] tracking-widest text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> HARDWARE ACCESS: GRANTED
              </div>
              <div>
                <div className={label}>SYSTEM BRIGHTNESS — {brightness ?? cfg.brightness}%</div>
                <Slider
                  aria-label="System brightness"
                  min={0}
                  max={100}
                  step={1}
                  value={[brightness ?? cfg.brightness]}
                  onValueChange={([v]) => setBrightness(v)}
                  onValueCommit={([v]) => {
                    update({ brightness: v });
                    setBrightness(null);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setNote("No module source is connected yet, so there is nothing to download.")} className="flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                  <Download className="h-4 w-4" /> Download New Module
                </button>
                <button onClick={() => setNote("No upgrade server is connected yet, so the system is already on its latest version.")} className="flex items-center justify-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary">
                  <RefreshCw className="h-4 w-4" /> System Upgrade
                </button>
              </div>
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </TabsContent>

            <TabsContent value="ai" className="mt-5 grid gap-5">
              <div>
                <div className={label}>AYRA VOICE</div>
                <Select value={cfg.voice} onValueChange={(v) => update({ voice: v })}>
                  <SelectTrigger aria-label="Ayra voice"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[60]">
                    {VOICES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className={row}>
                <span>Human Live Reactions</span>
                <Switch aria-label="Human live reactions" checked={cfg.liveReactions} onCheckedChange={(v) => update({ liveReactions: v })} />
              </div>
            </TabsContent>
          </Tabs>
        )}
        {m.error && <p className="mt-3 text-sm text-danger">{m.error.message}</p>}
      </aside>
    </div>
  );
}
