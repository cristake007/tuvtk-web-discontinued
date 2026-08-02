import {
  CheckCircle2,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

import type { GenerateScheduleResponse } from "../types";

type PlannerSummaryCardProps = {
  downloadPending: boolean;
  onDownload: () => void;
  result: GenerateScheduleResponse;
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
    <div className="flex flex-1 items-center gap-3 rounded-xl border bg-background p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className={textVariants({ variant: "detaliu", className: "text-muted-foreground" })}>
          {available ? "Disponibil pentru descărcare" : "Va fi integrat în etapa următoare"}
        </p>
      </div>
      {available ? (
        <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-success" />
      ) : null}
    </div>
  );
}

export function PlannerSummaryCard({
  downloadPending,
  onDownload,
  result,
}: PlannerSummaryCardProps) {
  return (
    <div className="grid gap-6 rounded-2xl bg-primary/5 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={textVariants({ variant: "eticheta", className: "text-primary" })}>
            Rezultat generare
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-5xl font-bold tabular-nums tracking-tight text-heading sm:text-6xl">
              {result.course_count}
            </span>
            <span
              className={textVariants({
                variant: "corp",
                className: "font-medium text-muted-foreground",
              })}
            >
              {result.course_count === 1 ? "curs procesat" : "cursuri procesate"}
            </span>
          </p>
        </div>
        <Button disabled={downloadPending} onClick={onDownload} size="lg" type="button">
          <Download aria-hidden="true" />
          {downloadPending ? "Se descarcă…" : "Descarcă Excel"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ArtifactStatus
          available={Boolean(result.generation.files.excel.available)}
          icon={FileSpreadsheet}
          label="Excel"
        />
        <ArtifactStatus available={false} icon={FileText} label="Word" />
        <ArtifactStatus available={false} icon={FileCode2} label="XML" />
      </div>
    </div>
  );
}
