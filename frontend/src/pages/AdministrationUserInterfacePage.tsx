import { UserInterfaceSettingsTabs } from "@/features/branding/UserInterfaceSettingsTabs";

export function AdministrationUserInterfacePage() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-6">
      <UserInterfaceSettingsTabs />
    </section>
  );
}
