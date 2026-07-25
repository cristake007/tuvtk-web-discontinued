import { useEffect, useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { formatApiError, getApiFieldError } from "@/lib/api-errors";

import type { Utilizator, UtilizatorFormValues, UtilizatorWrite } from "./types";

const emptyValues: UtilizatorFormValues = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  is_active: true,
  is_staff: false,
};

function valuesForUser(user: Utilizator | null): UtilizatorFormValues {
  if (!user) {
    return emptyValues;
  }
  return {
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: "",
    is_active: user.is_active,
    is_staff: user.is_staff,
  };
}

export function UtilizatorDialog({
  canManageStaff,
  error,
  onOpenChange,
  onSubmit,
  open,
  pending,
  user,
}: {
  canManageStaff: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UtilizatorWrite) => void;
  open: boolean;
  pending: boolean;
  user: Utilizator | null;
}) {
  const [values, setValues] = useState<UtilizatorFormValues>(emptyValues);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const editing = Boolean(user);

  useEffect(() => {
    if (open) {
      setValues(valuesForUser(user));
      setLocalErrors({});
    }
  }, [open, user]);

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
    if (values.password) {
      payload.password = values.password;
    }
    onSubmit(payload);
  }

  const usernameError = localErrors.username ?? getApiFieldError(error, "username");
  const passwordError = localErrors.password ?? getApiFieldError(error, "password");

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editează utilizatorul" : "Adaugă utilizator"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Actualizează datele contului, starea și accesul administrativ."
              : "Creează un cont nou pentru accesul la platformă."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {formatApiError(error, "Contul nu a putut fi salvat.")}
              </AlertDescription>
            </Alert>
          ) : null}

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
              <FieldError>{getApiFieldError(error, "email")}</FieldError>
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
              <FieldError>{getApiFieldError(error, "first_name")}</FieldError>
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
              <FieldError>{getApiFieldError(error, "last_name")}</FieldError>
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

          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Anulează
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? <Spinner /> : null}
              {pending ? "Se salvează…" : editing ? "Salvează modificările" : "Creează contul"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
