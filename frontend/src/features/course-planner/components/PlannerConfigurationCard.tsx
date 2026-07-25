import type { FormEvent } from "react";
import { CalendarCheck2, FileSpreadsheet, Save, Sparkles } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";

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
  onYearChange,
  savePending,
  settings,
}: PlannerConfigurationCardProps) {
  const busy = generatePending || savePending;
  const plannerYears = getPlannerYears(settings.year);

  return (
    <form noValidate onSubmit={onGenerate}>
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-primary" />
            Configurare planificare
          </CardTitle>
          <CardDescription>
            Fișierul, lunile și regulile de distribuție folosite pentru această generare.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-7 pt-1">
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid content-start gap-2 text-sm font-medium">
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
              <span className="text-xs font-normal leading-5 text-muted-foreground">
                Anul folosit pentru toate perioadele generate.
              </span>
            </div>

            <div className="grid content-start gap-2 text-sm font-medium">
              <label htmlFor="randomness">Nivel de distribuție</label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
                <Slider
                  aria-label="Nivel de distribuție"
                  className="min-w-0 flex-1 cursor-pointer"
                  disabled={busy}
                  id="randomness"
                  max={10}
                  min={1}
                  onValueChange={(value) => onRandomnessChange(value[0] ?? 1)}
                  step={1}
                  value={[settings.randomness]}
                />
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {settings.randomness}
                </span>
              </div>
              <span className="text-xs font-normal leading-5 text-muted-foreground">
                1 păstrează mai mult spațiu între cursuri, iar 10 distribuie mai liber.
              </span>
            </div>
          </div>

          <fieldset className="grid gap-3" disabled={busy}>
            <legend className="text-sm font-medium">Lunile incluse</legend>
            <div className="flex justify-end gap-2">
              <Button onClick={onSelectAllMonths} size="xs" type="button" variant="outline">
                Toate
              </Button>
              <Button onClick={onClearMonths} size="xs" type="button" variant="ghost">
                Niciuna
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {monthNames.map((monthName, index) => {
                const month = index + 1;
                const selected = settings.months.includes(month);
                return (
                  <Button
                    aria-pressed={selected}
                    className="justify-start"
                    key={monthName}
                    onClick={() => onToggleMonth(month)}
                    type="button"
                    variant={selected ? "default" : "outline"}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-5 place-items-center rounded-md border border-current/25 text-[11px]"
                    >
                      {month}
                    </span>
                    {monthName}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex gap-3 rounded-lg border bg-muted/20 p-4">
            <CalendarCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="grid gap-1">
              <p className="text-sm font-medium">Zile libere administrate automat</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Backend-ul folosește direct zilele legale și zilele interne salvate pentru anul și lunile selectate.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-between gap-3">
          <Button disabled={busy} onClick={onSave} type="button" variant="outline">
            {savePending ? <Spinner /> : <Save aria-hidden="true" />}
            {savePending ? "Se salvează…" : "Salvează setările"}
          </Button>
          <Button disabled={busy} size="lg" type="submit">
            {generatePending ? <Spinner /> : <FileSpreadsheet aria-hidden="true" />}
            {generatePending ? "Se generează…" : "Generează planificarea"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
