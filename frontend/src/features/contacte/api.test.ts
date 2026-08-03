import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchContacts } from "./api";

describe("API contacte", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("trimite căutarea și toate filtrele structurate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchContacts({
      page: 2,
      search: "Ana",
      company: 3,
      status: "ACTIV",
      owner: 7,
      archived: true,
      ordering: "-updated_at",
    });

    const path = String(fetchMock.mock.calls[0]?.[0]);
    expect(path).toContain("search=Ana");
    expect(path).toContain("company=3");
    expect(path).toContain("status=ACTIV");
    expect(path).toContain("owner=7");
    expect(path).toContain("archived=true");
    expect(path).toContain("ordering=-updated_at");
  });
});
