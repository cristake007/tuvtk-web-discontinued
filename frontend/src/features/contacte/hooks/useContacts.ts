import { useQuery } from "@tanstack/react-query";

import { fetchContacts } from "../api";
import { contactQueryKeys } from "../queryKeys";
import type { ContactFilters } from "../types";

export function useContacts(filters: ContactFilters) {
  return useQuery({
    queryKey: contactQueryKeys.list(filters),
    queryFn: () => fetchContacts(filters),
    placeholderData: (previous) => previous,
  });
}
