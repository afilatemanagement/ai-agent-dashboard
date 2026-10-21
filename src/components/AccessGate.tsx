import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { canUse } from "@/lib/admin.functions";

/** Shows children only when the server confirms the current role has this permission. */
export function AccessGate({ perm, children, compact }: { perm: string; children: ReactNode; compact?: boolean }) {
  const check = useServerFn(canUse);
  const q = useQuery({ queryKey: ["access", "can", perm], queryFn: () => check({ data: { perm } }), retry: false });
  if (q.isLoading) return compact ? null : <p className="text-xs text-muted-foreground">Checking access…</p>;
  if (q.data?.allowed) return <>{children}</>;
  return (
    <div className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-xs text-danger">
      <Lock className="h-3.5 w-3.5 shrink-0" />
      {q.data?.role ? `${q.data.role} doesn't have "${perm}" right now.` : `Locked — unlock a role with "${perm}" in Settings.`}
    </div>
  );
}
