import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthenticatedBootstrap } from "@/app/AuthenticatedBootstrapContext";
import { ApplicationState } from "@/components/ApplicationState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiError } from "@/lib/api-errors";
import { formatRomanianDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

import {
  fetchGrupuri,
  fetchUtilizatori,
} from "./api";
import { utilizatoriQueryKeys } from "./queryKeys";
import type {
  Utilizator,
  UtilizatorRoleFilter,
  UtilizatorStatusFilter,
} from "./types";

const pageSize = 20;

function initials(user: Utilizator): string {
  const source = user.full_name || user.username;
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("ro-RO"))
    .join("");
}

function AccountTypeBadge({ user }: { user: Utilizator }) {
  if (user.is_superuser) {
    return <Badge>Superutilizator</Badge>;
  }
  if (user.is_staff) {
    return <Badge variant="secondary">Administrator</Badge>;
  }
  return <Badge variant="outline">Utilizator</Badge>;
}

export function UtilizatoriPanel() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UtilizatorStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UtilizatorRoleFilter>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  const bootstrap = useAuthenticatedBootstrap();

  const listQueryInput = {
    group: groupFilter === "all" ? undefined : Number(groupFilter),
    page,
    role: roleFilter,
    search: debouncedSearch,
    status: statusFilter,
  };
  const usersQuery = useQuery({
    queryKey: utilizatoriQueryKeys.list(listQueryInput),
    queryFn: () => fetchUtilizatori(listQueryInput),
    placeholderData: (previous) => previous,
  });
  const groupsQuery = useQuery({
    queryKey: utilizatoriQueryKeys.grupuri(),
    queryFn: fetchGrupuri,
  });
  const count = usersQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const previousDisabled = page <= 1 || usersQuery.isFetching;
  const nextDisabled = page >= pageCount || usersQuery.isFetching;
  const currentUser = bootstrap.user;

  if (usersQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă utilizatorii și drepturile conturilor."
        loading
        title="Se încarcă utilizatorii"
      />
    );
  }

  if (usersQuery.isError) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description={formatApiError(
          usersQuery.error,
          "Lista utilizatorilor nu a putut fi încărcată.",
        )}
        onAction={() => void usersQuery.refetch()}
        title="Utilizatorii nu sunt disponibili"
      />
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6 bg-background">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary">Administrare</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Utilizatori
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Gestionează conturile care se pot autentifica în platformă, starea lor și
            accesul administrativ.
          </p>
        </div>
        <Button className="shrink-0" onClick={() => navigate("/administrare/utilizatori/adaugare")} type="button">
          <Plus aria-hidden="true" />
          Adaugă utilizator
        </Button>
      </header>

      <Card className="gap-0 py-0">
        <CardContent className="grid gap-3 border-b p-4 xl:grid-cols-[minmax(18rem,1fr)_12rem_12rem_12rem_auto]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Caută utilizatori"
              className="pl-9"
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              placeholder="Caută după nume, utilizator sau e-mail..."
              type="search"
              value={searchValue}
            />
          </div>

          <Select
            onValueChange={(value) => {
              setStatusFilter(value as UtilizatorStatusFilter);
              setPage(1);
            }}
            value={statusFilter}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate stările</SelectItem>
              <SelectItem value="active">Conturi active</SelectItem>
              <SelectItem value="inactive">Conturi inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setGroupFilter(value ?? "all");
              setPage(1);
            }}
            value={groupFilter}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Toate grupurile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate grupurile</SelectItem>
              {groupsQuery.data?.map((group) => (
                <SelectItem key={group.id} value={String(group.id)}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              setRoleFilter(value as UtilizatorRoleFilter);
              setPage(1);
            }}
            value={roleFilter}
          >
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile de cont</SelectItem>
              <SelectItem value="staff">Administratori</SelectItem>
              <SelectItem value="user">Utilizatori standard</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex min-h-9 items-center justify-end gap-2 text-sm text-muted-foreground">
            {usersQuery.isFetching ? <Spinner className="size-4" /> : null}
            <span>{count} conturi</span>
          </div>
        </CardContent>

        {usersQuery.data?.results.length ? (
          <Table className="min-w-[64rem]">
            <TableHeader className="bg-muted/70">
              <TableRow className="hover:bg-transparent">
                <TableHead>Utilizator</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tip cont</TableHead>
                <TableHead>Grupuri</TableHead>
                <TableHead>Stare</TableHead>
                <TableHead>Ultima autentificare</TableHead>
                <TableHead>Creat la</TableHead>
                <TableHead className="w-16 text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.data.results.map((user) => {
                const editDisabled = user.is_superuser && !currentUser?.is_superuser;
                return (
                  <TableRow className="even:bg-muted/25" key={user.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initials(user)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{user.username}
                            {currentUser?.id === user.id ? " · contul tău" : ""}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell>
                      <AccountTypeBadge user={user} />
                    </TableCell>
                    <TableCell className="max-w-52">
                      <div className="flex flex-wrap gap-1">
                        {user.groups.length ? (
                          user.groups.map((group) => (
                            <Badge key={group.id} variant="outline">
                              {group.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "destructive"}>
                        {user.is_active ? "Activ" : "Inactiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {user.last_login
                        ? formatRomanianDateTime(user.last_login)
                        : "Niciodată"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRomanianDateTime(user.date_joined)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          aria-label={`Editează utilizatorul ${user.full_name}`}
                          disabled={editDisabled}
                          onClick={() => navigate(`/administrare/utilizatori/${user.id}`)}
                          size="icon-sm"
                          title={
                            editDisabled
                              ? "Doar un superutilizator poate modifica acest cont"
                              : "Editează utilizatorul"
                          }
                          type="button"
                          variant="outline"
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <Users aria-hidden="true" className="size-9 text-muted-foreground" />
            <h2 className="mt-3 font-medium">Nu am găsit utilizatori</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Modifică termenul de căutare sau filtrele aplicate.
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Pagina {page} din {pageCount}
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                aria-disabled={previousDisabled}
                className={cn(previousDisabled && "pointer-events-none opacity-50")}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (!previousDisabled) {
                    setPage((current) => Math.max(1, current - 1));
                  }
                }}
                text="Anterior"
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                aria-disabled={nextDisabled}
                className={cn(nextDisabled && "pointer-events-none opacity-50")}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (!nextDisabled) {
                    setPage((current) => Math.min(pageCount, current + 1));
                  }
                }}
                text="Următor"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

    </section>
  );
}
