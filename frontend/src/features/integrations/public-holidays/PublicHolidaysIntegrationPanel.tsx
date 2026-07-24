import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlugZap, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/api/http";
import { ApplicationState } from "@/components/ApplicationState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

import {
  createInternalHoliday,
  deleteInternalHoliday,
  fetchPublicHolidays,
  fetchPublicHolidaySettings,
  publicHolidayQueryKeys,
  synchronizePublicHolidays,
  updateInternalHoliday,
  updatePublicHolidaySettings,
} from "./api";
import { InternalHolidayForm } from "./components/InternalHolidayForm";
import { NagerDateSettingsCard } from "./components/NagerDateSettingsCard";
import { PublicHolidayTable } from "./components/PublicHolidayTable";
import type {
  InternalHolidayInput,
  PublicHoliday,
  PublicHolidaySettingsUpdate,
} from "./types";

const emptyHoliday: InternalHolidayInput = {
  date: "",
  local_name: "",
  description: "",
};

const defaultSettings: PublicHolidaySettingsUpdate = {
  enabled: true,
  automatic_sync: true,
  frequency: "6_months",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "Operațiunea nu a putut fi finalizată.";
}

function romanianDateToIso(value: string): string {
  const [day, month, year] = value.split(".");
  return day && month && year ? `${year}-${month}-${day}` : value;
}

export function PublicHolidaysIntegrationPanel() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [settingsDraft, setSettingsDraft] =
    useState<PublicHolidaySettingsUpdate>(defaultSettings);
  const [holidayDraft, setHolidayDraft] =
    useState<InternalHolidayInput>(emptyHoliday);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PublicHoliday | null>(null);

  const settingsQuery = useQuery({
    queryKey: publicHolidayQueryKeys.settings,
    queryFn: fetchPublicHolidaySettings,
    staleTime: 60_000,
  });
  const holidaysQuery = useQuery({
    queryKey: publicHolidayQueryKeys.holidays(year),
    queryFn: () => fetchPublicHolidays(year),
    enabled: year >= 1970 && year <= 2100,
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setSettingsDraft({
      enabled: settingsQuery.data.enabled,
      automatic_sync: settingsQuery.data.automatic_sync,
      frequency: settingsQuery.data.frequency,
    });
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: updatePublicHolidaySettings,
    onError: (error) =>
      toast.error("Setările integrării nu au putut fi salvate", {
        description: getErrorMessage(error),
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(publicHolidayQueryKeys.settings, settings);
      toast.success("Setările integrării Nager.Date au fost salvate.");
    },
  });

  const syncMutation = useMutation({
    mutationFn: synchronizePublicHolidays,
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.root });
      toast.error("Sincronizarea Nager.Date a eșuat", {
        description: getErrorMessage(error),
      });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.root });
      if (result.status === "skipped") {
        toast.warning("Sincronizarea a fost omisă", {
          description: result.message,
        });
        return;
      }
      toast.success("Zilele de sărbătoare au fost sincronizate", {
        description: result.message,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: createInternalHoliday,
    onError: (error) =>
      toast.error("Ziua internă nu a putut fi adăugată", {
        description: getErrorMessage(error),
      }),
    onSuccess: () => {
      setHolidayDraft(emptyHoliday);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.root });
      toast.success("Ziua internă a fost adăugată.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      holidayId,
      values,
    }: {
      holidayId: string;
      values: InternalHolidayInput;
    }) => updateInternalHoliday(holidayId, values),
    onError: (error) =>
      toast.error("Ziua internă nu a putut fi modificată", {
        description: getErrorMessage(error),
      }),
    onSuccess: () => {
      setEditingId(null);
      setHolidayDraft(emptyHoliday);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.root });
      toast.success("Ziua internă a fost actualizată.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInternalHoliday,
    onError: (error) =>
      toast.error("Ziua internă nu a putut fi ștearsă", {
        description: getErrorMessage(error),
      }),
    onSuccess: () => {
      setDeleteCandidate(null);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.root });
      toast.success("Ziua internă a fost ștearsă.");
    },
  });

  function handleHolidaySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!holidayDraft.date || !holidayDraft.local_name.trim()) {
      toast.warning("Completează data și denumirea zilei interne.");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ holidayId: editingId, values: holidayDraft });
      return;
    }
    createMutation.mutate(holidayDraft);
  }

  function startEditing(holiday: PublicHoliday) {
    if (!holiday.is_internal) {
      return;
    }
    setEditingId(holiday.id);
    setHolidayDraft({
      date: romanianDateToIso(holiday.date),
      local_name: holiday.local_name,
      description: holiday.description,
    });
  }

  function requestDelete(holiday: PublicHoliday) {
    if (holiday.is_internal) {
      setDeleteCandidate(holiday);
    }
  }

  if (settingsQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă integrarea Nager.Date și calendarul zilelor nelucrătoare."
        loading
        title="Se încarcă integrările"
      />
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description={getErrorMessage(settingsQuery.error)}
        onAction={() => void settingsQuery.refetch()}
        title="Integrările nu sunt disponibile"
      />
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <PlugZap aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-primary">Setări</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Integrări
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Configurează serviciile externe și zilele interne utilizate în întreaga platformă.
          </p>
        </div>
      </header>

      {holidaysQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(holidaysQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      <NagerDateSettingsCard
        onChange={setSettingsDraft}
        onSave={() => saveSettingsMutation.mutate(settingsDraft)}
        onSync={() => syncMutation.mutate()}
        savePending={saveSettingsMutation.isPending}
        settings={settingsQuery.data}
        syncPending={syncMutation.isPending}
        values={settingsDraft}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.5fr)]">
        <InternalHolidayForm
          editing={editingId !== null}
          onCancel={() => {
            setEditingId(null);
            setHolidayDraft(emptyHoliday);
          }}
          onChange={setHolidayDraft}
          onSubmit={handleHolidaySubmit}
          pending={createMutation.isPending || updateMutation.isPending}
          values={holidayDraft}
        />
        <PublicHolidayTable
          deletePendingId={deleteMutation.isPending ? deleteMutation.variables ?? null : null}
          holidays={holidaysQuery.data ?? []}
          loading={holidaysQuery.isPending || holidaysQuery.isFetching}
          onDelete={requestDelete}
          onEdit={startEditing}
          onYearChange={setYear}
          year={year}
        />
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteCandidate(null);
          }
        }}
        open={deleteCandidate !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Ștergi ziua internă?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate
                ? `„${deleteCandidate.local_name}” din ${deleteCandidate.date} va fi eliminată definitiv din calendarul intern.`
                : "Ziua internă va fi eliminată definitiv."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Renunță
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteCandidate || deleteMutation.isPending}
              onClick={() => {
                if (deleteCandidate) {
                  deleteMutation.mutate(deleteCandidate.id);
                }
              }}
              variant="destructive"
            >
              {deleteMutation.isPending ? <Spinner /> : <Trash2 aria-hidden="true" />}
              Șterge ziua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
