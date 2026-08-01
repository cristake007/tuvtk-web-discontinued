import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingOverlayProvider } from "@/app/LoadingOverlayContext";

import { fetchConnectionSettings, previewCourseDates } from "./api";
import { UpdateWordPressPanel } from "./UpdateWordPressPanel";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  fetchConnectionSettings: vi.fn(),
  previewCourseDates: vi.fn(),
}));

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoadingOverlayProvider>
        <UpdateWordPressPanel />
      </LoadingOverlayProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchConnectionSettings).mockReset();
  vi.mocked(previewCourseDates).mockReset();
});

describe("UpdateWordPressPanel", () => {
  it("afișează eroarea de configurare cu retry", async () => {
    vi.mocked(fetchConnectionSettings)
      .mockRejectedValueOnce(new Error("Setările nu sunt disponibile."))
      .mockResolvedValue({ wp_base_url: "https://exemplu.ro", wp_username: "editor" });
    renderPanel();

    expect(
      await screen.findByRole("heading", { name: "Update WordPress nu este disponibil" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Încearcă din nou" }));

    expect(
      await screen.findByRole("heading", { name: "Update WordPress" }),
    ).toBeInTheDocument();
  });

  it("afișează un empty state când previzualizarea nu conține cursuri", async () => {
    vi.mocked(fetchConnectionSettings).mockResolvedValue({
      wp_base_url: "",
      wp_username: "",
    });
    vi.mocked(previewCourseDates).mockResolvedValue({ rows: [] });
    renderPanel();

    await screen.findByRole("heading", { name: "Update WordPress" });
    fireEvent.change(screen.getByLabelText("Fișier cu datele cursurilor"), {
      target: { files: [new File(["program"], "program.xlsx")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Previzualizează" }));

    expect(
      await screen.findByText("Niciun curs disponibil pentru actualizare"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
