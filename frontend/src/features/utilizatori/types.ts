import type { components } from "@/api/generated";

export type Utilizator = components["schemas"]["UserAccount"];
export type UtilizatoriResponse = components["schemas"]["UserListResponse"];
export type UtilizatorWrite = components["schemas"]["UserWrite"];

export type UtilizatorStatusFilter = "all" | "active" | "inactive";
export type UtilizatorRoleFilter = "all" | "staff" | "user";

export type UtilizatorFormValues = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  is_active: boolean;
  is_staff: boolean;
};
