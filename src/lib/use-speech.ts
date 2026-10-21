import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Real microphone input via the browser's Web Speech API.
export function useSpeech(onFinal: (text: string) => void) {
  const recRef = useRef<any>(null);
  const cb = useRef(onFinal);
  cb.current = onFinal;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let text = "";
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      setInterim(text);
      if (final && text.trim()) cb.current(text.trim());
    };
    rec.onerror = (e: any) => {
      setError(e.error === "not-allowed" ? "Microphone permission was blocked." : e.error === "no-speech" ? "I didn't hear anything." : "Microphone error: " + e.error);
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* noop */ } };
  }, []);

  const start = () => {
    setError("");
    if (!recRef.current) { setError("Voice input isn't supported in this browser. Try Chrome or Edge."); return; }
    try { recRef.current.start(); setListening(true); } catch { /* already running */ }
  };
  const stop = () => { try { recRef.current?.abort(); } catch { /* noop */ } setListening(false); };
  return { listening, interim, error, supported, start, stop };
}
