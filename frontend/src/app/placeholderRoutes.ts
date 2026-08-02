export type PlaceholderRouteDefinition = Readonly<{
  applicationKey: string;
  path: string;
  title: string;
  description: string;
  pageTitle: string;
}>;

export const placeholderRoutes = [
  {
    applicationKey: "crm",
    path: "crm",
    title: "CRM",
    description: "Alege un modul CRM din meniul lateral pentru a continua.",
    pageTitle: "CRM",
  },
  {
    applicationKey: "contacte",
    path: "crm/contacte",
    title: "Contacte",
    description: "Modulul pentru gestionarea contactelor va fi disponibil aici.",
    pageTitle: "Contacte",
  },
  {
    applicationKey: "oportunitati",
    path: "crm/oportunitati",
    title: "Oportunități",
    description: "Modulul pentru gestionarea oportunităților va fi disponibil aici.",
    pageTitle: "Oportunități",
  },
  {
    applicationKey: "activitati",
    path: "crm/activitati",
    title: "Activități",
    description: "Modulul pentru gestionarea activităților va fi disponibil aici.",
    pageTitle: "Activități",
  },
  {
    applicationKey: "instruiri",
    path: "training/in-pregatire",
    title: "Training",
    description: "Modulele pentru Training vor fi definite ulterior.",
    pageTitle: "Training",
  },
  {
    applicationKey: "certificari",
    path: "certificari/in-pregatire",
    title: "Certificări",
    description: "Modulele pentru Certificări vor fi definite ulterior.",
    pageTitle: "Certificări",
  },
  {
    applicationKey: "industrial",
    path: "industrial/in-pregatire",
    title: "Industrial",
    description: "Modulele pentru Industrial vor fi definite ulterior.",
    pageTitle: "Industrial",
  },
] as const satisfies readonly PlaceholderRouteDefinition[];
