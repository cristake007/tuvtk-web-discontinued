import { PageMessageFrame } from "@/components/PageMessageFrame";

export function ModulePlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageMessageFrame
      context="Modul în pregătire"
      description={description}
      title={title}
    />
  );
}
