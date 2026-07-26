import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListaMeniuSortabila } from "./SortableMenuList";

describe("ListaMeniuSortabila", () => {
  it("afișează titlul real și acțiunile separatorului", () => {
    render(
      <ListaMeniuSortabila
        elemente={[{ is_separator: true, key: "separator-crm", label: "CRM" }]}
        onRedenumesteSeparator={vi.fn()}
        onSchimbaOrdinea={vi.fn()}
        onStergeSeparator={vi.fn()}
      />,
    );

    expect(screen.getByText("CRM")).toBeInTheDocument();
    expect(screen.queryByText("Separator")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redenumește" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elimină" })).toBeInTheDocument();
  });
});
