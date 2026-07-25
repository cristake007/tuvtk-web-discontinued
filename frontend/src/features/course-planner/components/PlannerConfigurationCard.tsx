import type { FormEvent } from "react";
import { CalendarDays, FileSpreadsheet, Save, Sparkles } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { monthNames } from "../constants";
import type { CoursePlannerSettings } from "../types";

type PlannerConfigurationCardProps = {
  file: File | null;
  generatePending: boolean;
  holidaysPending: boolean;
  holidaysText: string;
  onClearMonths: () => void;
  onFetchHolidays: () => void;
  onFileChange: (file: File | undefined) => void;
  onGenerate: (event: FormEvent<HTMLFormElement>) => void;
  onHolidaysChange: (value: string) => void;
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
  holidaysPending,
  holidaysText,
  onClearMonths,
  onFetchHolidays,
  onFileChange,
  onGenerate,
  onHolidaysChange,
  onRandomnessChange,
  onSave,
  onSelectAllMonths,
  onToggleMonth,
  onYearChange,
  savePending,
  settings,
}: PlannerConfigurationCardProps) {
  const busy = generatePending || savePending;

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
            <label className="grid content-start gap-2 text-sm font-medium" htmlFor="planner-year">
              Anul planificării
              <Input
                disabled={busy}
                id="planner-year"
                max={2100}
                min={2024}
                onChange={(event) => onYearChange(Number(event.target.value))}
                type="number"
                value={settings.year}
              />
              <span className="text-xs font-normal leading-5 text-muted-foreground">
                Anul folosit pentru toate perioadele generate.
              </span>
            </label>

            <label className="grid content-start gap-2 text-sm font-medium" htmlFor="randomness">
              Nivel de distribuție
              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
                <input
                  className="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
                  disabled={busy}
                  id="randomness"
                  max={10}
                  min={1}
                  onChange={(event) => onRandomnessChange(Number(event.target.value))}
                  type="range"
                  value={settings.randomness}
                />
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {settings.randomness}
                </span>
              </div>
              <span className="text-xs font-normal leading-5 text-muted-foreground">
                1 păstrează mai mult spațiu între cursuri, iar 10 distribuie mai liber.
              </span>
            </label>
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

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-medium" htmlFor="holidays">
                Zile libere
              </label>
              <Button
                disabled={busy || holidaysPending || settings.months.length === 0}
                onClick={onFetchHolidays}
                size="sm"
                type="button"
                variant="outline"
              >
                {holidaysPending ? <Spinner /> : <CalendarDays aria-hidden="true" />}
                {holidaysPending ? "Se preiau…" : "Preia zilele libere"}
              </Button>
            </div>
            <Textarea
              className="min-h-28 resize-y"
              disabled={busy || holidaysPending}
              id="holidays"
              onChange={(event) => onHolidaysChange(event.target.value)}
              placeholder={"01.01.2027\n02.01.2027"}
              value={holidaysText}
            />
            <span className="text-xs font-normal leading-5 text-muted-foreground">
              Butonul preia zilele legale și interne pentru anul și lunile selectate. Poți modifica apoi lista manual, folosind formatul ZZ.LL.AAAA.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap justify-between gap-3">
          <Button disabled={busy || holidaysPending} onClick={onSave} type="button" variant="outline">
            {savePending ? <Spinner /> : <Save aria-hidden="true" />}
            {savePending ? "Se salvează…" : "Salvează setările"}
          </Button>
          <Button disabled={busy || holidaysPending} size="lg" type="submit">
            {generatePending ? <Spinner /> : <FileSpreadsheet aria-hidden="true" />}
            {generatePending ? "Se generează…" : "Generează planificarea"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
