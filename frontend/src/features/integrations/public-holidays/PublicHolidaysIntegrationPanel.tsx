import { Trash2 } from "lucide-react";

import { QueryApplicationState } from "@/components/QueryApplicationState";
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

  if (settingsQuery.isPending || settingsQuery.isError || !settingsQuery.data) {
    return (
      <QueryApplicationState
        error={settingsQuery.error ?? new Error(operationErrorFallback)}
        errorDescription={operationErrorFallback}
        errorTitle="Integrarea nu este disponibilă"
        loading={settingsQuery.isPending}
        loadingDescription="Se încarcă integrarea Nager.Date și calendarul zilelor nelucrătoare."
        loadingTitle="Se încarcă integrarea"
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">

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
              <Trash2 aria-hidden="true" />
              Șterge ziua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
