import { CompanyLogoSettings } from "@/features/branding/CompanyLogoSettings";

export function SettingsPage() {
  return (
    <section className="flex w-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Setările aplicației</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Identitate vizuală</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Configurează sigla afișată în meniul lateral al aplicației.
        </p>
      </div>

      <CompanyLogoSettings />
    </section>
  );
}
