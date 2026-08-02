import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SeparatorTitleDialogProps = {
  initialTitle?: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string) => void;
  open: boolean;
};

export function SeparatorTitleDialog({
  initialTitle = "",
  isPending,
  onOpenChange,
  onSave,
  open,
}: SeparatorTitleDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      inputRef.current?.focus();
    }
  }, [initialTitle, open]);

  const normalizedTitle = title.trim();

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedTitle) {
      return;
    }
    onSave(normalizedTitle);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={saveTitle}>
          <DialogHeader>
            <DialogTitle>
              {initialTitle ? "Redenumește separatorul" : "Adaugă separator"}
            </DialogTitle>
            <DialogDescription>
              Titlul va fi afișat în meniul principal între două linii.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="titlu-separator">Titlu separator</Label>
            <Input
              className="mt-2"
              id="titlu-separator"
              maxLength={60}
              onChange={(event) => setTitle(event.target.value)}
              ref={inputRef}
              value={title}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button disabled={isPending} type="button" variant="outline" />}>
              Renunță
            </DialogClose>
            <Button disabled={!normalizedTitle || isPending} type="submit">
              {isPending ? "Se salvează…" : "Salvează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
