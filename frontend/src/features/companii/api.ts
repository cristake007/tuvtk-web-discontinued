import { apiRequest } from "@/api/http";

import type { Company, CompanyFilters, CompanyList, CompanyWrite, Owner } from "./types";

const basePath = "/api/v1/companii/";

export function fetchCompanies(filters: CompanyFilters): Promise<CompanyList> {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: "20",
    archived: String(filters.archived),
    ordering: filters.ordering,
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.vatStatus !== "all") params.set("vat_status", filters.vatStatus);
  if (filters.owner !== "all") params.set("owner", String(filters.owner));
  return apiRequest(`${basePath}?${params}`, { cache: "no-store" });
}

export const fetchCompany = (id: number): Promise<Company> =>
  apiRequest(`${basePath}${id}/`, { cache: "no-store" });
export const fetchOwners = (): Promise<Owner[]> =>
  apiRequest(`${basePath}owners/`, { cache: "no-store" });
export const createCompany = (values: CompanyWrite): Promise<Company> =>
  apiRequest(basePath, { method: "POST", body: JSON.stringify(values) });
export const updateCompany = (id: number, values: CompanyWrite): Promise<Company> =>
  apiRequest(`${basePath}${id}/`, { method: "PATCH", body: JSON.stringify(values) });
export const archiveCompany = (id: number): Promise<Company> =>
  apiRequest(`${basePath}${id}/archive/`, { method: "POST" });
export const restoreCompany = (id: number): Promise<Company> =>
  apiRequest(`${basePath}${id}/restore/`, { method: "POST" });
