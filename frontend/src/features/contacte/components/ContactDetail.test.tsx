import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "sonner";

import { archiveContact, restoreContact } from "../api";
import type { Contact } from "../types";
import { ContactDetail } from "./ContactDetail";

vi.mock("../api", () => ({ archiveContact: vi.fn(), restoreContact: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const contact: Contact = {
  id: 11,
  first_name: "Ana",
  last_name: "Popescu",
  job_title: "Director",
  company: 7,
  company_detail: { id: 7, name: "Exemplu SRL", is_archived: false },
  email: "ana@example.test",
  phone: "",
  mobile_phone: "0712345678",
  status: "ACTIV",
  status_label: "Activ",
  owner: null,
  owner_detail: null,
  notes: "",
  is_archived: false,
  archived_at: null,
  created_at: "2026-08-01T10:00:00Z",
  updated_at: "2026-08-01T10:00:00Z",
};

function renderDetail(value = contact) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <ContactDetail contact={value} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(archiveContact).mockReset();
  vi.mocked(restoreContact).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("detalii contact", () => {
  it("închide dialogul după arhivare și restaurare reușite", async () => {
    vi.mocked(archiveContact).mockResolvedValue({ ...contact, is_archived: true });
    const firstRender = renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Arhivează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));
    await waitFor(() => expect(archiveContact).toHaveBeenCalledWith(contact.id));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    firstRender.unmount();

    const archived = { ...contact, is_archived: true, archived_at: "2026-08-02T10:00:00Z" };
    vi.mocked(restoreContact).mockResolvedValue({ ...archived, is_archived: false });
    renderDetail(archived);
    fireEvent.click(screen.getByRole("button", { name: "Restaurează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));
    await waitFor(() => expect(restoreContact).toHaveBeenCalledWith(contact.id));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("afișează eroarea în română și păstrează dialogul deschis la eșec", async () => {
    vi.mocked(archiveContact).mockRejectedValue(new Error("Eroare"));
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "Arhivează" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmă" }));
    await waitFor(() => expect(archiveContact).toHaveBeenCalledWith(contact.id));
    expect(screen.getByRole("alertdialog", { name: "Arhivezi contactul?" })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Contactul nu a putut fi arhivat.");
  });
});
