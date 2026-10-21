import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Brain, CheckCircle2, FileUp, Globe, Loader2, Mic, Network, Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo-only state: nothing here is connected to a real agent backend. Sections are labelled "DEMO".
type Col = "Pending" | "In Progress" | "Completed" | "Failed";
const COLS: Col[] = ["Pending", "In Progress", "Completed", "Failed"];
const colTone: Record<Col, string> = { Pending: "text-muted-foreground", "In Progress": "text-primary", Completed: "text-success", Failed: "text-destructive" };

const label = "mb-2 flex items-center gap-2 font-display text-[10px] tracking-widest text-accent";
const card = "rounded-md border border-border/60 bg-muted/30 p-3 text-xs";
const primary = "flex w-full items-center justify-center gap-2 rounded-md border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50";
const Demo = () => <span className="rounded bg-accent/20 px-1.5 text-[9px] text-accent">DEMO</span>;

export function AgentBrain() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Deploying Node.js to VPS", col: "In Progress" as Col },
    { id: 2, title: "Searching GitHub for API", col: "Pending" as Col },
    { id: 3, title: "Writing Python script", col: "Completed" as Col },
  ]);
  const [assign, setAssign] = useState(false);
  const [docs, setDocs] = useState([{ name: "company-handbook.pdf", vec: true }]);
  const [memory, setMemory] = useState(true);
  const [url, setUrl] = useState("");
  const [opts, setOpts] = useState({ bypass: false, images: true, text: true });
  const [scraping, setScraping] = useState(false);
  const [scrapeNote, setScrapeNote] = useState("");
  const [provider, setProvider] = useState("ElevenLabs");
  const [wake, setWake] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = (files: FileList | null) => {
    Array.from(files ?? []).forEach((f) => {
      setDocs((d) => [...d, { name: f.name, vec: false }]);
      setTimeout(() => setDocs((d) => d.map((x) => (x.name === f.name ? { ...x, vec: true } : x))), 1500);
    });
  };
  const scrape = () => {
    setScraping(true);
    setScrapeNote("");
    setTimeout(() => { setScraping(false); setScrapeNote("Demo only: no scraper is connected, so nothing was fetched."); }, 2000);
  };
  const move = (id: number) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, col: COLS[(COLS.indexOf(x.col) + 1) % 4] } : x)));

  return (
    <div className="grid gap-5">
      <section>
        <div className={label}><CheckCircle2 className="h-3 w-3" /> AUTONOMOUS TASK BOARD <Demo /></div>
        <div className="grid grid-cols-2 gap-2">
          {COLS.map((c) => (
            <div key={c} className={card}>
              <div className={`mb-2 font-display text-[10px] tracking-widest ${colTone[c]}`}>{c.toUpperCase()}</div>
              <div className="grid gap-1.5">
                {tasks.filter((t) => t.col === c).map((t) => (
                  <button key={t.id} title="Click to move to next column" onClick={() => move(t.id)} className="rounded border border-border/60 bg-background/40 p-2 text-left hover:border-primary">{t.title}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className={`${primary} mt-2`} onClick={() => setAssign(true)}><Plus className="h-4 w-4" /> Assign New Task to Ayra</button>
      </section>

      <section>
        <div className={label}><Brain className="h-3 w-3" /> AYRA'S KNOWLEDGE BASE / MEMORY <Demo /></div>
        <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.csv" className="hidden" onChange={(e) => upload(e.target.files)} />
        <button className={primary} onClick={() => fileRef.current?.click()}><FileUp className="h-4 w-4" /> Upload PDF, TXT, or CSV for Ayra to learn</button>
        <div className="mt-2 grid gap-1.5">
          {docs.map((d) => (
            <div key={d.name} className={`${card} flex items-center justify-between py-2`}>
              <span className="truncate">{d.name}</span>
              {d.vec ? <span className="rounded-full bg-success/15 px-2 text-[10px] text-success">Vectorized</span> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
          ))}
        </div>
        <div className={`${card} mt-2 flex items-center justify-between`}>
          <span>Enable Long-Term Memory</span>
          <Switch aria-label="Long-term memory" checked={memory} onCheckedChange={setMemory} />
        </div>
      </section>

      <section>
        <div className={label}><Globe className="h-3 w-3" /> WEB RESEARCH <Demo /></div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" aria-label="URL to scrape" className="w-full rounded-md border border-border bg-background/40 px-3 py-2 text-xs outline-none focus:border-primary" />
        <div className="mt-2 grid gap-1.5">
          {([["bypass", "Bypass Anti-Bot Protection"], ["images", "Extract Images"], ["text", "Extract Text"]] as const).map(([k, l]) => (
            <div key={k} className={`${card} flex items-center justify-between py-2`}>
              <span>{l}</span>
              <Switch aria-label={l} checked={opts[k]} onCheckedChange={(v) => setOpts((o) => ({ ...o, [k]: v }))} />
            </div>
          ))}
        </div>
        <button className={`${primary} mt-2`} disabled={!url || scraping} onClick={scrape}>
          {scraping ? <><Loader2 className="h-4 w-4 animate-spin" /> Scraping…</> : "Start Scraping"}
        </button>
        {scrapeNote && <p className="mt-1 text-xs text-muted-foreground">{scrapeNote}</p>}
      </section>

      <section>
        <div className={label}><Mic className="h-3 w-3" /> VOICE INTEGRATION <Demo /></div>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger aria-label="Voice provider"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[60]">
            <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
            <SelectItem value="OpenAI TTS">OpenAI TTS</SelectItem>
          </SelectContent>
        </Select>
        <div className={`${card} mt-2 flex items-center justify-between`}>
          <span>Enable Wake Word ("Hey Ayra")</span>
          <Switch aria-label="Wake word" checked={wake} onCheckedChange={setWake} />
        </div>
        <div className={`${card} mt-2 flex h-14 items-end justify-center gap-1`}>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="voice-bar w-1.5 rounded-full bg-primary" style={{ animationDelay: `${i * 0.07}s`, animationPlayState: wake ? "running" : "paused" }} />
          ))}
        </div>
      </section>

      <section>
        <div className={label}><Network className="h-3 w-3" /> MULTI-AGENT SWARM <Demo /></div>
        <div className="grid gap-1.5">
          {["Code-Reviewer Agent", "Web-Searcher Agent", "Database-Agent"].map((a) => (
            <div key={a} className={`${card} flex items-center justify-between py-2`}>
              <span className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 text-primary" /> {a}</span>
              <span className="text-[10px] text-success">● Active</span>
            </div>
          ))}
        </div>
      </section>

      {assign && createPortal(<AssignModal onClose={() => setAssign(false)} onDeploy={(title) => setTasks((t) => [...t, { id: Date.now(), title, col: "Pending" }])} />, document.body)}
    </div>
  );
}

function AssignModal({ onClose, onDeploy }: { onClose: () => void; onDeploy: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-background/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form className="settings-glass w-full max-w-md rounded-lg p-5" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onDeploy(v.trim()); onClose(); } }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm tracking-widest text-primary">What should Ayra do?</h3>
          <button type="button" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <input autoFocus aria-label="Task description" value={v} onChange={(e) => setV(e.target.value)} className="w-full rounded-md border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary" />
        <button type="submit" className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Deploy Task</button>
      </form>
    </div>
  );
}
