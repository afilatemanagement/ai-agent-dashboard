import { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { AYRA_LOOKS, LOOK_THEME, LOOK_NAMES, type AyraLook } from "@/components/JarvisCore";

/** Swatch colour for one look, matching the dashboard theme applied by JarvisCore. */
function swatch(look: AyraLook, kind: "primary" | "accent") {
  const t = LOOK_THEME[look];
  const c = (t.c ?? 0.17) * (kind === "accent" ? 0.85 : 1);
  return `oklch(${kind === "accent" ? 0.82 : 0.72} ${c} ${t[kind]})`;
}

/** Lookbook: every AYRA look with its dress colour; picking one recolours the dashboard. */
export function LookbookPanel({
  current,
  onSelect,
  onClose,
}: {
  current: AyraLook | null;
  onSelect: (look: AyraLook | null) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const looks = Object.keys(AYRA_LOOKS) as AyraLook[];
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm anim-fade-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AYRA lookbook"
    >
      <div
        className="panel holo-scan anim-holo max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Sparkles className="h-7 w-7 shrink-0 text-primary glow-icon" />
          <h2 className="min-w-0 break-words font-display text-xl tracking-widest text-primary glow-text">
            AYRA LOOKBOOK
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto shrink-0 rounded-full border border-border p-2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pick an outfit — the whole dashboard recolours to match her dress. Choose Auto to follow
          her state again.
        </p>
        <div className="mt-4 grid max-h-[62vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5">
          <button
            onClick={() => onSelect(null)}
            aria-pressed={current === null}
            className={`flex flex-col items-center gap-2 rounded-xl border p-2 transition hover:-translate-y-0.5 ${current === null ? "border-primary bg-primary/15" : "border-dashed border-border hover:bg-muted/50"}`}
          >
            <div className="grid aspect-[3/4] w-full place-items-center rounded-lg border border-border/50 bg-muted/30">
              <Sparkles className="h-8 w-8 text-accent glow-icon" />
            </div>
            <div className="text-xs font-semibold">Auto</div>
            <div className="text-[10px] leading-tight text-muted-foreground">
              Follows AYRA's state
            </div>
          </button>
          {looks.map((k) => (
            <button
              key={k}
              onClick={() => onSelect(k)}
              aria-pressed={current === k}
              className={`flex flex-col items-center gap-2 rounded-xl border p-2 transition hover:-translate-y-0.5 ${current === k ? "border-primary bg-primary/15" : "border-border hover:bg-muted/50"}`}
            >
              <img
                src={AYRA_LOOKS[k]}
                alt={`AYRA — ${LOOK_NAMES[k]}`}
                loading="lazy"
                width={768}
                height={1024}
                className="aspect-[3/4] w-full rounded-lg object-cover object-top"
              />
              <div className="flex items-center gap-1" aria-label="Dress colour">
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ background: swatch(k, "primary") }}
                />
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ background: swatch(k, "accent") }}
                />
              </div>
              <div className="text-xs font-semibold leading-tight">{LOOK_NAMES[k]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
