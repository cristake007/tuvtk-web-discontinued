import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { ApiError } from "@/api/http";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { login } from "@/features/auth/api";
import { authQueryKeys } from "@/features/auth/queryKeys";
import {
  fetchPublicBranding,
  publicBrandingQueryKey,
} from "@/features/branding/api";
import type { PublicBranding } from "@/features/branding/types";

const fallbackBranding: PublicBranding = {
  site_name: "TUVTK",
  organization_name: "TÜV Thüringen Karpat",
  logo_url: null,
};

function BrandMark({
  branding,
  compact = false,
}: {
  branding: PublicBranding;
  compact?: boolean;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [branding.logo_url]);

  const showLogo = Boolean(branding.logo_url) && !logoFailed;

  return (
    <div
      className={
        compact
          ? "flex min-h-16 items-center"
          : "flex min-h-44 w-full items-center justify-center bg-white px-10 py-8 shadow-2xl shadow-black/15"
      }
    >
      {showLogo ? (
        <img
          alt={`${branding.organization_name} logo`}
          className={
            compact
              ? "max-h-14 max-w-64 object-contain object-left"
              : "max-h-28 max-w-full object-contain"
          }
          onError={() => setLogoFailed(true)}
          src={branding.logo_url ?? undefined}
        />
      ) : (
        <span
          className={
            compact
              ? "text-2xl font-bold tracking-tight text-primary"
              : "text-4xl font-bold tracking-tight text-primary"
          }
        >
          {branding.site_name}
        </span>
      )}
    </div>
  );
}

export function LoginPage() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const brandingQuery = useQuery({
    queryKey: publicBrandingQueryKey,
    queryFn: fetchPublicBranding,
    retry: 1,
    staleTime: 5 * 60_000,
  });

  const branding = brandingQuery.data ?? fallbackBranding;

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: ["core-bootstrap"] });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  }

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Sign in failed. Verify your credentials and try again."
        : null;

  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(24rem,0.82fr)_minmax(34rem,1.18fr)]">
      <aside className="relative hidden min-h-svh overflow-hidden bg-primary text-primary-foreground lg:flex">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-red" />
        <div className="absolute -top-48 -right-48 size-[34rem] rounded-full border border-white/10" />
        <div className="absolute -top-28 -right-28 size-[24rem] rounded-full border border-white/10" />
        <div className="absolute right-16 bottom-20 h-px w-44 bg-white/15" />
        <div className="absolute right-16 bottom-20 h-20 w-px bg-white/15" />

        <div className="relative z-10 flex w-full flex-col px-12 py-10 xl:px-16 xl:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/60">
            Internal workspace
          </p>

          <div className="flex flex-1 items-center">
            <div className="w-full max-w-xl">
              <BrandMark branding={branding} />
              <div className="mt-7 border-l-2 border-brand-red pl-5">
                <p className="text-xl font-semibold tracking-tight">
                  {branding.organization_name}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/65">
                  {branding.site_name}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary-foreground/45">
            Authorized access only
          </p>
        </div>
      </aside>

      <section className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark branding={branding} compact />
            <p className="mt-4 text-sm font-medium text-foreground">
              {branding.organization_name}
            </p>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">{branding.site_name}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use your company account to access the internal workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  aria-invalid={loginMutation.isError}
                  autoComplete="username"
                  autoFocus
                  className="h-11"
                  disabled={loginMutation.isPending}
                  id="username"
                  name="username"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  type="text"
                  value={username}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={loginMutation.isError}
                    autoComplete="current-password"
                    className="h-11 pr-11"
                    disabled={loginMutation.isPending}
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    aria-pressed={passwordVisible}
                    className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    disabled={loginMutation.isPending}
                    onClick={() => setPasswordVisible((current) => !current)}
                    type="button"
                  >
                    {passwordVisible ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </button>
                </div>
              </Field>

              {errorMessage ? (
                <Alert aria-live="polite" variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                className="h-11 w-full cursor-pointer"
                disabled={loginMutation.isPending}
                type="submit"
              >
                {loginMutation.isPending ? (
                  <Spinner />
                ) : (
                  <LockKeyhole aria-hidden="true" />
                )}
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            Access is restricted to authorized company accounts.
          </p>
        </div>
      </section>
    </main>
  );
}
