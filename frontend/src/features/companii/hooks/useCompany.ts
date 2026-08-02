import { useQuery } from "@tanstack/react-query";

import { fetchCompany } from "../api";
import { companyQueryKeys } from "../queryKeys";

export function useCompany(id: number, enabled = true) {
  return useQuery({
    queryKey: companyQueryKeys.detail(id),
    queryFn: () => fetchCompany(id),
    enabled,
  });
}
