import { ContactsList } from "./ContactsList";
import type { ContactFilters } from "../types";

type ContactsByCompanyProps =
  | { companyId: number; filters?: never; pagination?: never }
  | {
      companyId?: never;
      filters: ContactFilters;
      pagination: { onPrevious: () => void; onNext: () => void };
    };

export function ContactsByCompany({ companyId, filters, pagination }: ContactsByCompanyProps) {
  const embedded = companyId !== undefined;
  const contactFilters: ContactFilters = filters ?? {
    page: 1,
    search: "",
    company: companyId,
    status: "all",
    owner: "all",
    archived: false,
    ordering: "last_name",
  };
  return (
    <ContactsList
      filters={contactFilters}
      emptyDescription={
        embedded
          ? "Compania nu are contacte active asociate."
          : "Adaugă primul contact sau modifică filtrele curente."
      }
      showCompany={!embedded}
      pagination={pagination}
    />
  );
}
