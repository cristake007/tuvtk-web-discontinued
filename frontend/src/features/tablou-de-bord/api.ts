import { apiRequest } from "@/api/http";

import type { RezumatTablouDeBord } from "./tipuri";

const caleTablouDeBord = "/api/v1/tablou-de-bord";

export const cheieInterogareTablouDeBord = ["tablou-de-bord", "rezumat"] as const;

export function obtineRezumatTablouDeBord(): Promise<RezumatTablouDeBord> {
  return apiRequest<RezumatTablouDeBord>(`${caleTablouDeBord}/rezumat`, {
    cache: "no-store",
  });
}
