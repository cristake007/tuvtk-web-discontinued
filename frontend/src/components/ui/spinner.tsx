import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-label="Se încarcă"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-[4px] border-current border-t-transparent",
        className,
      )}
      data-slot="spinner"
      role="status"
      {...props}
    />
  );
}

export { Spinner };
