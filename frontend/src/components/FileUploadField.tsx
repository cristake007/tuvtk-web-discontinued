import { useState, type DragEvent } from "react";
import { FileUp, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileUploadFieldProps = {
  accept: string;
  description: string;
  disabled?: boolean;
  emptyDescription: string;
  emptyTitle: string;
  file: File | null;
  icon?: LucideIcon;
  id: string;
  label: string;
  onFileChange: (file: File | undefined) => void;
};

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  accept,
  description,
  disabled = false,
  emptyDescription,
  emptyTitle,
  file,
  icon: Icon = FileUp,
  id,
  label,
  onFileChange,
}: FileUploadFieldProps) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (disabled) {
      return;
    }

    onFileChange(event.dataTransfer.files[0]);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        {file ? (
          <Button
            aria-label={`Elimină fișierul ${file.name}`}
            disabled={disabled}
            onClick={() => onFileChange(undefined)}
            size="icon-xs"
            title="Elimină fișierul selectat"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-dashed bg-muted/20 transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-60",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragActive(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="sr-only"
          disabled={disabled}
          id={id}
          onChange={(event) => {
            const selectedFile = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            onFileChange(selectedFile);
          }}
          type="file"
        />

        <label
          className={cn(
            "flex min-h-36 flex-col items-center justify-center gap-3 px-6 py-8 text-center",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
          htmlFor={id}
        >
          <span className="grid size-11 place-items-center rounded-xl border bg-background text-primary shadow-sm">
            <Icon aria-hidden="true" className="size-5" />
          </span>

          {file ? (
            <span className="grid gap-1">
              <span className="max-w-full truncate font-medium text-foreground">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} · apasă pentru a înlocui fișierul
              </span>
            </span>
          ) : (
            <span className="grid gap-1">
              <span className="font-medium text-foreground">{emptyTitle}</span>
              <span className="max-w-md text-xs leading-5 text-muted-foreground">
                {emptyDescription}
              </span>
            </span>
          )}
        </label>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
