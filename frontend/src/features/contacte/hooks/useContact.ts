import { useQuery } from "@tanstack/react-query";
import { fetchContact } from "../api";
import { contactQueryKeys } from "../queryKeys";
export function useContact(id: number, enabled = true) {
  return useQuery({
    queryKey: contactQueryKeys.detail(id),
    queryFn: () => fetchContact(id),
    enabled,
  });
}
