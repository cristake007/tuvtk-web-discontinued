import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatApiError, getApiFieldError } from "@/lib/api-errors";

import {
  createGrup,
  deleteGrup,
  fetchAplicatiiGrup,
  fetchGrupuri,
  fetchUtilizatoriSelectie,
  updateGrup,
} from "./api";
import { updateGroupName, updateGroupSelection } from "./groupFormState";
import { utilizatoriQueryKeys } from "./queryKeys";
import type { GrupAplicatii, GrupAplicatiiFormValues } from "./types";

const emptyValues: GrupAplicatiiFormValues = {
  name: "",
  application_ids: [],
  user_ids: [],
};

function valuesForGroup(group: GrupAplicatii | null): GrupAplicatiiFormValues {
  if (!group) {
    return emptyValues;
  }
  return {
    name: group.name,
    application_ids: group.applications.map((application) => application.id),
    user_ids: group.users.map((user) => user.id),
  };
}

function GrupDialog({
  applications,
  error,
  group,
  onOpenChange,
  onSubmit,
  open,
  pending,
}: {
  applications: Awaited<ReturnType<typeof fetchAplicatiiGrup>>;
  error: unknown;
  group: GrupAplicatii | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GrupAplicatiiFormValues) => void;
  open: boolean;
  pending: boolean;
}) {
  const [values, setValues] = useState<GrupAplicatiiFormValues>(emptyValues);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => window.clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => setUserPage(1), [debouncedUserSearch]);

  const selectionQuery = useQuery({
    enabled: open,
    queryKey: [...utilizatoriQueryKeys.all, "selectie", userPage, debouncedUserSearch],
    queryFn: () => fetchUtilizatoriSelectie({ page: userPage, search: debouncedUserSearch }),
  });

  useEffect(() => {
    if (open) {
      setValues(valuesForGroup(group));
    }
  }, [group, open]);

  function toggle(field: "application_ids" | "user_ids", id: number, checked: boolean) {
    setValues((current) => updateGroupSelection(current, field, id, checked));
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim()) {
      return;
    }
    onSubmit({ ...values, name: values.name.trim() });
  }

  const nameError = getApiFieldError(error, "name");
  const visibleUsers = useMemo(() => {
    const existingUsers = group?.users.map((user) => ({ ...user, email: "", is_active: user.is_active ?? true })) ?? [];
    const byId = new Map(existingUsers.map((user) => [user.id, user]));
    for (const user of selectionQuery.data?.results ?? []) {
      byId.set(user.id, { ...user, email: user.email ?? "", is_active: user.is_active ?? true });
    }
    return [...byId.values()];
  }, [group, selectionQuery.data]);
  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{group ? "Editează grupul" : "Adaugă grup"}</DialogTitle>
          <DialogDescription>
            Membrii primesc reuniunea accesului acordat prin toate grupurile lor.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          {error ? <Alert variant="destructive"><AlertDescription>{formatApiError(error, "Grupul nu a putut fi salvat.")}</AlertDescription></Alert> : null}
          <Field data-invalid={Boolean(nameError)}>
            <FieldLabel htmlFor="grup-name">Nume grup</FieldLabel>
            <Input
              aria-invalid={Boolean(nameError)}
              disabled={pending}
              id="grup-name"
              onChange={(event) => {
                const name = event.currentTarget.value;
                setValues((current) => updateGroupName(current, name));
              }}
              value={values.name}
            />
            <FieldError>{nameError}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Acces aplicații</FieldLabel>
            <FieldDescription>Selectează aplicațiile disponibile membrilor acestui grup.</FieldDescription>
            <ul className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
              {applications.map((application) => (
                <li key={application.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={values.application_ids.includes(application.id)}
                      disabled={pending}
                      onCheckedChange={(checked) => {
                        const value = checked === true;
                        toggle("application_ids", application.id, value);
                      }}
                    />
                    {application.name}
                  </label>
                </li>
              ))}
            </ul>
          </Field>
          <Field>
            <FieldLabel>Utilizatori</FieldLabel>
            <FieldDescription>Accesul provenit din mai multe grupuri se cumulează.</FieldDescription>
            <Input aria-label="Caută utilizatori" disabled={pending} onChange={(event) => setUserSearch(event.currentTarget.value)} placeholder="Caută după nume, utilizator sau e-mail..." type="search" value={userSearch} />
            <ul className="grid max-h-52 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
              {selectionQuery.isPending ? <li className="text-sm text-muted-foreground">Se caută utilizatori…</li> : null}
              {visibleUsers.map((user) => (
                <li key={user.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={values.user_ids.includes(user.id)}
                      disabled={pending}
                      onCheckedChange={(checked) => {
                        const value = checked === true;
                        toggle("user_ids", user.id, value);
                      }}
                    />
                    <span>{user.full_name} <code className="text-muted-foreground">@{user.username}</code>{!user.is_active ? <span className="ml-1 text-destructive">(inactiv)</span> : null}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectionQuery.data?.count ?? 0} utilizatori</span>
              <div className="flex gap-2"><Button disabled={pending || !selectionQuery.data?.previous} onClick={() => setUserPage((page) => page - 1)} size="sm" type="button" variant="outline">Anterior</Button><Button disabled={pending || !selectionQuery.data?.next} onClick={() => setUserPage((page) => page + 1)} size="sm" type="button" variant="outline">Următor</Button></div>
            </div>
          </Field>
          <DialogFooter>
            <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">Anulează</Button>
            <Button disabled={pending || !values.name.trim()} type="submit">{pending ? "Se salvează…" : "Salvează"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GrupuriAplicatiiPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GrupAplicatii | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GrupAplicatii | null>(null);
  const groupsQuery = useQuery({ queryKey: utilizatoriQueryKeys.grupuri(), queryFn: fetchGrupuri });
  const applicationsQuery = useQuery({ queryKey: [...utilizatoriQueryKeys.grupuri(), "aplicatii"], queryFn: fetchAplicatiiGrup });
  const saveMutation = useMutation({
    mutationFn: (values: GrupAplicatiiFormValues) => selectedGroup ? updateGrup(selectedGroup.id, values) : createGrup(values),
    onSuccess: (_, values) => {
      setDialogOpen(false);
      setSelectedGroup(null);
      void queryClient.invalidateQueries({ queryKey: utilizatoriQueryKeys.all });
      toast.success("Grupul a fost salvat.", { description: values.name });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteGrup,
    onSuccess: () => {
      setGroupToDelete(null);
      void queryClient.invalidateQueries({ queryKey: utilizatoriQueryKeys.all });
      toast.success("Grupul a fost șters.");
    },
  });
  const filteredGroups = useMemo(() => groupsQuery.data?.filter((group) => group.name.toLocaleLowerCase("ro-RO").includes(search.trim().toLocaleLowerCase("ro-RO"))) ?? [], [groupsQuery.data, search]);

  const queryPending = groupsQuery.isPending || applicationsQuery.isPending;
  const queryError = groupsQuery.error ?? applicationsQuery.error;
  if (queryPending || groupsQuery.isError || applicationsQuery.isError) {
    return (
      <QueryApplicationState
        error={queryError}
        errorDescription="Datele pentru grupuri nu au putut fi încărcate."
        errorTitle="Grupurile nu sunt disponibile"
        loading={queryPending}
        loadingDescription="Se încarcă grupurile și accesul la aplicații."
        loadingTitle="Se încarcă grupurile"
        onRetry={() => {
          void groupsQuery.refetch();
          void applicationsQuery.refetch();
        }}
      />
    );
  }
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xl"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Caută grupuri" className="pl-9" onChange={(event) => { const value = event.currentTarget.value; setSearch(value); }} placeholder="Caută după numele grupului..." type="search" value={search} /></div>
        <Button className="shrink-0" onClick={() => { setSelectedGroup(null); setDialogOpen(true); }} type="button"><Plus aria-hidden="true" />Adaugă grup</Button>
      </div>
      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <ul>
            {filteredGroups.map((group) => (
              <li
                className="flex items-center gap-4 border-b p-4 last:border-b-0"
                key={group.id}
              >
                <UsersRound aria-hidden="true" className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{group.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {group.applications.length
                      ? group.applications.map((application) => application.name).join(", ")
                      : "Fără aplicații selectate"}{" "}
                    · {group.users.length} utilizatori
                  </p>
                </div>
                <Button
                  aria-label={`Editează grupul ${group.name}`}
                  onClick={() => {
                    setSelectedGroup(group);
                    setDialogOpen(true);
                  }}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  aria-label={`Șterge grupul ${group.name}`}
                  onClick={() => setGroupToDelete(group)}
                  size="icon-sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
          {filteredGroups.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <UsersRound aria-hidden="true" className="size-9 text-muted-foreground" />
              <p className="mt-3 font-medium">Nu am găsit grupuri</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <GrupDialog applications={applicationsQuery.data} error={saveMutation.error} group={selectedGroup} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setSelectedGroup(null); saveMutation.reset(); } }} onSubmit={(values) => saveMutation.mutate(values)} open={dialogOpen} pending={saveMutation.isPending} />
      <AlertDialog
        onOpenChange={(open) => !open && setGroupToDelete(null)}
        open={Boolean(groupToDelete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi grupul?</AlertDialogTitle>
            <AlertDialogDescription>
              Grupul „{groupToDelete?.name}” va fi eliminat. Utilizatorii nu vor mai primi
              accesul acordat prin acest grup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => groupToDelete && deleteMutation.mutate(groupToDelete.id)}
              variant="destructive"
            >
              {deleteMutation.isPending ? "Se șterge…" : "Șterge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
