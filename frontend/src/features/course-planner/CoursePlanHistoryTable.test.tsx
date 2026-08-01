import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingOverlayProvider } from "@/app/LoadingOverlayContext";

import { fetchCoursePlanHistory } from "./api";
import { CoursePlanHistoryTable } from "./CoursePlanHistoryTable";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchCoursePlanHistory: vi.fn(),
}));

function renderTable() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoadingOverlayProvider>
        <CoursePlanHistoryTable />
      </LoadingOverlayProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchCoursePlanHistory).mockReset();
});

describe("CoursePlanHistoryTable", () => {
  it("afișează eroarea blocantă cu retry", async () => {
    vi.mocked(fetchCoursePlanHistory)
      .mockRejectedValueOnce(new Error("Istoricul nu este disponibil."))
      .mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    renderTable();

    expect(
      await screen.findByRole("heading", { name: "Istoricul nu este disponibil" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Încearcă din nou" }));

    expect(
      await screen.findByText("Nu există generări salvate"),
    ).toBeInTheDocument();
  });

  it("afișează empty state-ul tabelului pentru un istoric fără rezultate", async () => {
    vi.mocked(fetchCoursePlanHistory).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    renderTable();

    expect(
      await screen.findByText("Nu există generări salvate"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
