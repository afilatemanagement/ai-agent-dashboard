import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

/** Slide-in chat with AYRA. Uses the real AI route; conversation lives for this session. */
export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, typing]);

  const send = async () => {
    const command = text.trim();
    if (!command || busy) return;
    const history = msgs.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: command }]);
    setText("");
    setBusy(true);
    setTyping(true);
    try {
      const res = await fetch("/api/ayra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, history }),
      });
      if (!res.ok || !res.body) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(d?.error ?? "AYRA could not reply.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let out = "";
      let first = true;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        if (first) {
          setTyping(false);
          setMsgs((m) => [...m, { role: "assistant", content: out }]);
          first = false;
        } else setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: out }]);
      }
      if (first) setMsgs((m) => [...m, { role: "assistant", content: "(no reply)", error: true }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Connection lost.", error: true }]);
    } finally {
      setBusy(false);
      setTyping(false);
    }
  };

  return (
    <aside className="ayra-chat" data-open={open} aria-hidden={!open} aria-label="Chat with AYRA">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-display text-sm tracking-widest text-primary">AYRA CHAT</div>
          <div className="text-[10px] text-muted-foreground">Live AI · talk normally</div>
        </div>
        <button aria-label="Close chat" onClick={onClose} className="rounded-full border border-border p-1.5 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!msgs.length && <p className="text-center text-xs text-muted-foreground">Start a conversation with AYRA.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === "user" ? "chat-user" : "chat-ayra"} ${m.error ? "text-danger" : ""}`}>
            {m.content}
          </div>
        ))}
        {typing && (
          <div className="chat-bubble chat-ayra chat-typing" aria-label="AYRA is typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={end} />
      </div>
      <form
        className="flex items-end gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Message AYRA…"
          aria-label="Message AYRA"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button aria-label="Send" disabled={busy || !text.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
