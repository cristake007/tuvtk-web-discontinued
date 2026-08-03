import { useContacts } from "./useContacts";
export function useContactsByCompany(company: number) {
  const filters = {
    page: 1,
    search: "",
    company,
    status: "all" as const,
    owner: "all" as const,
    archived: false,
    ordering: "last_name",
  };
  return useContacts(filters);
}
