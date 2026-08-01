import { type CSSProperties, useMemo } from "react";
import { AlertTriangle, Bell, Sparkles, UserRound } from "lucide-react";

import type { NavigationItem } from "@/features/core/types";
import { getNavigationIcon } from "@/lib/navigation-icons";

import type { CuloriInterfata } from "../useUserInterfaceSettings";

type ScopedThemeStyle = CSSProperties & {
  "--background": string;
  "--brand-red": string;
  "--primary": string;
};

const MAX_ELEMENTE_PREVIZUALIZATE = 6;

const elementeImplicite: NavigationItem[] = [
  { application_key: "core", icon: "LayoutDashboard", is_separator: false, key: "prev-1", label: "Tablou de bord", parent_key: null, path: "/", position: 0 },
  { application_key: "core", icon: "Users", is_separator: false, key: "prev-2", label: "Utilizatori", parent_key: null, path: "/", position: 1 },
  { application_key: "core", icon: "Settings2", is_separator: false, key: "prev-3", label: "Administrare", parent_key: null, path: "/", position: 2 },
];

function luminantaPerceputa(hex: string): number | null {
  const potrivire = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!potrivire) {
    return null;
  }
  const valoare = Number.parseInt(potrivire[1], 16);
  const r = (valoare >> 16) & 255;
  const g = (valoare >> 8) & 255;
  const b = valoare & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function RandNavigatiePrevizualizare({
  activ,
  item,
}: {
  activ: boolean;
  item: NavigationItem;
}) {
  if (item.is_separator) {
    return (
      <div aria-hidden="true" className="flex items-center gap-1.5 px-3 py-1.5">
        <span className="h-px min-w-2 flex-1 bg-sidebar-border" />
        <span className="max-w-16 truncate text-[8px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {item.label}
        </span>
        <span className="h-px min-w-2 flex-1 bg-sidebar-border" />
      </div>
    );
  }

  const Icon = getNavigationIcon(item.icon);

  return (
    <div
      className={[
        "relative flex h-7 items-center gap-2 px-3 text-[11px] text-primary transition-colors",
        "before:absolute before:inset-y-0 before:left-0 before:w-[2.5px] before:bg-brand-red",
        activ ? "bg-primary/5 pl-3.5 font-semibold text-brand-red before:opacity-100" : "before:opacity-0",
      ].join(" ")}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </div>
  );
}

export function LiveShellPreview({
  culori,
  elemente,
  logoUrl,
  numeAplicatie,
  organizationName,
}: {
  culori: CuloriInterfata;
  elemente: NavigationItem[];
  logoUrl: string | null;
  numeAplicatie: string;
  organizationName: string;
}) {
  const elementeAfisate = useMemo(() => {
    const sursa = elemente.length > 0 ? elemente : elementeImplicite;
    return sursa.slice(0, MAX_ELEMENTE_PREVIZUALIZATE);
  }, [elemente]);

  const primulElementActiv = elementeAfisate.find((item) => !item.is_separator)?.key;

  const luminanta = luminantaPerceputa(culori.culoare_fundal);
  const contrastRedus = luminanta !== null && luminanta < 0.4;

  const stilTema: ScopedThemeStyle = {
    "--background": culori.culoare_fundal,
    "--brand-red": culori.culoare_accent,
    "--primary": culori.culoare_primara,
  };

  return (
    <section aria-label="Previzualizare live a interfeței" className="grid gap-2">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Previzualizare live</h2>
        <span className="text-xs text-muted-foreground">
          Reflectă modificările nesalvate din formularele de mai jos.
        </span>
      </div>

      <div
        className="w-full overflow-hidden rounded-xl border shadow-sm"
        style={stilTema}
      >
        <div className="flex h-11 items-center gap-3 border-b border-border/70 bg-white px-3">
          {logoUrl ? (
            <img
              alt={`Sigla ${organizationName}`}
              className="h-6 max-w-24 object-contain"
              src={logoUrl}
            />
          ) : (
            <span className="truncate text-xs font-bold tracking-wide text-primary">
              {numeAplicatie.trim() || "Aplicație fără nume"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Bell aria-hidden="true" className="size-3.5" />
            <span className="grid size-5 place-items-center rounded-full bg-muted">
              <UserRound aria-hidden="true" className="size-3" />
            </span>
          </div>
        </div>

        <div className="flex h-52">
          <nav
            aria-label="Exemplu de navigație"
            className="flex w-32 shrink-0 flex-col gap-0.5 overflow-hidden border-r border-sidebar-border bg-white py-2 sm:w-40"
          >
            {elementeAfisate.map((item) => (
              <RandNavigatiePrevizualizare
                activ={item.key === primulElementActiv}
                item={item}
                key={item.key}
              />
            ))}
          </nav>

          <div className="flex-1 space-y-3 bg-background p-4">
            <div className="h-2 w-3/4 rounded-full bg-foreground/15" />
            <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
            <div className="flex items-center gap-2 pt-1">
              <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                Buton principal
              </span>
              <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-medium text-white">
                Etichetă accent
              </span>
            </div>
          </div>
        </div>
      </div>

      {contrastRedus ? (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
          Fundalul ales este închis, iar textul din aplicație are o culoare fixă — verifică
          lizibilitatea înainte de a salva.
        </p>
      ) : null}
    </section>
  );
}
