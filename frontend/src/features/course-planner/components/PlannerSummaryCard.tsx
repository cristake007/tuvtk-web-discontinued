import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { GenerateScheduleResponse } from "../types";

type PlannerSummaryCardProps = {
  downloadPending: boolean;
  onDownload: () => void;
  result: GenerateScheduleResponse | null;
};

function ArtifactStatus({
  available,
  icon: Icon,
  label,
}: {
  available: boolean;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className={textVariants({ variant: "detaliu", className: "text-muted-foreground" })}>
          {available ? "Disponibil pentru descărcare" : "Va fi integrat în etapa următoare"}
        </p>
      </div>
      {available ? <CheckCircle2 aria-hidden="true" className="size-4 text-success" /> : null}
    </div>
  );
}

export function PlannerSummaryCard({
  downloadPending,
  onDownload,
  result,
}: PlannerSummaryCardProps) {
  return (
    <Card className="h-fit xl:sticky xl:top-6">
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ListChecks aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle as="h2">Rezultat generare</CardTitle>
            <CardDescription className="mt-1">
              Fișierele apar aici imediat după ce planificarea este generată.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 pt-6">
        {!result ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarDays aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className={textVariants({ variant: "eticheta" })}>Nicio planificare generată</p>
            <p
              className={textVariants({
                variant: "detaliu",
                className: "max-w-56 leading-5 text-muted-foreground",
              })}
            >
              Completează formularul din stânga și apasă „Generează planificarea”.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 rounded-lg bg-primary/5 px-4 py-3">
              <span className="text-3xl font-bold tabular-nums text-primary">
                {result.course_count}
              </span>
              <span
                className={textVariants({ variant: "corp", className: "text-muted-foreground" })}
              >
                {result.course_count === 1 ? "curs procesat" : "cursuri procesate"}
              </span>
            </div>

            <div className="grid gap-2">
              <ArtifactStatus
                available={Boolean(result.generation.files.excel.available)}
                icon={FileSpreadsheet}
                label="Excel"
              />
              <ArtifactStatus available={false} icon={FileText} label="Word" />
              <ArtifactStatus available={false} icon={FileCode2} label="XML" />
            </div>
          </>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!result || downloadPending}
          onClick={onDownload}
          type="button"
          variant="outline"
        >
          <Download aria-hidden="true" />
          {downloadPending ? "Se descarcă…" : "Descarcă Excel"}
        </Button>
      </CardFooter>
    </Card>
  );
}
