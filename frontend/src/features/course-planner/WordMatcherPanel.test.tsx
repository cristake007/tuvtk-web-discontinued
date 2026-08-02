import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { previewWordMatch } from "./api";
import { WordMatcherPanel } from "./WordMatcherPanel";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  previewWordMatch: vi.fn(),
}));

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WordMatcherPanel />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(previewWordMatch).mockReset();
});

describe("WordMatcherPanel", () => {
  it("afișează un empty state când previzualizarea nu conține rânduri", async () => {
    vi.mocked(previewWordMatch).mockResolvedValue({
      matched_count: 0,
      rows: [],
      schedule_options: [],
      skipped_count: 0,
      word_file_b64: "",
    });
    renderPanel();

    fireEvent.change(screen.getByLabelText("Document Word"), {
      target: { files: [new File(["word"], "cursuri.docx")] },
    });
    fireEvent.change(screen.getByLabelText("Program cursuri"), {
      target: { files: [new File(["program"], "program.xlsx")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Previzualizează potrivirile" }));

    expect(await screen.findByText("Niciun rând disponibil pentru potrivire")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
