import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ContentEmptyState } from "@/components/ContentEmptyState";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text, textVariants } from "@/components/ui/text";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchContactCompanies, fetchContactOwners, fetchContacts } from "../api";
import { contactQueryKeys } from "../queryKeys";
import type { ContactStatus } from "../types";
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
  const contacts = useQuery({
    queryKey: contactQueryKeys.list(filters),
    queryFn: () => fetchContacts(filters),
    placeholderData: (old) => old,
  });
  const companies = useQuery({
    queryKey: contactQueryKeys.companies,
    queryFn: fetchContactCompanies,
  });
  const owners = useQuery({ queryKey: contactQueryKeys.owners, queryFn: fetchContactOwners });
  if (
    contacts.isPending ||
    contacts.isError ||
    companies.isPending ||
    companies.isError ||
    owners.isPending ||
    owners.isError
  )
    return (
      <QueryApplicationState
        error={contacts.error ?? companies.error ?? owners.error}
        errorDescription="Lista contactelor nu a putut fi încărcată."
        errorTitle="Contactele nu sunt disponibile"
        loading={contacts.isPending || companies.isPending || owners.isPending}
        loadingDescription="Se încarcă lista contactelor."
        loadingTitle="Se încarcă contactele"
        onRetry={() => {
          void contacts.refetch();
          void companies.refetch();
          void owners.refetch();
        }}
      />
    );
  return (
    <section className="flex flex-col gap-6">
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
        {contacts.data.results.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Companie</TableHead>
                <TableHead>Funcție</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.data.results.map((c) => (
                <TableRow
                  className="cursor-pointer"
                  key={c.id}
                  onClick={() => navigate(`/crm/contacte/${c.id}`)}
                >
                  <TableCell className="font-medium">
                    {c.first_name} {c.last_name}
                  </TableCell>
                  <TableCell>{c.company_detail.name}</TableCell>
                  <TableCell>{c.job_title || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.is_archived ? "outline" : "secondary"}>
                      {c.is_archived ? "Arhivat" : c.status_label}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.email || c.mobile_phone || c.phone || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ContentEmptyState
            icon={Users}
            title="Nu există contacte"
            description="Adaugă primul contact sau modifică filtrele curente."
          />
        )}
        <CardContent className="flex items-center justify-between border-t p-4">
          <span>{contacts.data.count} contacte</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!contacts.data.previous}
              onClick={() => setPage((v) => v - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!contacts.data.next}
              onClick={() => setPage((v) => v + 1)}
            >
              Următor
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
function Filter({
  value,
  setValue,
  all,
  items,
}: {
  value: number | string;
  setValue: (v: any) => void;
  all: string;
  items: (string | number)[][];
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => setValue(v === "all" ? "all" : Number.isNaN(Number(v)) ? v : Number(v))}
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
