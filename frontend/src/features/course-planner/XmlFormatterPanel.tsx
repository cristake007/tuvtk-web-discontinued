import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileCode2 } from "lucide-react";
import { toast } from "sonner";

import { AntetAplicatie } from "@/components/AntetAplicatie";
import { FileUploadField } from "@/components/FileUploadField";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/heading";
import { formatApiError } from "@/lib/api-errors";
import { saveBlob } from "@/lib/download";

import { formatXmlSchedule } from "./api";

export function XmlFormatterPanel() {
  const [inputFile, setInputFile] = useState<File | null>(null);

  const formatMutation = useMutation({
    mutationFn: formatXmlSchedule,
    onError: (error) =>
      toast.error("Fișierul XML nu a putut fi generat", {
        description: formatApiError(error, "Operațiunea nu a putut fi finalizată."),
      }),
    onSuccess: (blob) => {
      saveBlob(blob, `formatted_courses_${new Date().getFullYear()}.xml`);
      toast.success("Fișierul XML a fost generat și descărcat.");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inputFile) {
      toast.warning("Selectează fișierul cu programul cursurilor.");
      return;
    }

    formatMutation.mutate(inputFile);
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <AntetAplicatie titlu="XML cursuri" />

      <section className="grid max-w-2xl gap-6 rounded-sm border bg-background p-6 shadow-sm">
        <div>
          <SectionTitle>
            Generează XML pentru WordPress
          </SectionTitle>
          <p className="mt-1 text-base leading-6 text-muted-foreground">
            Încarcă un fișier CSV sau Excel cu coloanele Title, Permalink și coloane de
            lună (January–December sau Luna 1–Luna 12) pentru a obține un fișier XML
            pregătit pentru import în WordPress.
          </p>
        </div>

        <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
          <FileUploadField
            accept=".csv,.xlsx,.xls"
            description="Coloane obligatorii: Title și Permalink, plus cel puțin o coloană de lună."
            disabled={formatMutation.isPending}
            emptyDescription="Trage fișierul aici sau apasă pentru a-l selecta. Sunt acceptate CSV, XLSX și XLS."
            emptyTitle="Încarcă programul cursurilor"
            file={inputFile}
            icon={FileCode2}
            id="xml-input-file"
            label="Fișier cu programul cursurilor"
            onFileChange={(file) => setInputFile(file ?? null)}
          />

          <div className="flex justify-end">
            <Button disabled={formatMutation.isPending} size="lg" type="submit">
              <FileCode2 aria-hidden="true" />
              {formatMutation.isPending ? "Se generează…" : "Generează XML"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
