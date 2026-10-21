import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const PERMISSIONS = [
  "settings.view",
  "settings.edit",
  "roles.view",
  "roles.edit",
  "security.view",
  "ai.use",
] as const;

export const listSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("app_settings").select("*").order("key");
  if (error) throw new Error(error.message);
  return data;
});

export const saveSetting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ key: z.string().trim().min(1).max(80), value: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await (await db())
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSetting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ key: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("app_settings").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listRoles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await (await db()).from("roles").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data;
});

export const saveRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(60),
        description: z.string().max(300),
        permissions: z.array(z.enum(PERMISSIONS)),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const client = await db();
    const row = {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await client.from("roles").update(row).eq("id", data.id)
      : await client.from("roles").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await (await db()).from("roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const securityStatus = createServerFn({ method: "GET" }).handler(async () => {
  const client = await db();
  const started = Date.now();
  const { data, error } = await client
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return {
    database: error ? `Error: ${error.message}` : `Online (${Date.now() - started} ms)`,
    aiKeyConfigured: Boolean(process.env["LOVABLE_API_KEY"]),
    log: data ?? [],
  };
});
