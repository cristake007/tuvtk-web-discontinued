import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, FileSpreadsheet, Save, Sparkles } from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { FileUploadField } from "@/components/FileUploadField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { coursePlannerHolidaysQueryKey, fetchCoursePlannerHolidays } from "../api";
import { monthNames } from "../constants";
import type { CoursePlannerSettings } from "../types";

const firstPlannerYear = 2024;
const lastPlannerYear = new Date().getFullYear() + 10;

function getPlannerYears(selectedYear: number): number[] {
  const start = Math.min(firstPlannerYear, selectedYear);
  const end = Math.max(lastPlannerYear, selectedYear);

  return Array.from({ length: end - start + 1 }, (_, index) => end - index);
}

type PlannerConfigurationCardProps = {
  file: File | null;
  generatePending: boolean;
  onClearMonths: () => void;
  onFileChange: (file: File | undefined) => void;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
  onRandomnessChange: (value: number) => void;
  onSave: () => void;
  onSelectAllMonths: () => void;
  onToggleMonth: (month: number) => void;
  onXmlStartPostIdChange: (value: number) => void;
  onYearChange: (year: number) => void;
  savePending: boolean;
  settings: CoursePlannerSettings;
};

export function PlannerConfigurationCard({
  file,
  generatePending,
  onClearMonths,
  onFileChange,
  onGenerate,
  onRandomnessChange,
  onSave,
  onSelectAllMonths,
  onToggleMonth,
  onXmlStartPostIdChange,
  onYearChange,
  savePending,
  settings,
}: PlannerConfigurationCardProps) {
  const busy = generatePending || savePending;
  const plannerYears = getPlannerYears(settings.year);
  const holidaysQuery = useQuery({
    queryKey: coursePlannerHolidaysQueryKey(settings.year, settings.months),
    queryFn: () => fetchCoursePlannerHolidays(settings.year, settings.months),
    enabled: settings.months.length > 0,
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle as="h2">Configurare planificare</CardTitle>
            <CardDescription className="mt-1">
              Fișierul, lunile și regulile de distribuție folosite pentru această generare.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form noValidate onSubmit={onGenerate}>
        <CardContent className="grid gap-6 pt-6">
          <FileUploadField
            accept=".csv,.xlsx,.xls"
            description="Coloane obligatorii: Title, Durata Curs și Permalink. Coloana investitie este opțională."
            disabled={busy}
            emptyDescription="Trage fișierul aici sau apasă pentru a-l selecta. Sunt acceptate CSV, XLSX și XLS."
            emptyTitle="Încarcă lista cursurilor"
            file={file}
            icon={FileSpreadsheet}
            id="course-file"
            label="Fișier cursuri"
            onFileChange={onFileChange}
          />

          <div className="grid gap-5 border-y py-6 sm:grid-cols-2">
            <div
              className={textVariants({
                variant: "eticheta",
                className: "grid content-start gap-2",
              })}
            >
              <label htmlFor="planner-year">Anul planificării</label>
              <Select
                disabled={busy}
                onValueChange={(value) => onYearChange(Number(value))}
                value={String(settings.year)}
              >
                <SelectTrigger className="w-full cursor-pointer" id="planner-year">
                  <SelectValue>{settings.year}</SelectValue>
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {plannerYears.map((year) => (
                    <SelectItem className="cursor-pointer" key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p
                className={textVariants({
                  variant: "detaliu",
                  className: "font-normal leading-5 text-muted-foreground",
                })}
              >
                Anul folosit pentru toate perioadele generate.
              </p>
            </div>

            <div
              className={textVariants({
                variant: "eticheta",
                className: "grid content-start gap-2",
              })}
            >
              <label htmlFor="randomness">Nivel de distribuție</label>
              <div className="flex items-center gap-3 py-2">
                <Slider
                  aria-label="Nivel de distribuție"
                  className="min-w-0 flex-1 cursor-pointer"
                  disabled={busy}
                  id="randomness"
                  max={10}
                  min={1}
                  onValueChange={(value) =>
                    onRandomnessChange(typeof value === "number" ? value : (value[0] ?? 1))
                  }
                  step={1}
                  value={[settings.randomness]}
                />
                <span
                  className={textVariants({
                    variant: "interfata",
                    className:
                      "grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground",
                  })}
                >
                  {settings.randomness}
                </span>
              </div>
              <p
                className={textVariants({
                  variant: "detaliu",
                  className: "font-normal leading-5 text-muted-foreground",
                })}
              >
                1 păstrează mai mult spațiu între cursuri, iar 10 distribuie mai liber.
              </p>
            </div>

            <div
              className={textVariants({
                variant: "eticheta",
                className: "grid content-start gap-2 sm:col-span-2",
              })}
            >
              <label htmlFor="xml-start-post-id">ID inițial pentru XML WordPress</label>
              <Input
                disabled={busy}
                id="xml-start-post-id"
                inputMode="numeric"
                max={2_147_483_647}
                min={1}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 1) {
                    onXmlStartPostIdChange(value);
                  }
                }}
                type="number"
                value={settings.xml_start_post_id}
              />
              <p
                className={textVariants({
                  variant: "detaliu",
                  className: "font-normal leading-5 text-muted-foreground",
                })}
              >
                Primul ID de postare folosit la generarea fișierului XML pentru cursuri noi.
              </p>
            </div>
          </div>

          <fieldset className="grid gap-3 border-b pb-7" disabled={busy}>
            <legend className={textVariants({ variant: "eticheta" })}>Lunile incluse</legend>
            <div className="flex justify-end gap-2">
              <Button onClick={onSelectAllMonths} size="xs" type="button" variant="outline">
                Toate
              </Button>
              <Button onClick={onClearMonths} size="xs" type="button" variant="ghost">
                Niciuna
              </Button>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {monthNames.map((monthName, index) => {
                const month = index + 1;
                const selected = settings.months.includes(month);
                return (
                  <li key={monthName}>
                    <Button
                      aria-pressed={selected}
                      className="w-full justify-start"
                      onClick={() => onToggleMonth(month)}
                      type="button"
                      variant={selected ? "default" : "outline"}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-5 place-items-center rounded-md border border-current/25 text-[calc(11px*var(--app-font-scale))]"
                      >
                        {month}
                      </span>
                      {monthName}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <section className="flex gap-3 border-l-2 border-primary pl-4">
            <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className={textVariants({ variant: "eticheta" })}>
                Zile libere administrate automat
              </p>
              <p
                className={textVariants({
                  variant: "detaliu",
                  className: "leading-5 text-muted-foreground",
                })}
              >
                Acestea sunt zilele legale și interne pe care generatorul le va exclude pentru anul
                și lunile selectate.
              </p>
              {settings.months.length === 0 ? (
                <p
                  className={textVariants({
                    variant: "detaliu",
                    className: "mt-2 text-muted-foreground",
                  })}
                >
                  Selectează cel puțin o lună pentru a verifica zilele libere.
                </p>
              ) : null}
              {holidaysQuery.isError ? (
                <div
                  className={textVariants({
                    variant: "detaliu",
                    className: "mt-3 flex flex-wrap items-center gap-2 text-muted-foreground",
                  })}
                >
                  Zilele libere nu au putut fi încărcate.
                  <Button
                    onClick={() => void holidaysQuery.refetch()}
                    size="xs"
                    type="button"
                    variant="outline"
                  >
                    Reîncearcă
                  </Button>
                </div>
              ) : null}
              {holidaysQuery.isSuccess ? (
                <div className="mt-3 grid gap-2">
                  <p
                    className={textVariants({
                      variant: "detaliu",
                      className: "font-medium text-foreground",
                    })}
                  >
                    {holidaysQuery.data.length === 1
                      ? "1 zi liberă preluată"
                      : `${holidaysQuery.data.length} zile libere preluate`}
                  </p>
                  {holidaysQuery.data.length > 0 ? (
                    <ul
                      className={textVariants({
                        variant: "detaliu",
                        className: "grid max-h-40 divide-y overflow-y-auto border-y",
                      })}
                    >
                      {holidaysQuery.data.map((holiday) => (
                        <li
                          className="flex items-center justify-between gap-3 px-3 py-2"
                          key={`${holiday.date}-${holiday.name}`}
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-medium">{holiday.date}</span> — {holiday.name}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {holiday.source_label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className={textVariants({
                        variant: "detaliu",
                        className: "text-muted-foreground",
                      })}
                    >
                      Nu există zile libere salvate pentru această selecție.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </CardContent>

        <CardFooter className="flex-wrap justify-between gap-3">
          <Button disabled={busy} onClick={onSave} type="button" variant="outline">
            <Save aria-hidden="true" />
            {savePending ? "Se salvează…" : "Salvează setările"}
          </Button>
          <Button disabled={busy} size="lg" type="submit">
            <FileSpreadsheet aria-hidden="true" />
            {generatePending ? "Se generează…" : "Generează planificarea"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
