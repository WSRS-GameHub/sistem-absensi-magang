import { requireRole } from "./require-role";

export async function getTLScope() {
  const user = await requireRole(["tl"]);

  if (!user.division) {
    throw new Error("TL tidak memiliki division");
  }

  return {
    user,
    division: user.division,
  };
}