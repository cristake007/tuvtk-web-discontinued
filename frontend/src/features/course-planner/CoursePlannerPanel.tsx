import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Save } from "lucide-react";

import { ApiError } from "@/api/http";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import {
  coursePlannerHistoryQueryKey,
  coursePlannerQueryKey,
  downloadCoursePlanFile,
  fetchCoursePlannerSettings,
  generateCourseSchedule,
  saveCoursePlannerSettings,
} from "./api";
import type {
  CoursePlannerSettings,
  GenerateScheduleResponse,
  ScheduledCourse,
} from "./types";

const monthNames = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

const defaultSettings: CoursePlannerSettings = {
  year: new Date().getFullYear(),
  months: [],
  randomness: 5,
  holidays: [],
};

type ScheduleRow = {
  key: string;
  title: string;
  duration: string;
  investment: string;
  months: Record<number, string>;
};

type ExcelDownloadRequest = {
  generationId: string;
  filename: string;
};

function getErrorMessage(error: Error | null): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Operațiunea nu a putut fi finalizată.";
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

function buildScheduleRows(schedule: ScheduledCourse[]): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();

  schedule.forEach((item) => {
    const key = `${item.original_order}:${item.title}`;
    const existing = rows.get(key) ?? {
      key,
      title: item.title,
      duration: item.duration_label,
      investment: item.investment,
      months: {},
    };
    existing.months[item.month] = item.date_range;
    rows.set(key, existing);
  });

  return [...rows.values()];
}

