import type { ShellConfiguration } from "@/features/core/types";

export type FontScale = ShellConfiguration["font_scale"];

export const FONT_SCALE_OPTIONS: ReadonlyArray<{
  description: string;
  label: string;
  value: FontScale;
}> = [
  {
    value: 1,
    label: "Standard · 100%",
    description: "Dimensiunea implicită a textului din aplicație.",
  },
  {
    value: 1.125,
    label: "Mărit · 112,5%",
    description: "Text mai ușor de citit, cu impact redus asupra spațiului disponibil.",
  },
  {
    value: 1.25,
    label: "Foarte mărit · 125%",
    description: "Text vizibil mai mare pe toate paginile aplicației.",
  },
];
