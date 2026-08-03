import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import { useContacts } from "../hooks/useContacts";
import type { ContactFilters } from "../types";
import { ContactsTable } from "./ContactsTable";

export function ContactsList({
  filters,
  emptyDescription,
  showCompany = true,
  pagination,
}: {
  filters: ContactFilters;
  emptyDescription: string;
  showCompany?: boolean;
  pagination?: { onPrevious: () => void; onNext: () => void };
}) {
  const query = useContacts(filters);

  if (query.isPending)
    return <Text className="text-muted-foreground">Se încarcă lista contactelor...</Text>;
  if (query.isError)
    return (
      <div className="flex items-center justify-between gap-3 p-4" role="alert">
        <Text>Lista contactelor nu a putut fi încărcată.</Text>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Reîncearcă
        </Button>
      </div>
    );

  return (
    <>
      <ContactsTable
        contacts={query.data.results}
        emptyDescription={emptyDescription}
        showCompany={showCompany}
      />
      {pagination ? (
        <CardContent className="flex items-center justify-between border-t p-4">
          <span>{query.data.count} contacte</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!query.data.previous}
              onClick={pagination.onPrevious}
            >
              Anterior
            </Button>
            <Button variant="outline" disabled={!query.data.next} onClick={pagination.onNext}>
              Următor
            </Button>
          </div>
        </CardContent>
      ) : null}
    </>
  );
}
