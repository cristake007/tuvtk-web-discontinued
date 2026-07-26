import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { coreBootstrapQueryKey } from "@/api/core";
import { ApiError } from "@/api/http";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { login } from "./api";
import {
  type LoginCredentials,
  type LoginField,
  type LoginFieldErrors,
  validateLoginCredentials,
} from "./loginValidation";

function getLoginError(error: Error | null): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiError && error.status === 401) {
    return "Numele de utilizator sau parola nu sunt corecte.";
  }

  if (error instanceof ApiError && error.status === 429) {
    return "Au fost prea multe încercări nereușite. Încearcă din nou peste câteva minute.";
  }

  if (error instanceof ApiError && error.status === 403) {
    return "Sesiunea de securitate a expirat. Reîncarcă pagina și încearcă din nou.";
  }

  return "Autentificarea nu a putut fi finalizată. Încearcă din nou.";
}

export function LoginForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [passwordVisible, setPasswordVisible] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== coreBootstrapQueryKey[0],
      });
      await queryClient.resetQueries({ queryKey: coreBootstrapQueryKey });
      navigate("/tablou-de-bord", { replace: true });
    },
  });

  function setFieldValue(field: LoginField, value: string) {
    const nextCredentials = { ...credentials, [field]: value };
    setCredentials(nextCredentials);

    if (fieldErrors[field]) {
      const nextError = validateLoginCredentials(nextCredentials)[field];
      setFieldErrors((current) => {
        const updated = { ...current };
        if (nextError) {
          updated[field] = nextError;
        } else {
          delete updated[field];
        }
        return updated;
      });
    }

    if (loginMutation.isError) {
      loginMutation.reset();
    }
  }

  function validateField(field: LoginField) {
    const nextError = validateLoginCredentials(credentials)[field];
    setFieldErrors((current) => {
      const updated = { ...current };
      if (nextError) {
        updated[field] = nextError;
      } else {
        delete updated[field];
      }
      return updated;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedCredentials = {
      username: credentials.username.trim(),
      password: credentials.password,
    };
    const nextErrors = validateLoginCredentials(normalizedCredentials);
    setFieldErrors(nextErrors);

    if (nextErrors.username) {
      usernameRef.current?.focus();
      return;
    }

    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    loginMutation.mutate(normalizedCredentials);
  }

  const serverError = getLoginError(loginMutation.error);

  return (
    <div className="w-full max-w-[20rem]">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Autentificare
        </h1>
        <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
          Introdu datele contului tău pentru a continua.
        </p>
      </div>

      <form aria-busy={loginMutation.isPending} noValidate onSubmit={handleSubmit}>
        <FieldGroup className="gap-3.5">
          <Field data-invalid={Boolean(fieldErrors.username)}>
            <FieldLabel className="text-xs" htmlFor="username">
              Nume de utilizator
            </FieldLabel>
            <Input
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
              aria-invalid={Boolean(fieldErrors.username)}
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
              className="h-10 rounded-sm text-sm"
              disabled={loginMutation.isPending}
              id="username"
              maxLength={150}
              name="username"
              onBlur={() => validateField("username")}
              onChange={(event) => setFieldValue("username", event.target.value)}
              ref={usernameRef}
              spellCheck={false}
              type="text"
              value={credentials.username}
            />
            <FieldError className="text-xs" id="username-error">
              {fieldErrors.username}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.password)}>
            <FieldLabel className="text-xs" htmlFor="password">
              Parolă
            </FieldLabel>
            <div className="relative">
              <Input
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                aria-invalid={Boolean(fieldErrors.password)}
                autoComplete="current-password"
                className="h-10 rounded-sm pr-10 text-sm"
                disabled={loginMutation.isPending}
                id="password"
                name="password"
                onBlur={() => validateField("password")}
                onChange={(event) => setFieldValue("password", event.target.value)}
                ref={passwordRef}
                type={passwordVisible ? "text" : "password"}
                value={credentials.password}
              />
              <button
                aria-label={passwordVisible ? "Ascunde parola" : "Afișează parola"}
                aria-pressed={passwordVisible}
                className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                disabled={loginMutation.isPending}
                onClick={() => setPasswordVisible((current) => !current)}
                type="button"
              >
                {passwordVisible ? (
                  <EyeOff aria-hidden="true" className="size-3.5" />
                ) : (
                  <Eye aria-hidden="true" className="size-3.5" />
                )}
              </button>
            </div>
            <FieldError className="text-xs" id="password-error">
              {fieldErrors.password}
            </FieldError>
          </Field>

          {serverError ? (
            <Alert aria-live="polite" className="py-2.5" variant="destructive">
              <AlertDescription className="text-xs leading-5">
                {serverError}
              </AlertDescription>
            </Alert>
          ) : null}

          <Button
            className="h-10 w-full cursor-pointer rounded-sm text-sm font-medium"
            disabled={loginMutation.isPending}
            type="submit"
          >
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            {loginMutation.isPending ? "Se autentifică…" : "Autentificare"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
