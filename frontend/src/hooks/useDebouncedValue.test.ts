import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  afterEach(() => vi.useRealTimers());

  it("publică ultima valoare după întârzierea configurată", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "inițial" },
    });

    rerender({ value: "nou" });
    expect(result.current).toBe("inițial");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("nou");
  });
});
