import type { ContactFilters } from "./types";
export const contactQueryKeys = {
  all: ["contacte"] as const,
  list: (filters: ContactFilters) => ["contacte", "list", filters] as const,
  detail: (id: number) => ["contacte", "detail", id] as const,
  owners: ["contacte", "owners"] as const,
  companies: ["contacte", "companies"] as const,
};
