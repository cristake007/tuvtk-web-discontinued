import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QueryApplicationState } from "@/components/QueryApplicationState";
import { formatApiError } from "@/lib/api-errors";
import { saveBlob } from "@/lib/download";

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
};

type ExcelDownloadRequest = {
  filename: string;
  generationId: string;
};

export function CoursePlannerPanel() {
  const queryClient = useQueryClient();
  const scheduleSectionRef = useRef<HTMLDivElement | null>(null);
  const settingsQuery = useQuery({
    queryKey: coursePlannerQueryKey,
    queryFn: fetchCoursePlannerSettings,
    staleTime: 5 * 60_000,
  });
  const [settings, setSettings] = useState<CoursePlannerSettings>(defaultSettings);
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [result, setResult] = useState<GenerateScheduleResponse | null>(null);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      scheduleSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const saveMutation = useMutation({
    mutationFn: saveCoursePlannerSettings,
    onError: (error) =>
      toast.error("Setările nu au putut fi salvate", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(coursePlannerQueryKey, savedSettings);
      toast.success("Setările planificatorului au fost salvate.");
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateCourseSchedule,
    onError: (error) =>
      toast.error("Planificarea nu a putut fi generată", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (response) => {
      setResult(response);
      queryClient.setQueryData(coursePlannerQueryKey, settings);
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
    onError: (error) =>
      toast.error("Fișierul Excel nu a putut fi descărcat", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (blob, request) => {
      saveBlob(blob, request.filename);
      toast.success("Fișierul Excel a fost descărcat.");
    },
  });

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
      ...settings,
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

  const queryState = (
    <QueryApplicationState
      error={settingsQuery.error}
      errorDescription="Setările planificatorului nu au putut fi încărcate."
      errorTitle="Planificatorul nu este disponibil"
      loading={settingsQuery.isPending}
      loadingDescription="Se încarcă setările și ultima configurație a planificatorului."
      loadingTitle="Se încarcă planificatorul"
      onRetry={() => void settingsQuery.refetch()}
    />
  );
  if (settingsQuery.isPending || settingsQuery.isError) {
    return queryState;
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <PlannerHeader />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PlannerConfigurationCard
          file={inputFile}
          generatePending={generateMutation.isPending}
          onClearMonths={() => {
            setSettings((current) => ({ ...current, months: [] }));
            clearResult();
          }}
          onFileChange={(file) => {
            setInputFile(file ?? null);
            clearResult();
          }}
          onGenerate={handleGenerate}
          onRandomnessChange={(randomness) => {
            setSettings((current) => ({ ...current, randomness }));
            clearResult();
          }}
          onSave={() => saveMutation.mutate(settings)}
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
          onDownload={handleDownload}
          result={result}
          selectedMonths={settings.months}
          year={settings.year}
        />
      </div>

      {result ? (
        <div ref={scheduleSectionRef} className="scroll-mt-20">
          <CourseScheduleTable schedule={result.schedule} />
        </div>
      ) : null}
    </div>
  );
}
