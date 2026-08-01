export function UnsavedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
      Modificări nesalvate
    </span>
  );
}
