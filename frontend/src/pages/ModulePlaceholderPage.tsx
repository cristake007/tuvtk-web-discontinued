import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";

export function ModulePlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center text-center">
          <CardDescription>Modul în pregătire</CardDescription>
          <PageTitle>{title}</PageTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-xl text-center text-base leading-6 text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
