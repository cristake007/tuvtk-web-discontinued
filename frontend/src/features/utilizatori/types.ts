import type { components } from "@/api/generated";

export type GrupSumar = { id: number; name: string };
export type AplicatieAcces = { id: number; key: string; name: string };
export type Utilizator = components["schemas"]["UserAccount"] & {
  groups: GrupSumar[];
  direct_applications: AplicatieAcces[];
  inherited_applications: AplicatieAcces[];
  effective_applications: AplicatieAcces[];
};
export type UtilizatoriResponse = Omit<components["schemas"]["UserListResponse"], "results"> & {
  results: Utilizator[];
};
export type UtilizatorWrite = components["schemas"]["UserWrite"] & {
  group_ids?: number[];
  direct_application_ids?: number[];
};

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
  group_ids: number[];
  direct_application_ids: number[];
};

export type AplicatieGrup = { id: number; key: string; name: string };
export type MembruGrup = { id: number; username: string; full_name: string };
export type GrupAplicatii = {
  id: number;
  name: string;
  applications: AplicatieGrup[];
  users: MembruGrup[];
};
export type GrupAplicatiiWrite = {
  name: string;
  application_ids: number[];
  user_ids: number[];
};
