import type { CompanyFilters } from "./types";

export const companyQueryKeys = {
  all: ["companii"] as const,
  list: (filters: CompanyFilters) => ["companii", "list", filters] as const,
  detail: (id: number) => ["companii", "detail", id] as const,
  owners: ["companii", "owners"] as const,
};
