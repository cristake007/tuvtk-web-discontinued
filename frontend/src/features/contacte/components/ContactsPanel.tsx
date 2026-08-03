import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text, textVariants } from "@/components/ui/text";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchContactCompanies, fetchContactOwners } from "../api";
import { contactQueryKeys } from "../queryKeys";
import type { ContactStatus } from "../types";
import { ContactsByCompany } from "./ContactsByCompany";
export function ContactsPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [company, setCompany] = useState<number | "all">("all");
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [owner, setOwner] = useState<number | "all">("all");
  const [archived, setArchived] = useState(false);
  const [ordering, setOrdering] = useState("last_name");
  useEffect(() => setPage(1), [debouncedSearch, company, status, owner, archived, ordering]);
  const filters = { page, search: debouncedSearch, company, status, owner, archived, ordering };
  const companies = useQuery({
    queryKey: contactQueryKeys.companies,
    queryFn: fetchContactCompanies,
  });
  const owners = useQuery({ queryKey: contactQueryKeys.owners, queryFn: fetchContactOwners });
  const header = (
    <div className="flex items-center justify-between">
      <div>
        <PageTitle>Contacte</PageTitle>
        <Text className="text-muted-foreground">
          Administrează persoanele de contact ale companiilor.
        </Text>
      </div>
      <Button onClick={() => navigate("/crm/contacte/adaugare")}>
        <Plus aria-hidden="true" />
        Adaugă contact
      </Button>
    </div>
  );
  if (companies.isPending || companies.isError || owners.isPending || owners.isError)
    return (
      <section className="flex flex-col gap-6">
        {header}
        <div className="flex items-center justify-between gap-3" role="alert">
          <Text>
            {companies.isPending || owners.isPending
              ? "Se încarcă filtrele contactelor..."
              : "Filtrele contactelor nu au putut fi încărcate."}
          </Text>
          {companies.isError || owners.isError ? (
            <Button
              variant="outline"
              onClick={() => {
                void companies.refetch();
                void owners.refetch();
              }}
            >
              Reîncearcă
            </Button>
          ) : null}
        </div>
      </section>
    );
  return (
    <section className="flex flex-col gap-6">
      {header}
      <Card className="gap-0 py-0">
        <CardContent className="grid gap-3 border-b p-4 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              aria-label="Caută contacte"
              placeholder="Nume, e-mail sau companie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Filter
            value={company}
            setValue={setCompany}
            all="Toate companiile"
            items={companies.data.map((x) => [x.id, x.name])}
          />
          <Filter
            value={status}
            setValue={setStatus}
            all="Toate stările"
            items={[
              ["ACTIV", "Active"],
              ["INACTIV", "Inactive"],
              ["FOST_ANGAJAT", "Foști angajați"],
            ]}
          />
          <Filter
            value={owner}
            setValue={setOwner}
            all="Toți responsabilii"
            items={owners.data.map((x) => [x.id, x.display_name])}
          />
          <Select value={ordering} onValueChange={(v) => setOrdering(v ?? "last_name")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_name">Nume A–Z</SelectItem>
              <SelectItem value="-updated_at">Actualizate recent</SelectItem>
              <SelectItem value="-created_at">Create recent</SelectItem>
            </SelectContent>
          </Select>
          <label className={textVariants({ className: "flex items-center gap-2" })}>
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            Afișează arhivate
          </label>
        </CardContent>
        <ContactsByCompany
          filters={filters}
          pagination={{
            onPrevious: () => setPage((value) => value - 1),
            onNext: () => setPage((value) => value + 1),
          }}
        />
      </Card>
    </section>
  );
}
function Filter<T extends number | string>({
  value,
  setValue,
  all,
  items,
}: {
  value: T;
  setValue: (value: T) => void;
  all: string;
  items: (string | number)[][];
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => {
        const nextValue = v === "all" || Number.isNaN(Number(v)) ? v : Number(v);
        setValue(nextValue as T);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {items.map(([id, label]) => (
          <SelectItem key={id} value={String(id)}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
