import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Search } from "lucide-react";
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

import { fetchCompanies, fetchOwners } from "../api";
import { companyQueryKeys } from "../queryKeys";
import type { CompanyStatus, VatStatus } from "../types";

export function CompaniesPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState<CompanyStatus | "all">("all");
  const [vatStatus, setVatStatus] = useState<VatStatus | "all">("all");
  const [owner, setOwner] = useState<number | "all">("all");
  const [archived, setArchived] = useState(false);
  const [ordering, setOrdering] = useState("name");
  useEffect(() => setPage(1), [debouncedSearch, status, vatStatus, owner, archived, ordering]);
  const filters = { page, search: debouncedSearch, status, vatStatus, owner, archived, ordering };
  const companies = useQuery({
    queryKey: companyQueryKeys.list(filters),
    queryFn: () => fetchCompanies(filters),
    placeholderData: (old) => old,
  });
  const owners = useQuery({ queryKey: companyQueryKeys.owners, queryFn: fetchOwners });
  if (companies.isPending || companies.isError || owners.isPending || owners.isError)
    return (
      <QueryApplicationState
        error={companies.error ?? owners.error}
        errorDescription="Lista companiilor nu a putut fi încărcată."
        errorTitle="Companiile nu sunt disponibile"
        loading={companies.isPending || owners.isPending}
        loadingDescription="Se încarcă lista companiilor."
        loadingTitle="Se încarcă companiile"
        onRetry={() => {
          void companies.refetch();
          void owners.refetch();
        }}
      />
    );
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <PageTitle>Companii</PageTitle>
          <Text className="text-muted-foreground">
            Administrează organizațiile și datele lor comerciale.
          </Text>
        </div>
        <Button onClick={() => navigate("/crm/companii/adaugare")}>
          <Plus aria-hidden="true" />
          Adaugă companie
        </Button>
      </div>
      <Card className="gap-0 py-0">
        <CardContent className="grid gap-3 border-b p-4 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              aria-label="Caută companii"
              placeholder="Nume, CUI sau e-mail..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as CompanyStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate stările</SelectItem>
              <SelectItem value="ACTIV">Active</SelectItem>
              <SelectItem value="PROSPECT">Prospecte</SelectItem>
              <SelectItem value="INACTIV">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={vatStatus}
            onValueChange={(value) => setVatStatus(value as VatStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Orice statut TVA</SelectItem>
              <SelectItem value="TVA_PLATITOR">Plătitoare TVA</SelectItem>
              <SelectItem value="TVA_NEPLATITOR">Neplătitoare TVA</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={owner === "all" ? "all" : String(owner)}
            onValueChange={(value) => setOwner(value === "all" ? "all" : Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți responsabilii</SelectItem>
              {owners.data?.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ordering} onValueChange={(value) => setOrdering(value ?? "name")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nume A–Z</SelectItem>
              <SelectItem value="-updated_at">Actualizate recent</SelectItem>
              <SelectItem value="-created_at">Create recent</SelectItem>
              <SelectItem value="status">După statut</SelectItem>
            </SelectContent>
          </Select>
          <label className={textVariants({ className: "flex items-center gap-2" })}>
            <input
              type="checkbox"
              checked={archived}
              onChange={(event) => setArchived(event.target.checked)}
            />
            Afișează arhivate
          </label>
        </CardContent>
        {companies.data.results.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Companie</TableHead>
                <TableHead>CUI</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsabil</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.data.results.map((company) => (
                <TableRow
                  className="cursor-pointer"
                  key={company.id}
                  onClick={() => navigate(`/crm/companii/${company.id}`)}
                >
                  <TableCell>
                    <span className="font-medium">{company.name}</span>
                    {company.legal_name ? (
                      <span
                        className={textVariants({
                          variant: "detaliu",
                          className: "block text-muted-foreground",
                        })}
                      >
                        {company.legal_name}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>{company.cui ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={company.is_archived ? "outline" : "secondary"}>
                      {company.is_archived ? "Arhivată" : company.status_label}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.owner_detail?.display_name ?? "—"}</TableCell>
                  <TableCell>{company.email || company.phone || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ContentEmptyState
            icon={Building2}
            title="Nu există companii"
            description="Adaugă prima companie sau modifică filtrele curente."
          />
        )}
        <CardContent className="flex items-center justify-between border-t p-4">
          <span className={textVariants({ className: "text-muted-foreground" })}>
            {companies.data.count} companii
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!companies.data.previous}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!companies.data.next}
              onClick={() => setPage((value) => value + 1)}
            >
              Următor
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
