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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import { formatSelectedMonths } from "../constants";
import type { GenerateScheduleResponse } from "../types";

type PlannerSummaryCardProps = {
  downloadPending: boolean;
  file: File | null;
  onDownload: () => void;
  result: GenerateScheduleResponse | null;
  selectedMonths: number[];
  year: number;
};

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-48 text-right font-medium">{value}</span>
    </div>
  );
}

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
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {available ? "Disponibil pentru descărcare" : "Va fi integrat în etapa următoare"}
        </p>
      </div>
      {available ? <CheckCircle2 aria-hidden="true" className="size-4 text-success" /> : null}
    </div>
  );
}

export function PlannerSummaryCard({
  downloadPending,
  file,
  onDownload,
  result,
  selectedMonths,
  year,
}: PlannerSummaryCardProps) {
  return (
    <Card className="h-fit shadow-sm xl:sticky xl:top-6">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="size-4 text-primary" />
          Rezumat
        </CardTitle>
        <CardDescription>
          Verifică selecția înainte de generare și descarcă rezultatul curent.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 pt-1">
        <div>
          <SummaryRow label="Fișier" value={file?.name ?? "Neselectat"} />
          <SummaryRow label="An" value={String(year)} />
          <SummaryRow label="Luni" value={formatSelectedMonths(selectedMonths)} />
          <SummaryRow label="Zile libere" value="Preluate automat" />
          <SummaryRow
            label="Cursuri procesate"
            value={result ? String(result.course_count) : "—"}
          />
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fișiere generate
          </p>
          <ArtifactStatus
            available={Boolean(result?.generation.files.excel.available)}
            icon={FileSpreadsheet}
            label="Excel"
          />
          <ArtifactStatus available={false} icon={FileText} label="Word" />
          <ArtifactStatus available={false} icon={FileCode2} label="XML" />
        </div>

        {!result ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center">
            <CalendarDays aria-hidden="true" className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Nicio planificare generată</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Rezultatul și opțiunea de descărcare vor apărea aici după generare.
            </p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!result || downloadPending}
          onClick={onDownload}
          type="button"
          variant="outline"
        >
          {downloadPending ? <Spinner /> : <Download aria-hidden="true" />}
          {downloadPending ? "Se descarcă…" : "Descarcă Excel"}
        </Button>
      </CardFooter>
    </Card>
  );
}
