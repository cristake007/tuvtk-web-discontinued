import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileSearch, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { textVariants } from "@/components/ui/text";
import { AntetAplicatie } from "@/components/AntetAplicatie";
import { FileUploadField } from "@/components/FileUploadField";
import { WorkflowEmptyState } from "@/components/WorkflowEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/heading";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiError } from "@/lib/api-errors";
import { saveBlob } from "@/lib/download";

import { generateWordMatch, previewWordMatch } from "./api";
import type { WordMatchPreviewResponse } from "./types";

const skipValue = "__skip__";

export function WordMatcherPanel() {
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<WordMatchPreviewResponse | null>(null);
  const [selections, setSelections] = useState<Record<number, number | null>>({});

  const previewMutation = useMutation({
    mutationFn: previewWordMatch,
    onError: (error) =>
      toast.error("Previzualizarea nu a putut fi construită", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (response) => {
      setPreview(response);
      setSelections(
        Object.fromEntries(
          response.rows.map((row) => [row.word_row_index, row.selected_row_index]),
        ),
      );
      toast.success("Previzualizarea a fost generată", {
        description: `${response.matched_count} rânduri potrivite automat, ${response.skipped_count} necesită revizuire.`,
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateWordMatch,
    onError: (error) =>
      toast.error("Documentul Word nu a putut fi generat", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (blob) => {
      saveBlob(blob, "matched_courses.docx");
      toast.success("Documentul Word a fost generat și descărcat.");
    },
  });

  function handlePreviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!wordFile || !scheduleFile) {
      toast.warning("Selectează fișierul Word și fișierul cu programul cursurilor.");
      return;
    }

    setPreview(null);
    previewMutation.mutate({ wordFile, scheduleFile });
  }

  function handleGenerate() {
    if (!preview) {
      return;
    }

    generateMutation.mutate({
      wordFileB64: preview.word_file_b64,
      scheduleOptions: preview.schedule_options,
      matches: Object.entries(selections)
        .filter(([, scheduleRowIndex]) => scheduleRowIndex !== null)
        .map(([wordRowIndex, scheduleRowIndex]) => ({
          word_row_index: Number(wordRowIndex),
          schedule_row_index: scheduleRowIndex as number,
        })),
    });
  }

  const assignedCount = Object.values(selections).filter((value) => value !== null).length;

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <AntetAplicatie titlu="Word Matcher" />

      <section className="grid w-full gap-6 rounded-sm border bg-background p-6 shadow-sm">
        <div>
          <SectionTitle>Potrivește documentul Word cu programul cursurilor</SectionTitle>
          <p
            className={textVariants({
              variant: "corp",
              className: "mt-1 leading-6 text-muted-foreground",
            })}
          >
            Încarcă documentul Word cu programul de tipărit și un fișier cu titluri și coloane de
            lună (January–December). Cursurile vor fi potrivite automat pe baza titlului; poți
            corecta manual orice potrivire înainte de a genera documentul final.
          </p>
        </div>

        <form className="grid gap-6 sm:grid-cols-2" noValidate onSubmit={handlePreviewSubmit}>
          <FileUploadField
            accept=".docx"
            description="Documentul Word care va primi datele cursurilor."
            disabled={previewMutation.isPending}
            emptyDescription="Trage fișierul aici sau apasă pentru a-l selecta."
            emptyTitle="Încarcă documentul Word"
            file={wordFile}
            id="word-matcher-word-file"
            label="Document Word"
            onFileChange={(file) => setWordFile(file ?? null)}
          />

          <FileUploadField
            accept=".csv,.xlsx,.xls"
            description="Coloane obligatorii: Title, plus cel puțin o coloană de lună."
            disabled={previewMutation.isPending}
            emptyDescription="Trage fișierul aici sau apasă pentru a-l selecta."
            emptyTitle="Încarcă programul cursurilor"
            file={scheduleFile}
            id="word-matcher-schedule-file"
            label="Program cursuri"
            onFileChange={(file) => setScheduleFile(file ?? null)}
          />

          <div className="flex justify-end sm:col-span-2">
            <Button disabled={previewMutation.isPending} size="lg" type="submit">
              <FileSearch aria-hidden="true" />
              {previewMutation.isPending ? "Se previzualizează…" : "Previzualizează potrivirile"}
            </Button>
          </div>
        </form>
      </section>

      {preview ? (
        <section className="grid min-w-0 gap-4 rounded-sm border bg-background p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Rezultatul potrivirii</SectionTitle>
              <p
                className={textVariants({
                  variant: "corp",
                  className: "mt-1 leading-6 text-muted-foreground",
                })}
              >
                {preview.rows.length
                  ? `${assignedCount} din ${preview.rows.length} rânduri au o potrivire selectată. Corectează selecțiile de mai jos, apoi generează documentul final.`
                  : "Fișierele au fost procesate, dar nu conțin rânduri care pot fi potrivite."}
              </p>
            </div>
            {preview.rows.length ? (
              <Button
                disabled={generateMutation.isPending || assignedCount === 0}
                onClick={handleGenerate}
                type="button"
              >
                {generateMutation.isPending ? "Se generează…" : "Generează documentul Word"}
              </Button>
            ) : null}
          </div>

          {preview.rows.length ? (
            <div className="min-w-0 overflow-hidden rounded-sm border">
              <Table className="min-w-[46rem]">
                <TableHeader className="bg-muted/70">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Curs din documentul Word</TableHead>
                    <TableHead>Stare</TableHead>
                    <TableHead>Curs potrivit din program</TableHead>
                    <TableHead className="text-right">Scor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row) => {
                    const bestCandidate = row.candidates[0];
                    const selected = selections[row.word_row_index] ?? null;
                    return (
                      <TableRow className="even:bg-muted/25" key={row.word_row_index}>
                        <TableCell className="max-w-64 truncate font-medium" title={row.word_title}>
                          {row.word_title}
                        </TableCell>
                        <TableCell>
                          {row.status === "matched" ? (
                            <Badge variant="secondary">
                              <CheckCircle2 aria-hidden="true" className="size-3" />
                              Potrivit
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <HelpCircle aria-hidden="true" className="size-3" />
                              De revizuit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            aria-label={`Curs potrivit pentru „${row.word_title}”`}
                            onChange={(event) => {
                              const value = event.target.value;
                              setSelections((current) => ({
                                ...current,
                                [row.word_row_index]: value === skipValue ? null : Number(value),
                              }));
                            }}
                            value={selected === null ? skipValue : String(selected)}
                          >
                            <NativeSelectOption value={skipValue}>
                              Fără potrivire (omite)
                            </NativeSelectOption>
                            {preview.schedule_options.map((option) => (
                              <NativeSelectOption
                                key={option.row_index}
                                value={String(option.row_index)}
                              >
                                {option.title}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {bestCandidate ? `${bestCandidate.score}%` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <WorkflowEmptyState
              description="Verifică documentul Word și programul cursurilor, apoi încearcă din nou cu fișiere care conțin date."
              icon={FileSearch}
              title="Niciun rând disponibil pentru potrivire"
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
