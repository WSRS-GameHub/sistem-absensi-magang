import { redirect } from "next/navigation";

import { getSessionUser } from "./get-session-user";

type AllowedRole =
  | "admin"
  | "tl"
  | "manager"
  | "peserta";

export async function requireRole(
  allowedRoles: AllowedRole[]
) {
  const user = await getSessionUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}