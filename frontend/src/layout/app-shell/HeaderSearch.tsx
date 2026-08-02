import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { NavigationItem } from "@/features/core/types";

export function HeaderSearch({ navigation }: { navigation: NavigationItem[] }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ro-RO");
    if (!normalizedQuery) {
      return [];
    }

    return navigation
      .filter((item) => !item.is_separator)
      .filter((item) => {
        const searchableValue = `${item.label} ${item.path}`.toLocaleLowerCase("ro-RO");
        return searchableValue.includes(normalizedQuery);
      })
      .sort((left, right) => left.position - right.position)
      .slice(0, 6);
  }, [navigation, query]);

  useEffect(() => {
    function focusSearch(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function selectResult(path: string) {
    navigate(path);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      selectResult(results[0].path);
    }
  }

  return (
    <div
      className="relative w-full max-w-xl"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      ref={containerRef}
    >
      <InputGroup className="h-10 rounded-sm border-border/80 bg-muted/35 shadow-none transition-colors focus-within:bg-background">
        <InputGroupAddon className="pl-3">
          <Search aria-hidden="true" className="text-primary/70" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Caută în paginile aplicației"
          autoComplete="off"
          className="h-10 text-sm placeholder:text-muted-foreground/80"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Caută pagini..."
          ref={inputRef}
          type="search"
          value={query}
        />
        <InputGroupAddon align="inline-end" className="pr-2.5">
          <kbd className="hidden border border-border bg-background px-1.5 py-0.5 text-[calc(10px*var(--app-font-scale))] font-medium text-muted-foreground shadow-xs sm:inline-flex">
            Ctrl K
          </kbd>
        </InputGroupAddon>
      </InputGroup>

      {open && query.trim() ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-sm border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {results.length > 0 ? (
            <div className="flex flex-col">
              {results.map((item) => (
                <button
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-primary/5 hover:text-primary focus-visible:bg-primary/5 focus-visible:text-primary focus-visible:outline-none"
                  key={item.key}
                  onClick={() => selectResult(item.path)}
                  type="button"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium leading-5">{item.label}</span>
                    <span className="block truncate text-[calc(11px*var(--app-font-scale))] leading-4 text-muted-foreground">
                      {item.path}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-center text-sm text-muted-foreground">
              Nu există pagini corespunzătoare.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
