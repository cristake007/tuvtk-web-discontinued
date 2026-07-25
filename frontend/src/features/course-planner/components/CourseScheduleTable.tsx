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
  const rows = buildRows(schedule);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet aria-hidden="true" className="size-4 text-primary" />
          Planificare generată
        </CardTitle>
        <CardDescription>
          {rows.length} cursuri distincte distribuite în lunile selectate.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="min-w-[118rem] table-fixed border-separate border-spacing-0">
          <TableHeader className="bg-muted/70">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-30 w-96 min-w-96 border-r bg-muted px-4">
                Curs
              </TableHead>
              <TableHead className="sticky left-96 z-30 w-32 min-w-32 border-r bg-muted px-4">
                Durată
              </TableHead>
              <TableHead className="sticky left-[32rem] z-30 w-36 min-w-36 border-r bg-muted px-4 shadow-[6px_0_8px_-8px_var(--foreground)]">
                Investiție
              </TableHead>
              {monthNames.map((monthName) => (
                <TableHead className="w-36 min-w-36 px-4" key={monthName}>
                  {monthName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                className="[&>td]:bg-background even:[&>td]:bg-muted/25"
                key={row.key}
              >
                <TableCell className="sticky left-0 z-20 w-96 min-w-96 whitespace-normal border-r px-4 py-3 font-medium">
                  {row.title}
                </TableCell>
                <TableCell className="sticky left-96 z-20 w-32 min-w-32 border-r px-4 py-3">
                  {row.duration}
                </TableCell>
                <TableCell className="sticky left-[32rem] z-20 w-36 min-w-36 border-r px-4 py-3 shadow-[6px_0_8px_-8px_var(--foreground)]">
                  {row.investment || "—"}
                </TableCell>
                {monthNames.map((_, index) => (
                  <TableCell className="w-36 min-w-36 px-4 py-3" key={index + 1}>
                    {row.months[index + 1] || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