export function CoursePlannerPanel() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: coursePlannerQueryKey,
    queryFn: fetchCoursePlannerSettings,
    staleTime: 5 * 60_000,
  });
  const [settings, setSettings] = useState<CoursePlannerSettings>(defaultSettings);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [holidaysText, setHolidaysText] = useState("");
  const [result, setResult] = useState<GenerateScheduleResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setSettings(settingsQuery.data);
    setHolidaysText(settingsQuery.data.holidays.join("\n"));
  }, [settingsQuery.data]);

  const normalizedHolidays = useMemo(
    () =>
      [...new Set(holidaysText.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))],
    [holidaysText],
  );
  const scheduleRows = useMemo(
    () => buildScheduleRows(result?.schedule ?? []),
    [result?.schedule],
  );

  const saveMutation = useMutation({
    mutationFn: saveCoursePlannerSettings,
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(coursePlannerQueryKey, savedSettings);
      setLocalError(null);
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateCourseSchedule,
    onSuccess: (response) => {
      setResult(response);
      setLocalError(null);
      queryClient.setQueryData(coursePlannerQueryKey, {
        ...settings,
        holidays: normalizedHolidays,
      });
      void queryClient.invalidateQueries({ queryKey: coursePlannerHistoryQueryKey });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (request: ExcelDownloadRequest) =>
      downloadCoursePlanFile({
        generationId: request.generationId,
        fileType: "excel",
      }),
    onSuccess: (blob, request) => saveBlob(blob, request.filename),
  });

  function currentSettings(): CoursePlannerSettings {
    return {
      ...settings,
      holidays: normalizedHolidays,
    };
  }

  function toggleMonth(month: number) {
    setSettings((current) => ({
      ...current,
      months: current.months.includes(month)
        ? current.months.filter((value) => value !== month)
        : [...current.months, month].sort((left, right) => left - right),
    }));
    setResult(null);
  }

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    generateMutation.reset();
    downloadMutation.reset();

    if (!inputFile) {
      setLocalError("Selectează fișierul CSV sau Excel cu lista cursurilor.");
      return;
    }
    if (settings.months.length === 0) {
      setLocalError("Selectează cel puțin o lună.");
      return;
    }

    setLocalError(null);
    generateMutation.mutate({
      ...currentSettings(),
      inputFile,
    });
  }

  if (settingsQuery.isPending) {
    return (
      <div className="flex min-h-80 items-center justify-center" aria-live="polite">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  const error =
    localError ??
    getErrorMessage(settingsQuery.error) ??
    getErrorMessage(saveMutation.error) ??
    getErrorMessage(generateMutation.error) ??
    getErrorMessage(downloadMutation.error);

  return (
    <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-7 lg:p-9">
      <header>
        <p className="text-sm font-medium text-primary">Planificator cursuri</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Generare perioade cursuri
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Încarcă lista cursurilor, selectează lunile și zilele libere, apoi generează
          perioadele care pot fi exportate în Excel.
        </p>
      </header>

      {error ? (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="grid gap-6" noValidate onSubmit={handleGenerate}>
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium" htmlFor="course-file">
            Fișier cursuri
            <Input
              accept=".csv,.xlsx,.xls"
              id="course-file"
              onChange={(event) => {
                setInputFile(event.target.files?.[0] ?? null);
                setResult(null);
              }}
              type="file"
            />
            <span className="text-xs font-normal leading-5 text-muted-foreground">
              Coloane obligatorii: Title, Durata Curs și Permalink. Coloana investitie este
              opțională.
            </span>
          </label>

          <label className="grid content-start gap-2 text-sm font-medium" htmlFor="planner-year">
            An
            <Input
              id="planner-year"
              max={2100}
              min={2024}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  year: Number(event.target.value),
                }));
                setResult(null);
              }}
              type="number"
              value={settings.year}
            />
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Luni</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {monthNames.map((monthName, index) => {
              const month = index + 1;
              return (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-sm border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  key={monthName}
                >
                  <input
                    checked={settings.months.includes(month)}
                    className="size-4 accent-primary"
                    onChange={() => toggleMonth(month)}
                    type="checkbox"
                  />
                  {monthName}
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setSettings((current) => ({
                  ...current,
                  months: monthNames.map((_, index) => index + 1),
                }));
                setResult(null);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Selectează toate
            </Button>
            <Button
              onClick={() => {
                setSettings((current) => ({ ...current, months: [] }));
                setResult(null);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Deselectează toate
            </Button>
          </div>
        </fieldset>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="grid content-start gap-2 text-sm font-medium" htmlFor="randomness">
            Nivel de distribuție: {settings.randomness}
            <input
              className="h-2 w-full cursor-pointer accent-primary"
              id="randomness"
              max={10}
              min={1}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  randomness: Number(event.target.value),
                }));
                setResult(null);
              }}
              type="range"
              value={settings.randomness}
            />
            <span className="text-xs font-normal leading-5 text-muted-foreground">
              Valoarea mică păstrează mai mult spațiu între începuturile cursurilor;
              valoarea mare distribuie perioadele mai liber.
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium" htmlFor="holidays">
            Zile libere
            <textarea
              className="min-h-28 w-full resize-y rounded-sm border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              id="holidays"
              onChange={(event) => {
                setHolidaysText(event.target.value);
                setResult(null);
              }}
              placeholder={"01.01.2027\n02.01.2027"}
              value={holidaysText}
            />
            <span className="text-xs font-normal leading-5 text-muted-foreground">
              Introdu datele în format ZZ.LL.AAAA, separate prin virgulă sau pe rânduri noi.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-5">
          <Button disabled={generateMutation.isPending} type="submit">
            {generateMutation.isPending ? <Spinner /> : <FileSpreadsheet aria-hidden="true" />}
            {generateMutation.isPending ? "Se generează…" : "Generează planificarea"}
          </Button>
          <Button
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(currentSettings())}
            type="button"
            variant="outline"
          >
            {saveMutation.isPending ? <Spinner /> : <Save aria-hidden="true" />}
            {saveMutation.isPending ? "Se salvează…" : "Salvează setările"}
          </Button>
          <Button
            disabled={!result || downloadMutation.isPending}
            onClick={() => {
              if (!result) {
                return;
              }
              downloadMutation.mutate({
                generationId: result.generation.id,
                filename:
                  result.generation.files.excel.filename ??
                  `planificare_cursuri_${result.generation.year}.xlsx`,
              });
            }}
            type="button"
            variant="outline"
          >
            {downloadMutation.isPending ? <Spinner /> : <Download aria-hidden="true" />}
            {downloadMutation.isPending ? "Se descarcă…" : "Descarcă Excel"}
          </Button>
        </div>
      </form>

      {result ? (
        <section className="grid min-w-0 gap-3 border-t pt-6">
          <div>
            <h2 className="text-lg font-semibold">Planificare generată</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.course_count} cursuri procesate.
            </p>
          </div>
          <div className="overflow-auto rounded-sm border bg-background">
            <table className="w-full min-w-[76rem] border-collapse text-sm">
              <thead className="bg-muted/70 text-left">
                <tr>
                  <th className="border-b px-3 py-2 font-medium">Curs</th>
                  <th className="border-b px-3 py-2 font-medium">Durată</th>
                  <th className="border-b px-3 py-2 font-medium">Investiție</th>
                  {monthNames.map((monthName) => (
                    <th className="border-b px-3 py-2 font-medium" key={monthName}>
                      {monthName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row) => (
                  <tr className="odd:bg-background even:bg-muted/30" key={row.key}>
                    <td className="border-b px-3 py-2 font-medium">{row.title}</td>
                    <td className="border-b px-3 py-2">{row.duration}</td>
                    <td className="border-b px-3 py-2">{row.investment || "—"}</td>
                    {monthNames.map((_, index) => (
                      <td className="whitespace-nowrap border-b px-3 py-2" key={index + 1}>
                        {row.months[index + 1] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
