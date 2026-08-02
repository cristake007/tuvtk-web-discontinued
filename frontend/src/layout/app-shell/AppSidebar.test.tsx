import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "./AppSidebar";
import type { NavigationNode } from "./navigation";

const separator: NavigationNode = {
  application_key: "core",
  children: [],
  icon: "",
  is_separator: true,
  key: "separator-crm",
  label: "CRM",
  parent_key: null,
  path: "",
  position: 10,
};

function renderSidebar(open: boolean) {
  return render(
    <MemoryRouter>
      <SidebarProvider open={open}>
        <AppSidebar navigation={[separator]} />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("separatorul din AppSidebar", () => {
  it("afișează titlul între două linii în sidebarul extins", () => {
    renderSidebar(true);

    const element = screen.getByRole("separator", { name: "CRM" });
    const lines = element.querySelectorAll('[aria-hidden="true"]');

    expect(within(element).getByText("CRM")).toBeInTheDocument();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveClass("bg-sidebar-border");
    expect(lines[1]).toHaveClass("bg-sidebar-border");
  });

  it("ascunde titlul și a doua linie în sidebarul restrâns", () => {
    const { container } = renderSidebar(false);

    expect(container.querySelector('[data-collapsible="icon"]')).toBeInTheDocument();
    expect(screen.getByText("CRM")).toHaveClass("group-data-[collapsible=icon]:hidden");
    const lines = screen
      .getByRole("separator", { name: "CRM" })
      .querySelectorAll('[aria-hidden="true"]');
    expect(lines[0]).not.toHaveClass("group-data-[collapsible=icon]:hidden");
    expect(lines[1]).toHaveClass("group-data-[collapsible=icon]:hidden");
  });
});
