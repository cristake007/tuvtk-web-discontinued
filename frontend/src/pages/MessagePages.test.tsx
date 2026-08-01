import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModulePlaceholderPage } from "./ModulePlaceholderPage";
import { NotFoundPage } from "./NotFoundPage";

describe("paginile de mesaj", () => {
  it("prezintă placeholderul ca modul în pregătire", () => {
    render(
      <ModulePlaceholderPage
        description="Modulul va fi disponibil aici."
        title="Contacte"
      />,
    );

    expect(screen.getByText("Modul în pregătire")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Contacte" })).toBeInTheDocument();
  });

  it("prezintă ruta inexistentă drept eroare 404, nu drept modul", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Eroare 404")).toBeInTheDocument();
    expect(screen.queryByText("Modul în pregătire")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Pagina nu a fost găsită" }),
    ).toBeInTheDocument();
  });
});
