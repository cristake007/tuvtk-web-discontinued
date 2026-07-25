import { FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[76rem] border-collapse text-sm">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="border-b px-4 py-3 font-medium">Curs</th>
                <th className="border-b px-4 py-3 font-medium">Durată</th>
                <th className="border-b px-4 py-3 font-medium">Investiție</th>
                {monthNames.map((monthName) => (
                  <th className="border-b px-4 py-3 font-medium" key={monthName}>
                    {monthName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="odd:bg-background even:bg-muted/25" key={row.key}>
                  <td className="max-w-96 border-b px-4 py-3 font-medium">{row.title}</td>
                  <td className="whitespace-nowrap border-b px-4 py-3">{row.duration}</td>
                  <td className="whitespace-nowrap border-b px-4 py-3">
                    {row.investment || "—"}
                  </td>
                  {monthNames.map((_, index) => (
                    <td className="whitespace-nowrap border-b px-4 py-3" key={index + 1}>
                      {row.months[index + 1] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
