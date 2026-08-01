import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthenticatedBootstrap } from "@/app/AuthenticatedBootstrapContext";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (usersQuery.isPending || usersQuery.isError) {
    return (
      <QueryApplicationState
        error={usersQuery.error}
        errorDescription="Lista utilizatorilor nu a putut fi încărcată."
        errorTitle="Utilizatorii nu sunt disponibili"
        loading={usersQuery.isPending}
        loadingDescription="Se încarcă utilizatorii și drepturile conturilor."
        loadingTitle="Se încarcă utilizatorii"
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={() => navigate("/administrare/utilizatori/adaugare")} type="button">
          <Plus aria-hidden="true" />
          Adaugă utilizator
        </Button>
      </div>

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

          <div className="flex min-h-9 items-center justify-end gap-2 text-xs text-muted-foreground">
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
                            <code>@{user.username}</code>
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
                      <ul className="flex flex-wrap gap-1">
                        {user.groups.length ? (
                          user.groups.map((group) => (
                            <li key={group.id}>
                              <Badge variant="outline">{group.name}</Badge>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">—</li>
                        )}
                      </ul>
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
            <SectionTitle className="mt-3">Nu am găsit utilizatori</SectionTitle>
            <p className="mt-1 max-w-md text-base leading-6 text-muted-foreground">
              Modifică termenul de căutare sau filtrele aplicate.
            </p>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
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
