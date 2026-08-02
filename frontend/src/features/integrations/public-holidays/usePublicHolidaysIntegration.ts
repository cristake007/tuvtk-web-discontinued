import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { formatApiError } from "@/lib/api-errors";

import {
  createInternalHoliday,
  deleteInternalHoliday,
  fetchPublicHolidays,
  fetchPublicHolidaySettings,
  synchronizePublicHolidays,
  updateInternalHoliday,
  updatePublicHolidaySettings,
} from "./api";
import { publicHolidayQueryKeys } from "./queryKeys";
import type { InternalHolidayInput, PublicHoliday, PublicHolidaySettingsUpdate } from "./types";

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

const operationErrorFallback = "Operațiunea nu a putut fi finalizată.";

function romanianDateToIso(value: string): string {
  const [day, month, year] = value.split(".");
  return day && month && year ? `${year}-${month}-${day}` : value;
}

export function usePublicHolidaysIntegration() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [settingsDraft, setSettingsDraft] = useState<PublicHolidaySettingsUpdate>(defaultSettings);
  const [holidayDraft, setHolidayDraft] = useState<InternalHolidayInput>(emptyHoliday);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PublicHoliday | null>(null);

  const settingsQuery = useQuery({
    queryKey: publicHolidayQueryKeys.settings(),
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
      enabled: settingsQuery.data.enabled ?? defaultSettings.enabled,
      automatic_sync: settingsQuery.data.automatic_sync ?? defaultSettings.automatic_sync,
      frequency: settingsQuery.data.frequency ?? defaultSettings.frequency,
    });
  }, [settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: updatePublicHolidaySettings,
    onError: (error) =>
      toast.error("Setările integrării nu au putut fi salvate", {
        description: formatApiError(error, operationErrorFallback),
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(publicHolidayQueryKeys.settings(), settings);
      toast.success("Setările integrării Nager.Date au fost salvate.");
    },
  });

  const syncMutation = useMutation({
    mutationFn: synchronizePublicHolidays,
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.all });
      toast.error("Sincronizarea Nager.Date a eșuat", {
        description: formatApiError(error, operationErrorFallback),
      });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.all });
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
        description: formatApiError(error, operationErrorFallback),
      }),
    onSuccess: () => {
      setHolidayDraft(emptyHoliday);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.all });
      toast.success("Ziua internă a fost adăugată.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ holidayId, values }: { holidayId: string; values: InternalHolidayInput }) =>
      updateInternalHoliday(holidayId, values),
    onError: (error) =>
      toast.error("Ziua internă nu a putut fi modificată", {
        description: formatApiError(error, operationErrorFallback),
      }),
    onSuccess: () => {
      setEditingId(null);
      setHolidayDraft(emptyHoliday);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.all });
      toast.success("Ziua internă a fost actualizată.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInternalHoliday,
    onError: (error) =>
      toast.error("Ziua internă nu a putut fi ștearsă", {
        description: formatApiError(error, operationErrorFallback),
      }),
    onSuccess: () => {
      setDeleteCandidate(null);
      void queryClient.invalidateQueries({ queryKey: publicHolidayQueryKeys.all });
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

  function cancelEditing() {
    setEditingId(null);
    setHolidayDraft(emptyHoliday);
  }

  function requestDelete(holiday: PublicHoliday) {
    if (holiday.is_internal) {
      setDeleteCandidate(holiday);
    }
  }

  function closeDeleteDialog() {
    if (!deleteMutation.isPending) {
      setDeleteCandidate(null);
    }
  }

  function confirmDelete() {
    if (deleteCandidate) {
      deleteMutation.mutate(deleteCandidate.id);
    }
  }

  return {
    cancelEditing,
    closeDeleteDialog,
    confirmDelete,
    createOrUpdatePending: createMutation.isPending || updateMutation.isPending,
    deleteCandidate,
    deletePending: deleteMutation.isPending,
    deletePendingId: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,
    editing: editingId !== null,
    handleHolidaySubmit,
    holidayDraft,
    holidaysQuery,
    requestDelete,
    saveSettings: () => saveSettingsMutation.mutate(settingsDraft),
    saveSettingsPending: saveSettingsMutation.isPending,
    settingsDraft,
    settingsQuery,
    setHolidayDraft,
    setSettingsDraft,
    setYear,
    startEditing,
    synchronize: () => syncMutation.mutate(),
    syncPending: syncMutation.isPending,
    year,
  };
}
