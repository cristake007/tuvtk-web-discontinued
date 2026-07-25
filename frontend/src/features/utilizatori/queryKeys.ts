import type { UtilizatorRoleFilter, UtilizatorStatusFilter } from "./types";

export const utilizatoriQueryKeys = {
  all: ["utilizatori"] as const,
  list: (input: {
    page: number;
    role: UtilizatorRoleFilter;
    search: string;
    status: UtilizatorStatusFilter;
  }) => [...utilizatoriQueryKeys.all, "list", input] as const,
};
