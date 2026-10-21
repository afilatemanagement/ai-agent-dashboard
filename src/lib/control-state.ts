/** Keys used in the saved settings for presence, access and system control. */
export const CONTROL_KEYS = {
  fullAccess: "control.full_access_mode",
  presence: "control.user_presence",
  brightness: "system.screen_brightness",
  download: "system.download_module",
  upgrade: "system.system_upgrade",
  hardware: "system.hardware_access",
} as const;

export const STANDARD_ROLES = ["Admin", "User", "Franchise", "Ayra-Agent"] as const;

export type SystemControlState = {
  brightness: number;
  downloadModule: boolean;
  systemUpgrade: boolean;
  hardwareAccess: boolean;
};

type Row = { key: string; value: string };

export function readControl(rows: Row[] | undefined) {
  const get = (k: string) => rows?.find((r) => r.key === k)?.value;
  const b = Number(get(CONTROL_KEYS.brightness));
  const isUserPresent = get(CONTROL_KEYS.presence) === "in_office";
  const fullAccess = get(CONTROL_KEYS.fullAccess) === "on";
  const systemControlState: SystemControlState = {
    brightness: Number.isFinite(b) && b >= 20 && b <= 100 ? b : 100,
    downloadModule: get(CONTROL_KEYS.download) === "on",
    systemUpgrade: get(CONTROL_KEYS.upgrade) === "on",
    hardwareAccess: get(CONTROL_KEYS.hardware) === "on",
  };
  return { isUserPresent, fullAccess, systemControlState };
}

/**
 * Permissions that are actually active right now.
 * Away = everything off. In office + Full Access Mode = every permission on.
 */
export function effectivePermissions(
  rolePermissions: readonly string[],
  allPermissions: readonly string[],
  isUserPresent: boolean,
  fullAccess: boolean,
): string[] {
  if (!isUserPresent) return [];
  if (fullAccess) return [...allPermissions];
  return rolePermissions.filter((p) => allPermissions.includes(p));
}

/** AYRA really has hardware access only if the toggle is on AND the owner is in office. */
export function hardwareGranted(isUserPresent: boolean, hardwareAccess: boolean) {
  return isUserPresent && hardwareAccess;
}
