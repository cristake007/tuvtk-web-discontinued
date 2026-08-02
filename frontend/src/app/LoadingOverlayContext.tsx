import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type LoadingOverlayContextValue = {
  beginLoading: () => () => void;
  loadingCount: number;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const beginLoading = useCallback(() => {
    setLoadingCount((count) => count + 1);

    return () => setLoadingCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo<LoadingOverlayContextValue>(
    () => ({
      beginLoading,
      loadingCount,
    }),
    [beginLoading, loadingCount],
  );

  return <LoadingOverlayContext.Provider value={value}>{children}</LoadingOverlayContext.Provider>;
}

export function useLoadingOverlay() {
  const context = useContext(LoadingOverlayContext);

  if (!context) {
    throw new Error("useLoadingOverlay trebuie utilizat în LoadingOverlayProvider.");
  }

  return context;
}
