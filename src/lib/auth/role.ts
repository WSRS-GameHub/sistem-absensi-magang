export type UserRole = "admin" | "tl" | "peserta" | "manager";

export const INTERNAL_AUTH_DOMAIN = "si-magang.local";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@${INTERNAL_AUTH_DOMAIN}`;
}

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "tl":
      return "/tl/dashboard";
    case "peserta":
      return "/peserta/dashboard";
    case "manager":
      return "/manager/dashboard";
    default:
      return "/login";
  }
}

export function getRolePrefix(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "tl":
      return "/tl";
    case "peserta":
      return "/peserta";
    case "manager":
      return "/manager";
    default:
      return "";
  }
}