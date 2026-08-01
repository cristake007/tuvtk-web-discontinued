import type { components } from "@/api/generated";

export type GrupSumar = components["schemas"]["GroupSummary"];
export type AplicatieAcces = components["schemas"]["ApplicationAccess"];
export type Utilizator = components["schemas"]["UserAccount"];
export type UtilizatoriResponse = components["schemas"]["UserListResponse"];
export type UtilizatorWrite = components["schemas"]["UserWrite"];

export type UtilizatorSelectie = components["schemas"]["UserSelection"];
export type UtilizatoriSelectieResponse = components["schemas"]["UserSelectionListResponse"];

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

export type AplicatieGrup = components["schemas"]["AvailableApplication"];
export type MembruGrup = components["schemas"]["GroupUser"];
export type GrupAplicatii = components["schemas"]["ApplicationGroup"];
export type GrupAplicatiiWrite = components["schemas"]["ApplicationGroupWrite"];
/** UI state requires all selectable collections, unlike the partial API request. */
export type GrupAplicatiiFormValues = {
  name: string;
  application_ids: number[];
  user_ids: number[];
};
