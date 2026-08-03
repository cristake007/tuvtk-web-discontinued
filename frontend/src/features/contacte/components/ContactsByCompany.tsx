import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useContactsByCompany } from "../hooks/useContactsByCompany";
import { ContactsTable } from "./ContactsTable";
export function ContactsByCompany({ companyId }: { companyId: number }) {
  const query = useContactsByCompany(companyId);
  if (query.isPending)
    return <Text className="text-muted-foreground">Se încarcă contactele companiei...</Text>;
  if (query.isError)
    return (
      <div className="flex items-center justify-between gap-3" role="alert">
        <Text>Contactele companiei nu au putut fi încărcate.</Text>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Reîncearcă
        </Button>
      </div>
    );
  return (
    <ContactsTable
      contacts={query.data.results}
      emptyDescription="Compania nu are contacte active asociate."
      showCompany={false}
    />
  );
}
