import { AccessGate } from "@/components/AccessGate";
import { MODULE_PERMS } from "@/lib/access";
import { accessHeaders } from "@/lib/access-client";
import { useEffect, useRef, useState } from "react";
import { Mic, Send, X } from "lucide-react";

type Msg = { role: "user" | "ayra"; text: string };

/** Real chat with AYRA through the live AI endpoint (streams replies). */
export function AyraChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages, typing]);

  const send = async () => {
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");
    const prev = messages.slice(-2).map((m) => `${m.role === "user" ? "User" : "AYRA"}: ${m.text}`).join("\n");
    const command = (prev ? `Earlier:\n${prev.slice(-280)}\nNow: ` : "") + text;
    setMessages((m) => [...m, { role: "user", text }]);
    setTyping(true);
    const t0 = Date.now();
    try {
      const res = await fetch("/api/ayra", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...accessHeaders() },
        body: JSON.stringify({ command: command.slice(-500) }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let out = "";
      let started = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        if (!started) {
          started = true;
          const wait = 1500 - (Date.now() - t0);
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
          setTyping(false);
          setMessages((m) => [...m, { role: "ayra", text: out }]);
        } else setMessages((m) => [...m.slice(0, -1), { role: "ayra", text: out }]);
      }
      if (!started) setMessages((m) => [...m, { role: "ayra", text: "…" }]);
    } catch {
      setMessages((m) => [...m, { role: "ayra", text: "Connection to AYRA was lost. Please try again." }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm anim-fade-up" onClick={onClose} role="dialog" aria-modal="true" aria-label="Chat with AYRA">
      <aside className="settings-glass settings-slide absolute right-0 top-0 flex h-full w-full max-w-md flex-col p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-widest text-primary glow-text">TALK TO AYRA</h2>
          <button onClick={onClose} aria-label="Close chat" className="rounded-full border border-border p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <AccessGate perm={MODULE_PERMS.chat}>
        <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">Say hello to AYRA — ask anything.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-primary/40 bg-muted/50 text-foreground"}`}>
                {m.role === "ayra" && <div className="mb-0.5 font-display text-[9px] tracking-widest text-accent">AYRA</div>}
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm border border-primary/40 bg-muted/50 px-4 py-3" aria-label="AYRA is typing">
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5">
          <button onClick={() => setListening((l) => !l)} aria-label={listening ? "Stop listening" : "Start listening"} aria-pressed={listening} className={`grid h-8 w-8 place-items-center rounded-full border border-primary/50 ${listening ? "bg-primary/20" : ""}`}><Mic className="h-4 w-4 text-primary" /></button>
          {listening && <div className="listen-wave" aria-label="Listening">{[0, 1, 2, 3, 4].map((i) => <span key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}</div>}
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} aria-label="Message AYRA" placeholder="Message AYRA…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button onClick={() => void send()} aria-label="Send message" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
        </div>
        </div>
        </AccessGate>
      </aside>
    </div>
  );
}
