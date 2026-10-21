import { getRequestHeader } from "@tanstack/react-start/server";
import { CENTER_KEY, isAllowed, parseConfig, ROLES, type Role } from "./access";

const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export const ACCESS_HEADER = "x-ayra-access";
const TTL_MS = 8 * 60 * 60 * 1000;

async function hmacKey() {
  const secret = process.env["ACCESS_TOKEN_SECRET"];
  if (!secret) throw new Error("Access secret is not configured");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function hashPin(pin: string, salt?: string) {
  const s = salt ?? b64(crypto.getRandomValues(new Uint8Array(16)));
  const base = await crypto.subtle.importKey("raw", enc.encode(pin + (process.env["ACCESS_TOKEN_SECRET"] ?? "")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(s), iterations: 100000, hash: "SHA-256" }, base, 256);
  return { hash: b64(bits), salt: s };
}

export async function signToken(role: Role) {
  const body = b64(enc.encode(JSON.stringify({ role, exp: Date.now() + TTL_MS })));
  const sig = b64(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(body)));
  return `${body}.${sig}`;
}

/** Role from the signed access token on this request, or null. */
export async function currentRole(): Promise<Role | null> {
  const token = getRequestHeader(ACCESS_HEADER);
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), unb64(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64(body))) as { role: Role; exp: number };
    return p.exp > Date.now() && ROLES.includes(p.role) ? p.role : null;
  } catch {
    return null;
  }
}

export async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadConfig() {
  const { data } = await (await adminDb()).from("app_settings").select("value").eq("key", CENTER_KEY).maybeSingle();
  return parseConfig(data?.value);
}

/** Throws unless the caller's role is allowed this permission (checked on the server). */
export async function requirePerm(perm: string) {
  const role = await currentRole();
  if (!role) throw new Error("Locked: enter your role PIN to continue.");
  if (!isAllowed(await loadConfig(), role, perm)) throw new Error(`Access denied: ${role} does not have "${perm}" right now.`);
  return role;
}

export async function requireSuperAdmin() {
  const role = await currentRole();
  if (role !== "Super Admin") throw new Error("Access denied: only Super Admin can change this.");
  return role;
}
