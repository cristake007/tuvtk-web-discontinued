import { apiRequest } from "@/api/http";
import type { Owner } from "@/features/companii/types";
import type { CompanyReference, Contact, ContactFilters, ContactList, ContactWrite } from "./types";
const basePath = "/api/v1/contacte/";
export function fetchContacts(filters: ContactFilters): Promise<ContactList> {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: "20",
    archived: String(filters.archived),
    ordering: filters.ordering,
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.company !== "all") params.set("company", String(filters.company));
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.owner !== "all") params.set("owner", String(filters.owner));
  return apiRequest(`${basePath}?${params}`, { cache: "no-store" });
}
export const fetchContact = (id: number): Promise<Contact> =>
  apiRequest(`${basePath}${id}/`, { cache: "no-store" });
export const fetchContactOwners = (): Promise<Owner[]> =>
  apiRequest(`${basePath}owners/`, { cache: "no-store" });
export const fetchContactCompanies = (): Promise<CompanyReference[]> =>
  apiRequest(`${basePath}companies/`, { cache: "no-store" });
export const createContact = (values: ContactWrite): Promise<Contact> =>
  apiRequest(basePath, { method: "POST", body: JSON.stringify(values) });
export const updateContact = (id: number, values: ContactWrite): Promise<Contact> =>
  apiRequest(`${basePath}${id}/`, { method: "PATCH", body: JSON.stringify(values) });
export const archiveContact = (id: number): Promise<Contact> =>
  apiRequest(`${basePath}${id}/archive/`, { method: "POST" });
export const restoreContact = (id: number): Promise<Contact> =>
  apiRequest(`${basePath}${id}/restore/`, { method: "POST" });
