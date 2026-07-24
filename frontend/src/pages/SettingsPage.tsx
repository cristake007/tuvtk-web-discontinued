import { CompanyLogoSettings } from "@/features/branding/CompanyLogoSettings";


export function SettingsPage() {
  return (
    <section className="flex w-full flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-primary">Application settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Company branding</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          The configured logo is stored in the core database and displayed in the
          sidebar header for authenticated users.
        </p>
      </div>

      <CompanyLogoSettings />
    </section>
  );
}
