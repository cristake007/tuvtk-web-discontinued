import { ContactsList } from "./ContactsList";
export function ContactsByCompany({ companyId }: { companyId: number }) {
  return (
    <ContactsList
      filters={{
        page: 1,
        search: "",
        company: companyId,
        status: "all",
        owner: "all",
        archived: false,
        ordering: "last_name",
      }}
      emptyDescription="Compania nu are contacte active asociate."
      showCompany={false}
    />
  );
}
