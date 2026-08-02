import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AdminRail } from "./AdminRail";

describe("AdminRail", () => {
  it("activează numai ruta specifică pentru integrarea zilelor libere", () => {
    render(
      <MemoryRouter initialEntries={["/administrare/integrari/zile-libere"]}>
        <AdminRail />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Zile libere și sărbători" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Toate integrările" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("activează intrarea tuturor integrărilor pe ruta-index", () => {
    render(
      <MemoryRouter initialEntries={["/administrare/integrari"]}>
        <AdminRail />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Toate integrările" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Zile libere și sărbători" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
