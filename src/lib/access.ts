// Client-safe access rules shared by the server checks and the UI.
export const ROLES = ["Super Admin", "Franchise", "Normal User", "Ayra Agent"] as const;
export type Role = (typeof ROLES)[number];

export const MODULE_PERMS = {
  settings: "Access Settings Module",
  roles: "Manage Roles Module",
  security: "View Security & Audit Logs",
} as const;

export const ROLE_PERMS = [
  MODULE_PERMS.settings,
  MODULE_PERMS.roles,
  MODULE_PERMS.security,
  "Allow System Coding (VS Code)",
  "Allow Web Portal Access",
  "Allow Hardware Control (Brightness/Modules)",
  "Allow Franchise Data Access",
] as const;

export const VOICES = ["Female - Professional", "Female - Friendly", "Male - Jarvis"] as const;

export type CenterConfig = {
  presence: "office" | "away";
  perms: Record<string, Record<string, boolean>>;
  brightness: number;
  voice: string;
  liveReactions: boolean;
  fullAccess: boolean;
  downloadModule: boolean;
  systemUpgrade: boolean;
  hardwareAccess: boolean;
};
export const CENTER_KEY = "command_center";
export const DEFAULTS: CenterConfig = {
  presence: "office",
  perms: {},
  brightness: 100,
  voice: VOICES[0],
  liveReactions: false,
  fullAccess: true,
  downloadModule: false,
  systemUpgrade: false,
  hardwareAccess: true,
};

export function parseConfig(raw: string | null | undefined): CenterConfig {
  try {
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<CenterConfig>) };
  } catch {
    /* defaults */
  }
  return DEFAULTS;
}

/** The saved switch value (Super Admin defaults ON). */
export function permFor(cfg: CenterConfig, role: string, perm: string) {
  return cfg.perms[role]?.[perm] ?? role === "Super Admin";
}

/**
 * Whether a role may actually use a permission right now.
 * Super Admin always can (so nobody gets locked out). Everyone else is blocked
 * while the user is Away or Full Access Mode is off, and otherwise needs the switch ON.
 */
export function isAllowed(cfg: CenterConfig, role: string | null, perm: string) {
  if (!role) return false;
  if (role === "Super Admin") return true;
  if (cfg.presence === "away" || !cfg.fullAccess) return false;
  return permFor(cfg, role, perm);
}
