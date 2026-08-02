import type { Utilizator } from "./types";

export function canEditUtilizator(user: Utilizator, canManageStaff: boolean): boolean {
  return canManageStaff || !user.is_staff;
}
