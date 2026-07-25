import { ArrowLeft, CalendarDays, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatApiError } from "@/lib/api-errors";

import { InternalHolidayForm } from "./components/InternalHolidayForm";
import { NagerDateSettingsCard } from "./components/NagerDateSettingsCard";
import { PublicHolidayTable } from "./components/PublicHolidayTable";
import { usePublicHolidaysIntegration } from "./usePublicHolidaysIntegration";

const operationErrorFallback = "Operațiunea nu a putut fi finalizată.";

export function PublicHolidaysIntegrationPanel() {
  const {
    cancelEditing,
    closeDeleteDialog,
    confirmDelete,
    createOrUpdatePending,
    deleteCandidate,
    deletePending,
    deletePendingId,
    editing,
    handleHolidaySubmit,
    holidayDraft,
    holidaysQuery,
    requestDelete,
    saveSettings,
    saveSettingsPending,
    settingsDraft,
    settingsQuery,
    setHolidayDraft,
    setSettingsDraft,
    setYear,
    startEditing,
    synchronize,
    syncPending,
    year,
  } = usePublicHolidaysIntegration();

  if (settingsQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă integrarea Nager.Date și calendarul zilelor nelucrătoare."
        loading
        title="Se încarcă integrarea"
      />
    );
  }

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description={formatApiError(settingsQuery.error, operationErrorFallback)}
        onAction={() => void settingsQuery.refetch()}
        title="Integrarea nu este disponibilă"
      />
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-primary">
              Administrare · Integrări · Nager.Date
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Zile libere și sărbători
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configurează sincronizarea sărbătorilor legale și gestionează zilele
              interne utilizate în întreaga platformă.
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={<Link to="/administrare/integrari" />}
          variant="outline"
        >
          <ArrowLeft aria-hidden="true" />
          Toate integrările
        </Button>
      </header>

      {holidaysQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {formatApiError(holidaysQuery.error, operationErrorFallback)}
          </AlertDescription>
        </Alert>
      ) : null}

      <NagerDateSettingsCard
        onChange={setSettingsDraft}
        onSave={saveSettings}
        onSync={synchronize}
        savePending={saveSettingsPending}
        settings={settingsQuery.data}
        syncPending={syncPending}
        values={settingsDraft}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.5fr)]">
        <InternalHolidayForm
          editing={editing}
          onCancel={cancelEditing}
          onChange={setHolidayDraft}
          onSubmit={handleHolidaySubmit}
          pending={createOrUpdatePending}
          values={holidayDraft}
        />
        <PublicHolidayTable
          deletePendingId={deletePendingId}
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
          if (!open) {
            closeDeleteDialog();
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
            <AlertDialogCancel disabled={deletePending}>Renunță</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteCandidate || deletePending}
              onClick={confirmDelete}
              variant="destructive"
            >
              {deletePending ? <Spinner /> : <Trash2 aria-hidden="true" />}
              Șterge ziua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
