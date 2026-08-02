import { CalendarDays, Pencil, Trash2 } from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";

import type { PublicHoliday } from "../types";

export function PublicHolidayTable({
  holidays,
  year,
  loading,
  deletePendingId,
  onDelete,
  onEdit,
  onYearChange,
}: {
  holidays: PublicHoliday[];
  year: number;
  loading: boolean;
  deletePendingId: string | null;
  onDelete: (holiday: PublicHoliday) => void;
  onEdit: (holiday: PublicHoliday) => void;
  onYearChange: (year: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle>Calendar zile nelucrătoare</CardTitle>
            <CardDescription className="mt-1">
              Sărbătorile legale și zilele interne sunt expuse în același calendar central.
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Input
            aria-label="An calendar"
            className="w-28"
            max={2100}
            min={1970}
            onChange={(event) => onYearChange(Number(event.target.value))}
            type="number"
            value={year}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {loading ? null : holidays.length ? (
          <div className="overflow-x-auto">
            <table
              className={textVariants({
                variant: "interfata",
                className: "w-full min-w-[48rem] border-collapse",
              })}
            >
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="border-b px-4 py-3 font-medium">Data</th>
                  <th className="border-b px-4 py-3 font-medium">Denumire</th>
                  <th className="border-b px-4 py-3 font-medium">Sursă</th>
                  <th className="border-b px-4 py-3 font-medium">Descriere</th>
                  <th className="border-b px-4 py-3 text-right font-medium">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday) => (
                  <tr className="odd:bg-background even:bg-muted/20" key={holiday.id}>
                    <td className="whitespace-nowrap border-b px-4 py-3 font-medium tabular-nums">
                      {holiday.date}
                    </td>
                    <td className="border-b px-4 py-3">
                      <span className="font-medium">{holiday.local_name}</span>
                      {holiday.english_name ? (
                        <span
                          className={textVariants({
                            variant: "detaliu",
                            className: "mt-0.5 block text-muted-foreground",
                          })}
                        >
                          {holiday.english_name}
                        </span>
                      ) : null}
                    </td>
                    <td className="border-b px-4 py-3">
                      <Badge variant={holiday.is_internal ? "outline" : "secondary"}>
                        {holiday.is_internal ? "Zi internă" : "Nager.Date"}
                      </Badge>
                    </td>
                    <td className="max-w-80 border-b px-4 py-3 text-muted-foreground">
                      {holiday.description || "—"}
                    </td>
                    <td className="border-b px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`Modifică ${holiday.local_name}`}
                          disabled={!holiday.is_internal}
                          onClick={() => onEdit(holiday)}
                          size="icon-sm"
                          title={
                            holiday.is_internal
                              ? "Modifică ziua internă"
                              : "Zilele Nager.Date se modifică prin sincronizare"
                          }
                          type="button"
                          variant="outline"
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          aria-label={`Șterge ${holiday.local_name}`}
                          disabled={!holiday.is_internal || deletePendingId === holiday.id}
                          onClick={() => onDelete(holiday)}
                          size="icon-sm"
                          title={
                            holiday.is_internal
                              ? "Șterge ziua internă"
                              : "Zilele Nager.Date se elimină prin sincronizare"
                          }
                          type="button"
                          variant="destructive"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <CalendarDays aria-hidden="true" className="size-8 text-muted-foreground" />
            <SectionTitle className="mt-3">Nu există zile salvate pentru {year}</SectionTitle>
            <p
              className={textVariants({
                variant: "corp",
                className: "mt-1 max-w-md leading-6 text-muted-foreground",
              })}
            >
              Rulează sincronizarea Nager.Date sau adaugă o zi internă.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
