import { useEffect, useMemo, useRef } from "react";
import { FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { monthNames } from "../constants";
import type { ScheduledCourse } from "../types";

const previewRowLimit = 100;

type ScheduleRow = {
  duration: string;
  investment: string;
  key: string;
  months: Record<number, string>;
  title: string;
};

function buildRows(schedule: ScheduledCourse[]): ScheduleRow[] {
  const rows = new Map<string, ScheduleRow>();

  schedule.forEach((item) => {
    const key = `${item.original_order}:${item.title}`;
    const current = rows.get(key) ?? {
      duration: item.duration_label,
      investment: item.investment,
      key,
      months: {},
      title: item.title,
    };
    current.months[item.month] = item.date_range;
    rows.set(key, current);
  });

  return [...rows.values()];
}

export function CourseScheduleTable({ schedule }: { schedule: ScheduledCourse[] }) {
  const rows = useMemo(() => buildRows(schedule), [schedule]);
  const previewRows = rows.slice(0, previewRowLimit);
  const hiddenRowCount = Math.max(0, rows.length - previewRows.length);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const topScrollContentRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tableScroll = tableScrollRef.current;
    const topScrollContent = topScrollContentRef.current;

    if (!tableScroll || !topScrollContent) {
      return;
    }

    const updateWidth = () => {
      topScrollContent.style.width = `${tableScroll.scrollWidth}px`;
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(tableScroll);

    const table = tableScroll.querySelector("table");
    if (table) {
      observer.observe(table);
    }

    return () => observer.disconnect();
  }, [previewRows.length]);

  function syncScroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (!target || target.scrollLeft === source.scrollLeft) {
      return;
    }

    target.scrollLeft = source.scrollLeft;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet aria-hidden="true" className="size-4 text-primary" />
          Planificare generată
        </CardTitle>
        <CardDescription>
          {rows.length} cursuri distincte distribuite în lunile selectate.
          {hiddenRowCount > 0
            ? ` Previzualizarea afișează primele ${previewRowLimit}; exportul conține toate cursurile.`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div
          ref={topScrollRef}
          aria-label="Derulare orizontală tabel"
          className="h-5 overflow-x-auto overflow-y-hidden border-b bg-muted/20"
          onScroll={(event) => syncScroll(event.currentTarget, tableScrollRef.current)}
          role="region"
        >
          <div ref={topScrollContentRef} className="h-px" />
        </div>

        <Table
          containerRef={tableScrollRef}
          className="isolate min-w-[118rem] table-fixed border-separate border-spacing-0"
          onContainerScroll={(event) => syncScroll(event.currentTarget, topScrollRef.current)}
        >
          <TableHeader className="bg-muted/70">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-[70] w-96 min-w-96 border-r bg-muted px-4">
                Curs
              </TableHead>
              <TableHead className="sticky left-96 z-[70] w-32 min-w-32 border-r bg-muted px-4">
                Durată
              </TableHead>
              <TableHead className="sticky left-[32rem] z-[70] w-36 min-w-36 border-r bg-muted px-4 shadow-[6px_0_8px_-8px_var(--foreground)]">
                Investiție
              </TableHead>
              {monthNames.map((monthName) => (
                <TableHead className="relative z-10 w-36 min-w-36 bg-muted/70 px-4" key={monthName}>
                  {monthName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, rowIndex) => {
              const stickyBackground = rowIndex % 2 === 0 ? "bg-background" : "bg-muted";

              return (
                <TableRow className="even:bg-muted/25" key={row.key}>
                  <TableCell
                    className={`sticky left-0 z-[60] w-96 min-w-96 whitespace-normal border-r px-4 py-3 font-medium ${stickyBackground}`}
                  >
                    {row.title}
                  </TableCell>
                  <TableCell
                    className={`sticky left-96 z-[60] w-32 min-w-32 border-r px-4 py-3 ${stickyBackground}`}
                  >
                    {row.duration}
                  </TableCell>
                  <TableCell
                    className={`sticky left-[32rem] z-[60] w-36 min-w-36 border-r px-4 py-3 shadow-[6px_0_8px_-8px_var(--foreground)] ${stickyBackground}`}
                  >
                    {row.investment || "—"}
                  </TableCell>
                  {monthNames.map((_, index) => (
                    <TableCell className="relative z-0 w-36 min-w-36 px-4 py-3" key={index + 1}>
                      {row.months[index + 1] || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {hiddenRowCount > 0 ? (
          <div className="border-t bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {hiddenRowCount} cursuri suplimentare nu sunt randate în browser pentru a menține pagina rapidă.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
