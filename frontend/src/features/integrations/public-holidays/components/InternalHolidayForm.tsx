import type { FormEvent } from "react";
import { CalendarPlus, Save, X } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { InternalHolidayInput } from "../types";

export function InternalHolidayForm({
  editing,
  pending,
  values,
  onCancel,
  onChange,
  onSubmit,
}: {
  editing: boolean;
  pending: boolean;
  values: InternalHolidayInput;
  onCancel: () => void;
  onChange: (values: InternalHolidayInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <form className="flex flex-col gap-(--card-spacing)" onSubmit={onSubmit}>
        <CardHeader className="border-b">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <CalendarPlus aria-hidden="true" className="size-5" />
            </span>
            <div>
              <CardTitle>{editing ? "Modifică ziua internă" : "Adaugă zi internă"}</CardTitle>
              <CardDescription className="mt-1">
                Zilele interne sunt păstrate separat și nu sunt suprascrise de Nager.Date.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="internal-holiday-date">Data</Label>
            <Input
              id="internal-holiday-date"
              onChange={(event) => onChange({ ...values, date: event.target.value })}
              required
              type="date"
              value={values.date}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal-holiday-name">Denumire</Label>
            <Input
              id="internal-holiday-name"
              maxLength={255}
              onChange={(event) => onChange({ ...values, local_name: event.target.value })}
              placeholder="Exemplu: Zi liberă companie"
              required
              value={values.local_name}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="internal-holiday-description">Descriere</Label>
            <Textarea
              id="internal-holiday-description"
              onChange={(event) => onChange({ ...values, description: event.target.value })}
              placeholder="Motivul sau regulile aplicabile acestei zile interne."
              rows={3}
              value={values.description}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          {editing ? (
            <Button onClick={onCancel} type="button" variant="outline">
              <X aria-hidden="true" />
              Renunță
            </Button>
          ) : null}
          <Button disabled={pending} type="submit">
            <Save aria-hidden="true" />
            {editing ? "Salvează modificările" : "Adaugă ziua"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
