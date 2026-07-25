import { apiRequest } from "@/api/http";

import type {
  Utilizator,
  UtilizatorRoleFilter,
  UtilizatorStatusFilter,
  UtilizatoriResponse,
  UtilizatorWrite,
} from "./types";

const basePath = "/api/v1/utilizatori";

export function fetchUtilizatori(input: {
  page: number;
  role: UtilizatorRoleFilter;
  search: string;
  status: UtilizatorStatusFilter;
}): Promise<UtilizatoriResponse> {
  const searchParams = new URLSearchParams({
    page: String(input.page),
    page_size: "20",
    role: input.role,
    status: input.status,
  });
  if (input.search.trim()) {
    searchParams.set("search", input.search.trim());
  }

  return apiRequest<UtilizatoriResponse>(`${basePath}/?${searchParams}`, {
    cache: "no-store",
  });
}

export function createUtilizator(values: UtilizatorWrite): Promise<Utilizator> {
  return apiRequest<Utilizator>(`${basePath}/`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateUtilizator(
  userId: number,
  values: UtilizatorWrite,
): Promise<Utilizator> {
  return apiRequest<Utilizator>(`${basePath}/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}
