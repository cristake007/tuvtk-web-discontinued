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
  group?: number;
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
  if (input.group) {
    searchParams.set("group", String(input.group));
  }

  return apiRequest<UtilizatoriResponse>(`${basePath}/?${searchParams}`, {
    cache: "no-store",
  });
}

export function fetchGrupuri(): Promise<import("./types").GrupAplicatii[]> {
  return apiRequest(`${basePath}/grupuri`, { cache: "no-store" });
}

export function fetchAplicatiiGrup(): Promise<import("./types").AplicatieGrup[]> {
  return apiRequest(`${basePath}/grupuri/aplicatii`, { cache: "no-store" });
}

export function createGrup(
  values: import("./types").GrupAplicatiiWrite,
): Promise<import("./types").GrupAplicatii> {
  return apiRequest(`${basePath}/grupuri`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateGrup(
  groupId: number,
  values: import("./types").GrupAplicatiiWrite,
): Promise<import("./types").GrupAplicatii> {
  return apiRequest(`${basePath}/grupuri/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteGrup(groupId: number): Promise<void> {
  return apiRequest(`${basePath}/grupuri/${groupId}`, { method: "DELETE" });
}

export function createUtilizator(values: UtilizatorWrite): Promise<Utilizator> {
  return apiRequest<Utilizator>(`${basePath}/`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function fetchUtilizator(userId: number): Promise<Utilizator> {
  return apiRequest<Utilizator>(`${basePath}/${userId}`, { cache: "no-store" });
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
