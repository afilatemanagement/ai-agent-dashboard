import { useEffect, useState } from "react";
import { applyTheme } from "./agent-dress-code";

/** 16 banner palettes (hue/chroma). The whole banner shifts together via CSS variables. */
export const BANNER_PALETTES = [
  { name: "Royal Gold", primary: 80, accent: 95, c: 0.15 },
  { name: "Matrix Green", primary: 150, accent: 165 },
  { name: "Electric Violet", primary: 295, accent: 280 },
  { name: "Deep Cyan", primary: 220, accent: 200 },
  { name: "Magenta Rose", primary: 350, accent: 335 },
  { name: "Sunset Amber", primary: 55, accent: 70 },
  { name: "Ice Blue", primary: 240, accent: 210, c: 0.13 },
  { name: "Lime Pulse", primary: 125, accent: 140 },
  { name: "Crimson", primary: 25, accent: 10, c: 0.19 },
  { name: "Teal Wave", primary: 185, accent: 170 },
  { name: "Orchid", primary: 320, accent: 305 },
  { name: "Cobalt", primary: 260, accent: 245, c: 0.18 },
  { name: "Copper", primary: 45, accent: 60, c: 0.14 },
  { name: "Aqua Mint", primary: 165, accent: 190 },
  { name: "Plasma Pink", primary: 0, accent: 340 },
  { name: "Indigo Night", primary: 275, accent: 230 },
] as const;

export const THEME_INTERVAL_MS = 5 * 60 * 1000;

export function useBannerThemeCycle() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % BANNER_PALETTES.length),
      THEME_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const p = BANNER_PALETTES[index];
    applyTheme(p);
    const c = ("c" in p ? p.c : undefined) ?? 0.17;
    const s = document.documentElement.style;
    s.setProperty("--banner-bg-a", `oklch(0.16 ${c * 0.35} ${p.primary})`);
    s.setProperty("--banner-bg-b", `oklch(0.1 ${c * 0.25} ${p.accent})`);
  }, [index]);
  return BANNER_PALETTES[index];
}
