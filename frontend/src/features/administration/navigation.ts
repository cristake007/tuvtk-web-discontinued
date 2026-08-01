import {
  Database,
  Mail,
  PlugZap,
  Settings2,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdministrationEntry = {
  description: string;
  href?: string;
  name: string;
};

export type AdministrationGroup = {
  entries: AdministrationEntry[];
  icon: LucideIcon;
  name: string;
};

export const administrationGroups: AdministrationGroup[] = [
  {
    entries: [
      {
        description:
          "Configurează identitatea vizuală și opțiunile de prezentare ale platformei.",
        href: "/administrare/sistem/interfata-utilizator",
        name: "Interfață utilizator",
      },
      {
        description: "Parametrii generali utilizați în întreaga platformă.",
        name: "Setări generale",
      },
      {
        description: "Politicile de autentificare și securitate a accesului.",
        name: "Autentificare",
      },
      {
        description: "Preferințele pentru notificările din aplicație.",
        name: "Notificări",
      },
    ],
    icon: Settings2,
    name: "Sistem",
  },
  {
    entries: [
      {
        description: "Gestionarea conturilor utilizatorilor platformei.",
        href: "/administrare/utilizatori",
        name: "Utilizatori",
      },
      {
        description:
          "Creează grupuri, atribuie utilizatori și stabilește aplicațiile disponibile.",
        href: "/administrare/grupuri",
        name: "Grupuri și acces aplicații",
      },
      {
        description: "Organizarea utilizatorilor în echipe și departamente.",
        name: "Echipe și departamente",
      },
      {
        description: "Istoricul autentificărilor și al sesiunilor utilizatorilor.",
        name: "Istoric autentificări",
      },
    ],
    icon: Users,
    name: "Utilizatori",
  },
  {
    entries: [
      {
        description: "Serviciul utilizat pentru trimiterea e-mailurilor.",
        name: "E-mailuri de ieșire",
      },
      {
        description: "Conturile de e-mail conectate la platformă.",
        name: "Conturi e-mail",
      },
      {
        description: "Modelele reutilizabile pentru mesajele trimise.",
        name: "Șabloane e-mail",
      },
    ],
    icon: Mail,
    name: "Mesagerie",
  },
  {
    entries: [
      {
        description: "Elementele, ordinea și accesul în meniul aplicației.",
        name: "Navigație aplicație",
      },
      {
        description: "Procesele automate executate în fundal.",
        name: "Sarcini programate",
      },
      {
        description: "Istoricul acțiunilor administrative importante.",
        name: "Jurnal de activitate",
      },
    ],
    icon: SlidersHorizontal,
    name: "Configurare",
  },
  {
    entries: [
      {
        description: "Importul controlat al datelor în platformă.",
        name: "Import date",
      },
      {
        description: "Fișierele încărcate și utilizate de module.",
        name: "Fișiere atașate",
      },
      {
        description: "Evenimentele și erorile tehnice ale aplicației.",
        name: "Jurnal aplicație",
      },
    ],
    icon: Database,
    name: "Date",
  },
  {
    entries: [
      {
        description:
          "Sincronizează sărbătorile legale și gestionează zilele interne nelucrătoare.",
        href: "/administrare/integrari/zile-libere",
        name: "Zile libere și sărbători",
      },
      {
        description: "Configurează serviciile externe disponibile în platformă.",
        href: "/administrare/integrari",
        name: "Toate integrările",
      },
    ],
    icon: PlugZap,
    name: "Integrări",
  },
];
