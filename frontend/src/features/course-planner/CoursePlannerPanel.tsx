import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/api/http";
import { ApplicationState } from "@/components/ApplicationState";

import {
  coursePlannerHistoryQueryKey,
  coursePlannerQueryKey,
  downloadCoursePlanFile,
  fetchCoursePlannerSettings,
  generateCourseSchedule,
  saveCoursePlannerSettings,
} from "./api";
import { CourseScheduleTable } from "./components/CourseScheduleTable";
import { PlannerConfigurationCard } from "./components/PlannerConfigurationCard";
import { PlannerHeader } from "./components/PlannerHeader";
import { PlannerSummaryCard } from "./components/PlannerSummaryCard";
import type { CoursePlannerSettings, GenerateScheduleResponse } from "./types";

const defaultSettings: CoursePlannerSettings = {
  year: new Date().getFullYear(),
  months: [],
  randomness: 5,
  holidays: [],
};

type ExcelDownloadRequest = {
  filename: string;
  generationId: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "Operațiunea nu a putut fi finalizată.";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function CoursePlannerPanel() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: coursePlannerQueryKey,
    queryFn: fetchCoursePlannerSettings,
    staleTime: 5 * 60_000,
  });
  const [settings, setSettings] = useState<CoursePlannerSettings>(defaultSettings);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [holidaysText, setHolidaysText] = useState("");
  const [result, setResult] = useState<GenerateScheduleResponse | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }
    setSettings(settingsQuery.data);
    setHolidaysText(settingsQuery.data.holidays.join("\n"));
  }, [settingsQuery.data]);

  const normalizedHolidays = useMemo(
    () =>
      [...new Set(holidaysText.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))],
    [holidaysText],
  );

  const saveMutation = useMutation({
    mutationFn: saveCoursePlannerSettings,
    onError: (error) => toast.error("Setările nu au putut fi salvate", {
      description: getErrorMessage(error),
    }),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(coursePlannerQueryKey, savedSettings);
      toast.success("Setările planificatorului au fost salvate.");
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateCourseSchedule,
    onError: (error) => toast.error("Planificarea nu a putut fi generată", {
      description: getErrorMessage(error),
    }),
    onSuccess: (response) => {
      setResult(response);
      queryClient.setQueryData(coursePlannerQueryKey, {
        ...settings,
        holidays: normalizedHolidays,
      });
      void queryClient.invalidateQueries({ queryKey: coursePlannerHistoryQueryKey });
      toast.success("Planificarea a fost generată", {
        description: `${response.course_count} cursuri au fost procesate și salvate în istoric.`,
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (request: ExcelDownloadRequest) =>
      downloadCoursePlanFile({
        generationId: request.generationId,
        fileType: "excel",
      }),
    onError: (error) => toast.error("Fișierul Excel nu a putut fi descărcat", {
      description: getErrorMessage(error),
    }),
    onSuccess: (blob, request) => {
      saveBlob(blob, request.filename);
      toast.success("Fișierul Excel a fost descărcat.");
    },
  });

  function currentSettings(): CoursePlannerSettings {
    return {
      ...settings,
      holidays: normalizedHolidays,
    };
  }

  function clearResult() {
    setResult(null);
  }

  function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inputFile) {
      toast.warning("Selectează fișierul cu lista cursurilor.");
      return;
    }
    if (settings.months.length === 0) {
      toast.warning("Selectează cel puțin o lună pentru planificare.");
      return;
    }

    generateMutation.mutate({
      ...currentSettings(),
      inputFile,
    });
  }

  function handleDownload() {
    if (!result) {
      toast.info("Generează mai întâi o planificare.");
      return;
    }

    downloadMutation.mutate({
      generationId: result.generation.id,
      filename:
        result.generation.files.excel.filename ??
        `planificare_cursuri_${result.generation.year}.xlsx`,
    });
  }

  if (settingsQuery.isPending) {
    return (
      <ApplicationState
        description="Se încarcă setările și ultima configurație a planificatorului."
        loading
        title="Se încarcă planificatorul"
      />
    );
  }

  if (settingsQuery.isError) {
    return (
      <ApplicationState
        actionLabel="Încearcă din nou"
        description={getErrorMessage(settingsQuery.error)}
        onAction={() => void settingsQuery.refetch()}
        title="Planificatorul nu este disponibil"
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-7 lg:p-9">
      <PlannerHeader />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PlannerConfigurationCard
          file={inputFile}
          generatePending={generateMutation.isPending}
          holidaysText={holidaysText}
          onClearMonths={() => {
            setSettings((current) => ({ ...current, months: [] }));
            clearResult();
          }}
          onFileChange={(file) => {
            setInputFile(file ?? null);
            clearResult();
          }}
          onGenerate={handleGenerate}
          onHolidaysChange={(value) => {
            setHolidaysText(value);
            clearResult();
          }}
          onRandomnessChange={(randomness) => {
            setSettings((current) => ({ ...current, randomness }));
            clearResult();
          }}
          onSave={() => saveMutation.mutate(currentSettings())}
          onSelectAllMonths={() => {
            setSettings((current) => ({
              ...current,
              months: Array.from({ length: 12 }, (_, index) => index + 1),
            }));
            clearResult();
          }}
          onToggleMonth={(month) => {
            setSettings((current) => ({
              ...current,
              months: current.months.includes(month)
                ? current.months.filter((value) => value !== month)
                : [...current.months, month].sort((left, right) => left - right),
            }));
            clearResult();
          }}
          onYearChange={(year) => {
            setSettings((current) => ({ ...current, year }));
            clearResult();
          }}
          savePending={saveMutation.isPending}
          settings={settings}
        />

        <PlannerSummaryCard
          downloadPending={downloadMutation.isPending}
          file={inputFile}
          holidayCount={normalizedHolidays.length}
          onDownload={handleDownload}
          result={result}
          selectedMonths={settings.months}
          year={settings.year}
        />
      </div>

      {result ? <CourseScheduleTable schedule={result.schedule} /> : null}
    </div>
  );
}
