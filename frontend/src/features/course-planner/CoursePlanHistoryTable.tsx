import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  FileCode,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { ApiError } from "@/api/http";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  coursePlannerHistoryQueryKey,
  downloadCoursePlanFile,
  fetchCoursePlanHistory,
} from "./api";
import type {
  CoursePlanFileType,
  CoursePlanGeneration,
} from "./types";

const pageSize = 25;
const monthNames = [
  "Ian",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Iun",
  "Iul",
  "Aug",
  "Sep",
  "Oct",
  "Noi",
  "Dec",
] as const;

const fileLabels: Record<CoursePlanFileType, string> = {
  excel: "Excel",
  word: "Word",
  xml: "XML",
};

const fileIcons = {
  excel: FileSpreadsheet,
  word: FileText,
  xml: FileCode,
} as const;

type DownloadRequest = {
  generationId: string;
  fileType: CoursePlanFileType;
  filename: string;
};

function getErrorMessage(error: Error | null): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Istoricul nu a putut fi încărcat.";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMonths(months: number[]): string {
  return months
    .map((month) => monthNames[month - 1])
    .filter(Boolean)
    .join(", ");
}

function FileDownloadButton({
  generation,
  fileType,
  onDownload,
  pending,
}: {
  generation: CoursePlanGeneration;
  fileType: CoursePlanFileType;
  onDownload: (request: DownloadRequest) => void;
  pending: boolean;
}) {
  const file = generation.files[fileType];
  const Icon = fileIcons[fileType];
  const label = fileLabels[fileType];
  const filename = file.filename ?? `planificare_cursuri_${generation.year}.${fileType}`;

  return (
    <Button
      aria-label={
        file.available
          ? `Descarcă fișierul ${label}`
          : `Fișierul ${label} nu este disponibil`
      }
      disabled={!file.available || pending}
      onClick={() =>
        onDownload({
          generationId: generation.id,
          fileType,
          filename,
        })
      }
      size="icon-sm"
      title={
        file.available
          ? `Descarcă ${label}`
          : `${label} va deveni disponibil după integrarea generatorului.`
      }
      type="button"
      variant="outline"
    >
      {pending ? <Spinner /> : <Icon aria-hidden="true" />}
    </Button>
  );
}

export function CoursePlanHistoryTable() {
  const [page, setPage] = useState(1);
  const historyQuery = useQuery({
    queryKey: [...coursePlannerHistoryQueryKey, page],
    queryFn: () => fetchCoursePlanHistory(page),
  });
  const downloadMutation = useMutation({
    mutationFn: (request: DownloadRequest) =>
      downloadCoursePlanFile({
        generationId: request.generationId,
        fileType: request.fileType,
      }),
    onSuccess: (blob, request) => saveBlob(blob, request.filename),
  });

  const pageCount = Math.max(
    1,
    Math.ceil((historyQuery.data?.count ?? 0) / pageSize),
  );
  const error =
    getErrorMessage(historyQuery.error) ??
    getErrorMessage(downloadMutation.error);

  return (
    <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-7 lg:p-9">
      <header>
        <p className="text-sm font-medium text-primary">Planificator cursuri</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Istoric generări
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Fiecare planificare reușită este păstrată împreună cu fișierele generate.
        </p>
      </header>

      {error ? (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="min-w-0 overflow-hidden rounded-sm border bg-background shadow-sm">
        {historyQuery.isPending ? (
          <div className="flex min-h-64 items-center justify-center" aria-live="polite">
            <Spinner className="size-7 text-primary" />
          </div>
        ) : historyQuery.data?.results.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-sm">
              <thead className="bg-muted/70 text-left">
                <tr>
                  <th className="border-b px-4 py-3 font-medium">Generat la</th>
                  <th className="border-b px-4 py-3 font-medium">Fișier sursă</th>
                  <th className="border-b px-4 py-3 font-medium">An</th>
                  <th className="border-b px-4 py-3 font-medium">Luni</th>
                  <th className="border-b px-4 py-3 text-right font-medium">Cursuri</th>
                  <th className="border-b px-4 py-3 font-medium">Generat de</th>
                  <th className="border-b px-4 py-3 text-right font-medium">Fișiere</th>
                </tr>
              </thead>
              <tbody>
                {historyQuery.data.results.map((generation) => (
                  <tr className="odd:bg-background even:bg-muted/25" key={generation.id}>
                    <td className="whitespace-nowrap border-b px-4 py-3">
                      {formatCreatedAt(generation.created_at)}
                    </td>
                    <td className="max-w-80 truncate border-b px-4 py-3 font-medium" title={generation.source_filename}>
                      {generation.source_filename}
                    </td>
                    <td className="border-b px-4 py-3">{generation.year}</td>
                    <td className="border-b px-4 py-3">
                      {formatMonths(generation.months)}
                    </td>
                    <td className="border-b px-4 py-3 text-right tabular-nums">
                      {generation.course_count}
                    </td>
                    <td className="border-b px-4 py-3">
                      {generation.created_by ?? "Utilizator șters"}
                    </td>
                    <td className="border-b px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {(["excel", "word", "xml"] as const).map((fileType) => (
                          <FileDownloadButton
                            fileType={fileType}
                            generation={generation}
                            key={fileType}
                            onDownload={(request) => downloadMutation.mutate(request)}
                            pending={
                              downloadMutation.isPending &&
                              downloadMutation.variables?.generationId === generation.id &&
                              downloadMutation.variables?.fileType === fileType
                            }
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <FileSpreadsheet aria-hidden="true" className="size-8 text-muted-foreground" />
            <h2 className="mt-3 font-medium">Nu există generări salvate</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Prima planificare generată va apărea automat în acest tabel.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {historyQuery.data?.count ?? 0} generări · pagina {page} din {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            disabled={page <= 1 || historyQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" />
            Anterior
          </Button>
          <Button
            disabled={page >= pageCount || historyQuery.isFetching}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            size="sm"
            type="button"
            variant="outline"
          >
            Următor
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
