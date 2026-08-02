import { useEffect, useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import type {
  AplicatieAcces,
  GrupAplicatii,
  Utilizator,
  UtilizatorFormValues,
  UtilizatorWrite,
} from "./types";

const emptyValues: UtilizatorFormValues = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  is_active: true,
  is_staff: false,
  group_ids: [],
  direct_application_ids: [],
};

function valuesForUser(user: Utilizator | null): UtilizatorFormValues {
  if (!user) {
    return emptyValues;
  }
  return {
    username: user.username ?? "",
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    password: "",
    is_active: user.is_active ?? false,
    is_staff: user.is_staff ?? false,
    group_ids: user.groups.map((group) => group.id),
    direct_application_ids: user.direct_applications.map((application) => application.id),
  };
}

export function UtilizatorForm({
  canManageStaff,
  onCancel,
  onSubmit,
  pending,
  groups,
  applications,
  user,
}: {
  canManageStaff: boolean;
  onCancel: () => void;
  onSubmit: (values: UtilizatorWrite) => void;
  pending: boolean;
  groups: GrupAplicatii[];
  applications: AplicatieAcces[];
  user: Utilizator | null;
}) {
  const [values, setValues] = useState<UtilizatorFormValues>(emptyValues);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const editing = Boolean(user);

  useEffect(() => {
    setValues(valuesForUser(user));
    setLocalErrors({});
  }, [user]);

  function setValue<Key extends keyof UtilizatorFormValues>(
    field: Key,
    value: UtilizatorFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.username.trim()) {
      nextErrors.username = "Numele de utilizator este obligatoriu.";
    }
    if (!editing && !values.password) {
      nextErrors.password = "Parola este obligatorie.";
    }
    setLocalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: UtilizatorWrite = {
      username: values.username.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      is_active: values.is_active,
      is_staff: values.is_staff,
    };
    if (!user?.is_superuser) {
      payload.group_ids = values.group_ids;
      payload.direct_application_ids = values.direct_application_ids;
    }
    if (values.password) {
      payload.password = values.password;
    }
    onSubmit(payload);
  }

  const usernameError = localErrors.username;
  const passwordError = localErrors.password;
  const isSuperuser = Boolean(user?.is_superuser);
  const inheritedApplications = [
    ...new Map(
      groups
        .filter((group) => values.group_ids.includes(group.id))
        .flatMap((group) => group.applications.map((application) => [application.id, application])),
    ).values(),
  ];

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <form className="grid w-full gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(usernameError)}>
            <FieldLabel htmlFor="utilizator-username">Nume de utilizator</FieldLabel>
            <Input
              aria-invalid={Boolean(usernameError)}
              autoComplete="off"
              disabled={pending}
              id="utilizator-username"
              maxLength={150}
              onChange={(event) => setValue("username", event.currentTarget.value)}
              value={values.username}
            />
            <FieldError>{usernameError}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="utilizator-email">E-mail</FieldLabel>
            <Input
              autoComplete="off"
              disabled={pending}
              id="utilizator-email"
              onChange={(event) => setValue("email", event.currentTarget.value)}
              type="email"
              value={values.email}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="utilizator-first-name">Prenume</FieldLabel>
            <Input
              disabled={pending}
              id="utilizator-first-name"
              maxLength={150}
              onChange={(event) => setValue("first_name", event.currentTarget.value)}
              value={values.first_name}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="utilizator-last-name">Nume</FieldLabel>
            <Input
              disabled={pending}
              id="utilizator-last-name"
              maxLength={150}
              onChange={(event) => setValue("last_name", event.currentTarget.value)}
              value={values.last_name}
            />
          </Field>
        </div>

        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="utilizator-password">
            {editing ? "Parolă nouă" : "Parolă inițială"}
          </FieldLabel>
          <Input
            aria-invalid={Boolean(passwordError)}
            autoComplete="new-password"
            disabled={pending}
            id="utilizator-password"
            onChange={(event) => setValue("password", event.currentTarget.value)}
            type="password"
            value={values.password}
          />
          <FieldDescription>
            {editing
              ? "Lasă câmpul gol pentru a păstra parola actuală."
              : "Parola trebuie să respecte regulile de securitate Django."}
          </FieldDescription>
          <FieldError>{passwordError}</FieldError>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Cont activ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conturile inactive nu se pot autentifica.
              </p>
            </div>
            <Switch
              checked={values.is_active}
              className="cursor-pointer"
              disabled={pending}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Administrator</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Oferă acces la secțiunile administrative.
              </p>
            </div>
            <Switch
              checked={values.is_staff}
              className="cursor-pointer"
              disabled={pending || !canManageStaff || user?.is_superuser}
              onCheckedChange={(checked) => setValue("is_staff", checked)}
            />
          </div>
        </div>

        {isSuperuser ? (
          <Field>
            <FieldLabel>Acces aplicații</FieldLabel>
            <Alert>
              <AlertDescription>
                Acces complet — superutilizatorii au acces la toate aplicațiile.
              </AlertDescription>
            </Alert>
            <ul className="flex min-h-10 flex-wrap gap-2 rounded-md border p-3 text-sm">
              {user?.effective_applications.map((application) => (
                <li className="rounded-md bg-muted px-2 py-1" key={application.id}>
                  {application.name}
                </li>
              ))}
            </ul>
          </Field>
        ) : (
          <>
            <Field>
              <FieldLabel>Grupuri</FieldLabel>
              <FieldDescription>
                Accesul la aplicații se cumulează între grupurile selectate.
              </FieldDescription>
              <ul className="grid max-h-44 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                {groups.map((group) => {
                  const checked = values.group_ids.includes(group.id);
                  return (
                    <li key={group.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          disabled={pending}
                          onCheckedChange={(nextChecked) =>
                            setValue(
                              "group_ids",
                              nextChecked
                                ? [...values.group_ids, group.id]
                                : values.group_ids.filter((groupId) => groupId !== group.id),
                            )
                          }
                        />
                        {group.name}
                      </label>
                    </li>
                  );
                })}
                {groups.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nu există grupuri create.</li>
                ) : null}
              </ul>
            </Field>

            <Field>
              <FieldLabel>Acces moștenit din grupuri</FieldLabel>
              <FieldDescription>
                Aplicațiile de mai jos sunt acordate de grupurile selectate și nu pot fi retrase din
                acest formular.
              </FieldDescription>
              <ul className="flex min-h-10 flex-wrap gap-2 rounded-md border p-3 text-sm">
                {inheritedApplications.length ? (
                  inheritedApplications.map((application) => (
                    <li className="rounded-md bg-muted px-2 py-1" key={application.id}>
                      {application.name}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">Niciun acces moștenit.</li>
                )}
              </ul>
            </Field>

            <Field>
              <FieldLabel>Acces direct la aplicații</FieldLabel>
              <FieldDescription>Acest acces se adaugă celui moștenit din grupuri.</FieldDescription>
              <ul className="grid max-h-44 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                {applications.map((application) => {
                  const checked = values.direct_application_ids.includes(application.id);
                  return (
                    <li key={application.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          disabled={pending}
                          onCheckedChange={(nextChecked) =>
                            setValue(
                              "direct_application_ids",
                              nextChecked
                                ? [...values.direct_application_ids, application.id]
                                : values.direct_application_ids.filter(
                                    (applicationId) => applicationId !== application.id,
                                  ),
                            )
                          }
                        />
                        {application.name}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Field>
          </>
        )}

        <DialogFooter className="mx-0 mb-0">
          <Button disabled={pending} onClick={onCancel} type="button" variant="outline">
            Anulează
          </Button>
          <Button disabled={pending} type="submit">
            {pending ? "Se salvează…" : editing ? "Salvează modificările" : "Creează contul"}
          </Button>
        </DialogFooter>
      </form>
    </section>
  );
}
