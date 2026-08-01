import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkflowPage } from "./WorkflowPage";

describe("WorkflowPage", () => {
  it("oferă structura comună și eticheta semantică a workflow-ului", () => {
    render(
      <WorkflowPage ariaLabel="Formatare XML cursuri">
        <p>Conținut workflow</p>
      </WorkflowPage>,
    );

    const wrapper = screen.getByRole("region", { name: "Formatare XML cursuri" });
    expect(wrapper).toHaveClass("relative", "flex", "min-h-full", "min-w-0", "flex-1");
    expect(wrapper).toHaveTextContent("Conținut workflow");
  });
});
