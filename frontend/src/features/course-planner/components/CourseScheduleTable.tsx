import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet } from "lucide-react";

import { SectionTitle } from "@/components/ui/heading";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { monthNames } from "../constants";
import type { ScheduledCourse } from "../types";

const rowsPerPage = 25;

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
  const [page, setPage] = useState(1);
  const rows = useMemo(() => buildRows(schedule), [schedule]);
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const visibleRows = rows.slice(pageStart, pageStart + rowsPerPage);
  const previousDisabled = currentPage === 1;
  const nextDisabled = currentPage === pageCount;

  useEffect(() => {
    setPage(1);
  }, [schedule]);

  return (
    <section className="min-w-0 border-t pt-6" id="planificare-generata">
      <div className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div>
          <SectionTitle className="flex items-center gap-2">
            <FileSpreadsheet aria-hidden="true" className="size-4 text-primary" />
            Planificare generată
          </SectionTitle>
          <p className="mt-1 text-base leading-6 text-muted-foreground">
            {rows.length} cursuri distincte distribuite în lunile selectate.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {rows.length === 0 ? "Niciun curs" : `${pageStart + 1}–${pageStart + visibleRows.length}`} din {rows.length}
        </p>
      </div>

      <div className="mt-5 border-y">
        <Table
          className="min-w-[118rem] table-fixed"
          containerClassName="max-h-[calc(100svh-14rem)] overflow-auto"
        >
          <TableCaption className="sr-only">
            Cursurile programate pentru lunile selectate.
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 shadow-sm backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-96 min-w-96 px-4">Curs</TableHead>
              <TableHead className="w-32 min-w-32 px-4">Durată</TableHead>
              <TableHead className="w-36 min-w-36 px-4">Investiție</TableHead>
              {monthNames.map((monthName) => (
                <TableHead className="w-36 min-w-36 px-4" key={monthName}>
                  {monthName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow className="even:bg-muted/25" key={row.key}>
                <TableCell className="whitespace-normal px-4 py-3 font-medium">
                  {row.title}
                </TableCell>
                <TableCell className="px-4 py-3">{row.duration}</TableCell>
                <TableCell className="px-4 py-3">{row.investment || "—"}</TableCell>
                {monthNames.map((_, index) => (
                  <TableCell className="px-4 py-3" key={index + 1}>
                    {row.months[index + 1] || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Pagina {currentPage} din {pageCount}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={previousDisabled}
                  className={cn(previousDisabled && "pointer-events-none opacity-50")}
                  href="#planificare-generata"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!previousDisabled) {
                      setPage((value) => value - 1);
                    }
                  }}
                  text="Anterior"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  aria-disabled={nextDisabled}
                  className={cn(nextDisabled && "pointer-events-none opacity-50")}
                  href="#planificare-generata"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!nextDisabled) {
                      setPage((value) => value + 1);
                    }
                  }}
                  text="Următor"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </section>
  );
}
