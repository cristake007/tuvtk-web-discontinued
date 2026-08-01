import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TypographySettingsCard } from "./TypographySettingsCard";

describe("TypographySettingsCard", () => {
  it("expune numai treptele acceptate și transmite selecția", () => {
    const onChangeFontScale = vi.fn();

    render(
      <TypographySettingsCard
        esteModificat
        fontScale={1}
        onChangeFontScale={onChangeFontScale}
        onSubmit={vi.fn((event) => event.preventDefault())}
        saving={false}
      />,
    );

    expect(screen.getAllByRole("radio")).toHaveLength(3);

    fireEvent.click(screen.getByRole("radio", { name: /Mărit · 112,5%/ }));

    expect(onChangeFontScale).toHaveBeenCalledWith(1.125);
  });

  it("permite salvarea numai când valoarea este modificată", () => {
    const { rerender } = render(
      <TypographySettingsCard
        esteModificat={false}
        fontScale={1}
        onChangeFontScale={vi.fn()}
        onSubmit={vi.fn((event) => event.preventDefault())}
        saving={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvează" })).toBeDisabled();

    rerender(
      <TypographySettingsCard
        esteModificat
        fontScale={1.125}
        onChangeFontScale={vi.fn()}
        onSubmit={vi.fn((event) => event.preventDefault())}
        saving={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvează" })).toBeEnabled();
  });
});
