import { apiRequest } from "@/api/http";

import type { RezumatDocumente } from "./tipuri";

const caleDocumente = "/api/v1/documente";

export const cheieInterogareDocumente = ["documente", "rezumat"] as const;

export function obtineRezumatDocumente(): Promise<RezumatDocumente> {
  return apiRequest<RezumatDocumente>(`${caleDocumente}/rezumat`, {
    cache: "no-store",
  });
}
