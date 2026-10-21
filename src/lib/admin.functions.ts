import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CENTER_KEY, MODULE_PERMS, ROLES } from "./access";
import { adminDb as db, currentRole, hashPin, requirePerm, requireSuperAdmin, signToken } from "./access.server";

export const PERMISSIONS = [
  "settings.view",
  "settings.edit",
  "roles.view",
  "roles.edit",
  "security.view",
  "ai.use",
] as const;

// ---------- Access (PIN per role) ----------

export const accessStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await (await db()).from("role_pins").select("role");
  return { role: await currentRole(), rolesWithPin: (data ?? []).map((r) => r.role) };
});

export const unlockRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ role: z.enum(ROLES), pin: z.string().min(4).max(32) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await (await db()).from("role_pins").select("pin_hash, salt").eq("role", data.role).maybeSingle();
    if (!row) throw new Error("No PIN has been set for this role yet.");
    const { hash } = await hashPin(data.pin, row.salt);
    if (hash !== row.pin_hash) {
      await new Promise((r) => setTimeout(r, 800));
      throw new Error("Wrong PIN.");
    }
    return { role: data.role, token: await signToken(data.role) };
  });

/** Super Admin sets any role's PIN. The very first Super Admin PIN can be set by anyone (one-time setup). */
export const setRolePin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ role: z.enum(ROLES), pin: z.string().regex(/^\d{4,12}$/, "PIN must be 4–12 digits") }).parse(d))
  .handler(async ({ data }) => {
    const client = await db();
    const { data: sa } = await client.from("role_pins").select("role").eq("role", "Super Admin").maybeSingle();
    const bootstrap = !sa && data.role === "Super Admin";
    if (!bootstrap) await requireSuperAdmin();
    const { hash, salt } = await hashPin(data.pin);
    const { error } = await client.from("role_pins").upsert({ role: data.role, pin_hash: hash, salt, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return bootstrap ? { ok: true, token: await signToken("Super Admin") } : { ok: true, token: null };
  });

// ---------- Command center config (public read, Super Admin write) ----------

export const getCenterConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await (await db()).from("app_settings").select("value").eq("key", CENTER_KEY).maybeSingle();
  return data?.value ?? null;
});

export const saveCenterConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ value: z.string().max(8000) }).parse(d))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { error } = await (await db())
      .from("app_settings")
      .upsert({ key: CENTER_KEY, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Settings module ----------

export const listSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requirePerm(MODULE_PERMS.settings);
  const { data, error } = await (await db()).from("app_settings").select("*").neq("key", CENTER_KEY).order("key");
  if (error) throw new Error(error.message);
  return data;
});

const notCenter = (k: string) => {
  if (k === CENTER_KEY) throw new Error("This setting is managed in the Command Center.");
};

export const saveSetting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ key: z.string().trim().min(1).max(80), value: z.string().max(2000) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requirePerm(MODULE_PERMS.settings);
    notCenter(data.key);
    const { error } = await (await db())
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSetting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ key: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    await requirePerm(MODULE_PERMS.settings);
    notCenter(data.key);
    const { error } = await (await db()).from("app_settings").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Roles module ----------

export const listRoles = createServerFn({ method: "GET" }).handler(async () => {
  await requirePerm(MODULE_PERMS.roles);
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
    await requirePerm(MODULE_PERMS.roles);
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
    await requirePerm(MODULE_PERMS.roles);
    const { error } = await (await db()).from("roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Security module ----------

export const securityStatus = createServerFn({ method: "GET" }).handler(async () => {
  await requirePerm(MODULE_PERMS.security);
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
