import { CalendarSync, RefreshCw, Save } from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatRomanianDateTime } from "@/lib/dates";

import type {
  PublicHolidayFrequency,
  PublicHolidaySettings,
  PublicHolidaySettingsUpdate,
} from "../types";

const frequencyLabels: Record<PublicHolidayFrequency, string> = {
  "1_month": "O lună",
  "6_months": "Șase luni",
  "1_year": "Un an",
};

const statusLabels = {
  never: "Nesincronizat",
  success: "Sincronizat",
  skipped: "Omis",
  failed: "Eroare",
} as const;

export function NagerDateSettingsCard({
  settings,
  values,
  onChange,
  onSave,
  onSync,
  savePending,
  syncPending,
}: {
  settings: PublicHolidaySettings;
  values: PublicHolidaySettingsUpdate;
  onChange: (values: PublicHolidaySettingsUpdate) => void;
  onSave: () => void;
  onSync: () => void;
  savePending: boolean;
  syncPending: boolean;
}) {
  const statusVariant = settings.last_status === "failed" ? "destructive" : "secondary";

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarSync aria-hidden="true" className="size-5" />
          </span>
          <div>
            <CardTitle as="h2">Nager.Date România</CardTitle>
            <CardDescription className="mt-1">
              Preia denumirile locale ale sărbătorilor legale și le păstrează în baza de date.
            </CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant={statusVariant}>{statusLabels[settings.last_status]}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="public-holidays-enabled">Integrare activă</Label>
              <p
                className={textVariants({
                  variant: "interfata",
                  className: "mt-1 text-muted-foreground",
                })}
              >
                Permite sincronizarea manuală și automată cu Nager.Date.
              </p>
            </div>
            <Switch
              checked={values.enabled}
              className="cursor-pointer"
              id="public-holidays-enabled"
              onCheckedChange={(enabled) => onChange({ ...values, enabled })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="public-holidays-automatic">Sincronizare automată</Label>
              <p
                className={textVariants({
                  variant: "interfata",
                  className: "mt-1 text-muted-foreground",
                })}
              >
                Celery Beat verifică zilnic dacă sincronizarea este scadentă.
              </p>
            </div>
            <Switch
              checked={values.automatic_sync}
              className="cursor-pointer"
              disabled={!values.enabled}
              id="public-holidays-automatic"
              onCheckedChange={(automatic_sync) => onChange({ ...values, automatic_sync })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="public-holidays-frequency">Interval sincronizare</Label>
            <Select
              disabled={!values.enabled || !values.automatic_sync}
              onValueChange={(frequency) =>
                onChange({
                  ...values,
                  frequency: frequency as PublicHolidayFrequency,
                })
              }
              value={values.frequency}
            >
              <SelectTrigger className="w-full cursor-pointer" id="public-holidays-frequency">
                <SelectValue>{frequencyLabels[values.frequency]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(frequencyLabels) as [PublicHolidayFrequency, string][]).map(
                  ([value, label]) => (
                    <SelectItem className="cursor-pointer" key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <dl
          className={textVariants({
            variant: "detaliu",
            className: "grid content-start gap-3 rounded-lg bg-muted/40 p-4 text-muted-foreground",
          })}
        >
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ultima încercare</dt>
            <dd className="text-right font-medium">
              {formatRomanianDateTime(settings.last_attempted_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ultima sincronizare</dt>
            <dd className="text-right font-medium">
              {formatRomanianDateTime(settings.last_successful_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Următoarea verificare scadentă</dt>
            <dd className="text-right font-medium">
              {formatRomanianDateTime(settings.next_sync_at)}
            </dd>
          </div>
          <div className="border-t pt-3">
            <dt className="text-muted-foreground">Ultimul rezultat</dt>
            <dd
              className={textVariants({
                variant: "detaliu",
                className: "mt-2 grid grid-cols-2 gap-2",
              })}
            >
              <span>Acceptate: {settings.last_accepted_count}</span>
              <span>Create: {settings.last_created_count}</span>
              <span>Actualizate: {settings.last_updated_count}</span>
              <span>Eliminate: {settings.last_removed_count}</span>
            </dd>
          </div>
          {settings.last_error ? (
            <div
              className={textVariants({
                variant: "interfata",
                className: "rounded-md bg-destructive/10 p-3 text-destructive",
              })}
            >
              {settings.last_error}
            </div>
          ) : null}
        </dl>
      </CardContent>

      <CardFooter className="justify-between gap-3">
        <Button disabled={savePending} onClick={onSave} type="button" variant="outline">
          <Save aria-hidden="true" />
          Salvează setările
        </Button>
        <Button
          disabled={!values.enabled || syncPending || settings.sync_in_progress}
          onClick={onSync}
          type="button"
        >
          <RefreshCw aria-hidden="true" />
          Preia zilele acum
        </Button>
      </CardFooter>
    </Card>
  );
}
