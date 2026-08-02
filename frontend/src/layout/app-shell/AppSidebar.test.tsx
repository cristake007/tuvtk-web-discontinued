import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

const dashboard: NavigationNode = {
  application_key: "core",
  children: [],
  icon: "layout-dashboard",
  is_separator: false,
  key: "dashboard",
  label: "Dashboard",
  parent_key: null,
  path: "/",
  position: 1,
};

const administrare: NavigationNode = {
  application_key: "core",
  children: [
    {
      application_key: "core",
      children: [],
      icon: "settings",
      is_separator: false,
      key: "interfata-utilizator",
      label: "Interfață utilizator",
      parent_key: "administrare",
      path: "/administrare/sistem/interfata-utilizator",
      position: 1,
    },
  ],
  icon: "settings",
  is_separator: false,
  key: "administrare",
  label: "Administrare",
  parent_key: null,
  path: "/administrare",
  position: 2,
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

function ControlledSidebar({
  initialOpen,
  navigation,
}: {
  initialOpen: boolean;
  navigation: NavigationNode[];
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <SidebarProvider onOpenChange={setOpen} open={open}>
      <AppSidebar navigation={navigation} />
    </SidebarProvider>
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

describe("animația AppSidebar", () => {
  it("păstrează montate și butoanele cu submeniu când extinde sidebarul", () => {
    const { container } = render(
      <MemoryRouter>
        <ControlledSidebar initialOpen={false} navigation={[dashboard, administrare]} />
      </MemoryRouter>,
    );
    const buttonsBefore = container.querySelectorAll('[data-sidebar="menu-button"]');
    const dashboardBefore = buttonsBefore[0];
    const administrareBefore = buttonsBefore[1];

    fireEvent.click(screen.getByRole("button", { name: "Extinde navigația" }));

    const buttonsAfter = container.querySelectorAll('[data-sidebar="menu-button"]');
    expect(buttonsAfter[0]).toBe(dashboardBefore);
    expect(buttonsAfter[1]).toBe(administrareBefore);
  });

  it("deschide flyout-ul pentru un buton cu submeniu când sidebarul este restrâns", () => {
    render(
      <MemoryRouter>
        <ControlledSidebar initialOpen={false} navigation={[administrare]} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Deschide meniul Administrare" }));

    expect(screen.getByRole("menuitem", { name: "Interfață utilizator" })).toBeInTheDocument();
  });

  it("deschide submeniul inline când sidebarul este extins", () => {
    render(
      <MemoryRouter>
        <ControlledSidebar initialOpen navigation={[administrare]} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Administrare" }));

    expect(screen.getByRole("link", { name: "Interfață utilizator" })).toBeInTheDocument();
  });
});

describe("controlul inferior AppSidebar", () => {
  it("restrânge și restaurează sidebarul", () => {
    render(
      <MemoryRouter>
        <ControlledSidebar initialOpen navigation={[dashboard]} />
      </MemoryRouter>,
    );

    const restrangeButton = screen.getByRole("button", { name: "Restrânge" });
    expect(restrangeButton).toHaveClass("hover:bg-transparent!");
    expect(restrangeButton).toHaveClass("hover:text-brand-red");

    fireEvent.click(restrangeButton);
    expect(screen.getByRole("button", { name: "Restaurează" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restaurează" }));
    expect(screen.getByRole("button", { name: "Restrânge" })).toBeInTheDocument();
  });
});
