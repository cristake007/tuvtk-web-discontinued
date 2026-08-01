import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileSearch, RefreshCcw, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { FileUploadField } from "@/components/FileUploadField";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { WorkflowEmptyState } from "@/components/WorkflowEmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { SectionTitle } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiError } from "@/lib/api-errors";

import {
  connectWordPress,
  fetchConnectionSettings,
  fetchCurrentCourseDates,
  previewCourseDates,
  updateCourseRow,
  updateWordpressSettingsQueryKey,
} from "./api";
import type { SafeCourseDateRow, WordPressCredentials } from "./types";

type RowState = {
  existingValidDates: string[];
  finalDates: string[];
  phase: "idle" | "verifying" | "verified" | "updating" | "updated" | "error";
  message: string | null;
};

function initialRowState(row: SafeCourseDateRow): RowState {
  return {
    existingValidDates: row.existing_valid_dates,
    finalDates: row.final_dates,
    phase: "idle",
    message: row.error,
  };
}

export function UpdateWordPressPanel() {
  const settingsQuery = useQuery({
    queryKey: updateWordpressSettingsQueryKey,
    queryFn: fetchConnectionSettings,
    staleTime: 60_000,
  });

  const [credentials, setCredentials] = useState<WordPressCredentials>({
    wpBaseUrl: "",
    wpUsername: "",
    wpAppPassword: "",
  });
  const [connected, setConnected] = useState<string | null>(null);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [rows, setRows] = useState<SafeCourseDateRow[] | null>(null);
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({});

  useEffect(() => {
    if (settingsQuery.data) {
      setCredentials((current) => ({
        ...current,
        wpBaseUrl: settingsQuery.data.wp_base_url,
        wpUsername: settingsQuery.data.wp_username,
      }));
    }
  }, [settingsQuery.data]);

  const connectMutation = useMutation({
    mutationFn: connectWordPress,
    onError: (error) => {
      setConnected(null);
      toast.error("Conectarea la WordPress a eșuat", {
        description: formatApiError(error, "Verifică adresa, utilizatorul și parola aplicației."),
      });
    },
    onSuccess: (response) => {
      setConnected(response.user_name);
      toast.success(`Conectat la WordPress ca ${response.user_name}.`);
    },
  });

  const previewMutation = useMutation({
    mutationFn: previewCourseDates,
    onError: (error) =>
      toast.error("Previzualizarea nu a putut fi construită", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (response) => {
      setRows(response.rows);
      setRowStates(
        Object.fromEntries(response.rows.map((row) => [row.row_index, initialRowState(row)])),
      );
    },
  });

  function updateRowState(rowIndex: number, patch: Partial<RowState>) {
    setRowStates((current) => ({
      ...current,
      [rowIndex]: { ...current[rowIndex], ...patch },
    }));
  }

  async function handleVerify(row: SafeCourseDateRow) {
    updateRowState(row.row_index, { phase: "verifying", message: null });
    try {
      const response = await fetchCurrentCourseDates({
        credentials,
        permalink: row.permalink,
        slug: row.slug,
        postId: row.post_id,
        excelDates: row.excel_dates,
      });
      if (response.post_id === null) {
        updateRowState(row.row_index, {
          phase: "error",
          message: "Cursul nu a fost găsit pe WordPress.",
        });
        return;
      }
      updateRowState(row.row_index, {
        phase: "verified",
        existingValidDates: response.existing_valid_dates ?? [],
        finalDates: response.final_dates ?? row.final_dates,
        message: null,
      });
    } catch (error) {
      updateRowState(row.row_index, {
        phase: "error",
        message: formatApiError(error, "Verificarea a eșuat."),
      });
    }
  }

  async function handleUpdate(row: SafeCourseDateRow) {
    const state = rowStates[row.row_index];
    updateRowState(row.row_index, { phase: "updating", message: null });
    try {
      const response = await updateCourseRow({
        credentials,
        permalink: row.permalink,
        slug: row.slug,
        postId: row.post_id,
        finalDates: state?.finalDates ?? row.final_dates,
      });
      updateRowState(row.row_index, {
        phase: "updated",
        message:
          response.status === "no changes"
            ? "Nu au fost necesare modificări."
            : "Datele au fost actualizate pe WordPress.",
      });
    } catch (error) {
      updateRowState(row.row_index, {
        phase: "error",
        message: formatApiError(error, "Actualizarea a eșuat."),
      });
    }
  }

  function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentials.wpBaseUrl || !credentials.wpUsername || !credentials.wpAppPassword) {
      toast.warning("Completează adresa, utilizatorul și parola aplicației WordPress.");
      return;
    }
    connectMutation.mutate(credentials);
  }

  function handlePreviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputFile) {
      toast.warning("Selectează fișierul cu datele cursurilor.");
      return;
    }
    setRows(null);
    previewMutation.mutate(inputFile);
  }

  const hasCredentials = Boolean(
    credentials.wpBaseUrl && credentials.wpUsername && credentials.wpAppPassword,
  );

  if (settingsQuery.isPending || settingsQuery.isError) {
    return (
      <QueryApplicationState
        error={settingsQuery.error}
        errorDescription="Setările conexiunii WordPress nu au putut fi încărcate."
        errorTitle="Update WordPress nu este disponibil"
        loading={settingsQuery.isPending}
        loadingDescription="Se încarcă setările conexiunii WordPress."
        loadingTitle="Se încarcă Update WordPress"
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <AntetAplicatie titlu="Update WordPress" />

      <section className="grid w-full gap-6 rounded-sm border bg-background p-6 shadow-sm">
        <div>
          <SectionTitle>Conexiune WordPress</SectionTitle>
          <p className="mt-1 text-base leading-6 text-muted-foreground">
            Conectează-te folosind o parolă de aplicație WordPress. Parola nu este salvată pe
            server, doar adresa și utilizatorul.
          </p>
        </div>

        {connected ? (
          <Alert>
            <CheckCircle2 aria-hidden="true" className="size-4" />
            <AlertDescription>Conectat ca {connected}.</AlertDescription>
          </Alert>
        ) : null}

        <form className="grid gap-5" noValidate onSubmit={handleConnect}>
          <Field>
            <FieldLabel htmlFor="wp-base-url">Adresa site-ului WordPress</FieldLabel>
            <Input
              disabled={connectMutation.isPending}
              id="wp-base-url"
              onChange={(event) =>
                setCredentials((current) => ({ ...current, wpBaseUrl: event.target.value }))
              }
              placeholder="https://exemplu.ro"
              type="url"
              value={credentials.wpBaseUrl}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="wp-username">Utilizator</FieldLabel>
              <Input
                autoComplete="username"
                disabled={connectMutation.isPending}
                id="wp-username"
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, wpUsername: event.target.value }))
                }
                value={credentials.wpUsername}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="wp-app-password">Parolă de aplicație</FieldLabel>
              <Input
                autoComplete="off"
                disabled={connectMutation.isPending}
                id="wp-app-password"
                onChange={(event) =>
                  setCredentials((current) => ({
                    ...current,
                    wpAppPassword: event.target.value,
                  }))
                }
                type="password"
                value={credentials.wpAppPassword}
              />
              <FieldDescription>Generată din contul de utilizator WordPress.</FieldDescription>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button disabled={connectMutation.isPending} type="submit">
              {connectMutation.isPending ? "Se conectează…" : "Conectează"}
            </Button>
          </div>
        </form>
      </section>

      <section className="grid w-full gap-6 rounded-sm border bg-background p-6 shadow-sm">
        <div>
          <SectionTitle>
            Previzualizează datele cursurilor
          </SectionTitle>
          <p className="mt-1 text-base leading-6 text-muted-foreground">
            Încarcă un fișier cu coloanele Title, Permalink și coloane de lună
            (January–December) pentru a vedea perioadele propuse înainte de actualizare.
          </p>
        </div>

        <form className="grid gap-6" noValidate onSubmit={handlePreviewSubmit}>
          <FileUploadField
            accept=".csv,.xlsx,.xls"
            description="Coloane obligatorii: Title și Permalink, plus cel puțin o coloană de lună."
            disabled={previewMutation.isPending}
            emptyDescription="Trage fișierul aici sau apasă pentru a-l selecta."
            emptyTitle="Încarcă fișierul cu datele cursurilor"
            file={inputFile}
            icon={Upload}
            id="update-wordpress-input-file"
            label="Fișier cu datele cursurilor"
            onFileChange={(file) => setInputFile(file ?? null)}
          />

          <div className="flex justify-end">
            <Button disabled={previewMutation.isPending} type="submit">
              {previewMutation.isPending ? "Se previzualizează…" : "Previzualizează"}
            </Button>
          </div>
        </form>
      </section>

      {rows ? (
        <section className="grid min-w-0 gap-4 rounded-sm border bg-background p-6 shadow-sm">
          <div>
            <SectionTitle>Rezultatul previzualizării</SectionTitle>
            <p className="mt-1 text-base leading-6 text-muted-foreground">
              {rows.length === 0
                ? "Fișierul a fost procesat, dar nu conține cursuri care pot fi actualizate."
                : hasCredentials
                ? "Verifică perioadele curente de pe WordPress, apoi actualizează cursurile dorite."
                : "Conectează-te la WordPress mai sus pentru a putea verifica și actualiza cursurile."}
            </p>
          </div>

          {rows.length ? (
            <div className="min-w-0 overflow-hidden rounded-sm border">
              <Table className="min-w-[54rem]">
              <TableHeader className="bg-muted/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Curs</TableHead>
                  <TableHead>Zile din fișier</TableHead>
                  <TableHead>Zile propuse</TableHead>
                  <TableHead>Stare</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const state = rowStates[row.row_index];
                  const busy = state?.phase === "verifying" || state?.phase === "updating";
                  return (
                    <TableRow className="even:bg-muted/25" key={row.row_index}>
                      <TableCell className="max-w-56 truncate font-medium" title={row.title}>
                        {row.title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.excel_dates.length ? row.excel_dates.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(state?.finalDates ?? row.final_dates).length
                          ? (state?.finalDates ?? row.final_dates).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {row.status === "error" ? (
                          <Badge variant="destructive">
                            <XCircle aria-hidden="true" className="size-3" />
                            {row.error}
                          </Badge>
                        ) : state?.phase === "updated" ? (
                          <Badge variant="secondary">
                            <CheckCircle2 aria-hidden="true" className="size-3" />
                            {state.message}
                          </Badge>
                        ) : state?.phase === "error" ? (
                          <Badge variant="destructive">
                            <XCircle aria-hidden="true" className="size-3" />
                            {state.message}
                          </Badge>
                        ) : state?.phase === "verified" ? (
                          <Badge variant="outline">Verificat</Badge>
                        ) : (
                          <Badge variant="outline">Pregătit</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            disabled={!hasCredentials || !row.can_update || busy}
                            onClick={() => void handleVerify(row)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <RefreshCcw aria-hidden="true" className="size-3.5" />
                            {state?.phase === "verifying" ? "Se verifică…" : "Verifică"}
                          </Button>
                          <Button
                            disabled={!hasCredentials || !row.can_update || busy}
                            onClick={() => void handleUpdate(row)}
                            size="sm"
                            type="button"
                          >
                            {state?.phase === "updating" ? "Se actualizează…" : "Actualizează"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            </div>
          ) : (
            <WorkflowEmptyState
              description="Verifică structura fișierului și încearcă din nou cu un fișier care conține cursuri și perioade."
              icon={FileSearch}
              title="Niciun curs disponibil pentru actualizare"
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
