import { useQuery } from "@tanstack/react-query";
import { fetchContacts } from "../api";
import { contactQueryKeys } from "../queryKeys";
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
  return useQuery({
    queryKey: contactQueryKeys.list(filters),
    queryFn: () => fetchContacts(filters),
  });
}
