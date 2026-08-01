import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { Spinner } from "@/components/ui/spinner";

import { useLoadingOverlay } from "./LoadingOverlayContext";

export function GlobalLoadingOverlay() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const { loadingCount } = useLoadingOverlay();

  if (fetching + mutating + loadingCount === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center bg-background/35 backdrop-blur-sm"
      role="status"
    >
      <Spinner className="size-12 text-primary" />
      <span className="sr-only">Se încarcă</span>
    </div>
  );
}
