import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCompanies } from "./api";

describe("API companii", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("trimite căutarea și filtrele structurate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchCompanies({
      page: 2,
      search: "Acme",
      status: "ACTIV",
      vatStatus: "TVA_PLATITOR",
      owner: 7,
      archived: false,
      ordering: "-updated_at",
    });

    const path = String(fetchMock.mock.calls[0]?.[0]);
    expect(path).toContain("search=Acme");
    expect(path).toContain("status=ACTIV");
    expect(path).toContain("vat_status=TVA_PLATITOR");
    expect(path).toContain("owner=7");
    expect(path).toContain("archived=false");
    expect(path).toContain("ordering=-updated_at");
  });

  it("solicită explicit companiile arhivate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchCompanies({
      page: 1,
      search: "",
      status: "all",
      vatStatus: "all",
      owner: "all",
      archived: true,
      ordering: "name",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("archived=true");
  });
});
