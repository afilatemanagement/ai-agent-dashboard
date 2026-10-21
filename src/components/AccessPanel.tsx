import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Lock, LogOut } from "lucide-react";
import { accessStatus, setRolePin, unlockRole } from "@/lib/admin.functions";
import { ROLES } from "@/lib/access";
import { setAccessToken } from "@/lib/access-client";

export function useAccess() {
  const status = useServerFn(accessStatus);
  const q = useQuery({ queryKey: ["access"], queryFn: () => status() });
  return { role: q.data?.role ?? null, rolesWithPin: q.data?.rolesWithPin ?? [], loading: q.isLoading };
}

const field = "min-w-0 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-sm outline-none focus:border-primary";
const btn = "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50";

/** Unlock a role with its PIN. The server signs a token and checks it on every protected action. */
export function AccessPanel() {
  const { role, rolesWithPin, loading } = useAccess();
  const qc = useQueryClient();
  const unlock = useServerFn(unlockRole);
  const setPin = useServerFn(setRolePin);
  const [pick, setPick] = useState<(typeof ROLES)[number]>("Super Admin");
  const [pin, setPinText] = useState("");
  const [pinRole, setPinRole] = useState<(typeof ROLES)[number]>("Franchise");
  const [newPin, setNewPin] = useState("");
  const [msg, setMsg] = useState("");
  const refresh = () => qc.invalidateQueries();
  const needsSetup = !loading && !rolesWithPin.includes("Super Admin");

  const login = useMutation({
    mutationFn: () => unlock({ data: { role: pick, pin } }),
    onSuccess: (r) => { setAccessToken(r.token); setPinText(""); setMsg(""); void refresh(); },
    onError: (e) => setMsg(e.message),
  });
  const savePin = useMutation({
    mutationFn: (v: { role: (typeof ROLES)[number]; pin: string }) => setPin({ data: v }),
    onSuccess: (r) => { if (r.token) setAccessToken(r.token); setNewPin(""); setPinText(""); setMsg("PIN saved."); void refresh(); },
    onError: (e) => setMsg(e.message),
  });

  if (loading) return null;
  return (
    <div className="mb-5 rounded-md border border-primary/40 bg-muted/30 p-3 text-sm">
      {needsSetup ? (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); savePin.mutate({ role: "Super Admin", pin }); }}>
          <div className="flex items-center gap-2 text-xs text-accent"><KeyRound className="h-4 w-4" /> FIRST-TIME SETUP — create the Super Admin PIN</div>
          <div className="flex gap-2">
            <input className={`${field} flex-1`} type="password" inputMode="numeric" placeholder="4–12 digits" aria-label="New Super Admin PIN" value={pin} onChange={(e) => setPinText(e.target.value)} />
            <button className={btn} disabled={pin.length < 4 || savePin.isPending}>Create PIN</button>
          </div>
        </form>
      ) : role ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <span>Unlocked as <b className="text-primary">{role}</b></span>
            <button onClick={() => { setAccessToken(null); void refresh(); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" /> Lock</button>
          </div>
          {role === "Super Admin" && (
            <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); savePin.mutate({ role: pinRole, pin: newPin }); }}>
              <select aria-label="Role for PIN" className={field} value={pinRole} onChange={(e) => setPinRole(e.target.value as typeof pinRole)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}{rolesWithPin.includes(r) ? " ✓" : ""}</option>)}
              </select>
              <input className={`${field} w-28`} type="password" inputMode="numeric" placeholder="New PIN" aria-label="New PIN for role" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
              <button className={btn} disabled={newPin.length < 4 || savePin.isPending}>Set PIN</button>
            </form>
          )}
        </div>
      ) : (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); login.mutate(); }}>
          <div className="flex items-center gap-2 text-xs text-accent"><Lock className="h-4 w-4" /> LOCKED — choose your role and enter its PIN</div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Unlock as role" className={field} value={pick} onChange={(e) => setPick(e.target.value as typeof pick)}>
              {ROLES.filter((r) => rolesWithPin.includes(r)).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input className={`${field} w-28`} type="password" inputMode="numeric" placeholder="PIN" aria-label="PIN" value={pin} onChange={(e) => setPinText(e.target.value)} />
            <button className={btn} disabled={pin.length < 4 || login.isPending}>Unlock</button>
          </div>
        </form>
      )}
      {msg && <p className={`mt-2 text-xs ${msg === "PIN saved." ? "text-success" : "text-danger"}`}>{msg}</p>}
    </div>
  );
}
