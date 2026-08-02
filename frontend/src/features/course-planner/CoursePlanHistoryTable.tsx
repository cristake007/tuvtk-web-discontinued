import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileCode, FileSpreadsheet, FileText } from "lucide-react";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { ContentEmptyState } from "@/components/ContentEmptyState";
import { QueryApplicationState } from "@/components/QueryApplicationState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { saveBlob } from "@/lib/download";
import { cn } from "@/lib/utils";

import {
  coursePlannerHistoryQueryKey,
  downloadCoursePlanFile,
  fetchCoursePlanHistory,
} from "./api";
import type { CoursePlanFileType, CoursePlanGeneration } from "./types";

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
        file.available ? `Descarcă fișierul ${label}` : `Fișierul ${label} nu este disponibil`
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
      <Icon aria-hidden="true" />
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

  const pageCount = Math.max(1, Math.ceil((historyQuery.data?.count ?? 0) / pageSize));
  const previousDisabled = page <= 1 || historyQuery.isFetching;
  const nextDisabled = page >= pageCount || historyQuery.isFetching;

  if (historyQuery.isPending || historyQuery.isError) {
    return (
      <QueryApplicationState
        error={historyQuery.error}
        errorDescription="Istoricul generărilor nu a putut fi încărcat."
        errorTitle="Istoricul nu este disponibil"
        loading={historyQuery.isPending}
        loadingDescription="Se încarcă generările și fișierele disponibile."
        loadingTitle="Se încarcă istoricul"
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AntetAplicatie titlu="Istoric generări" />

      {downloadMutation.error ? (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>
            {formatApiError(downloadMutation.error, "Fișierul nu a putut fi descărcat.")}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="min-w-0 overflow-hidden rounded-sm border bg-background shadow-sm">
        {historyQuery.data.results.length ? (
          <Table className="min-w-[58rem]">
            <TableHeader className="bg-muted/70">
              <TableRow className="hover:bg-transparent">
                <TableHead>Generat la</TableHead>
                <TableHead>Fișier sursă</TableHead>
                <TableHead>An</TableHead>
                <TableHead>Luni</TableHead>
                <TableHead className="text-right">Cursuri</TableHead>
                <TableHead>Generat de</TableHead>
                <TableHead className="text-right">Fișiere</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyQuery.data.results.map((generation) => (
                <TableRow className="even:bg-muted/25" key={generation.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatRomanianDateTime(generation.created_at)}
                  </TableCell>
                  <TableCell className="max-w-80 truncate" title={generation.source_filename}>
                    <code className="font-medium">{generation.source_filename}</code>
                  </TableCell>
                  <TableCell>{generation.year}</TableCell>
                  <TableCell>
                    {formatMonths(Array.isArray(generation.months) ? generation.months : [])}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {generation.course_count}
                  </TableCell>
                  <TableCell>{generation.created_by ?? "Utilizator șters"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ContentEmptyState
            className="min-h-64"
            description="Prima planificare generată va apărea automat în acest tabel."
            icon={FileSpreadsheet}
            title="Nu există generări salvate"
          />
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {historyQuery.data?.count ?? 0} generări · pagina {page} din {pageCount}
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
    </div>
  );
}
