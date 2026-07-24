import { Construction } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ModulePlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center text-center">
          <span className="mb-3 grid size-11 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Construction aria-hidden="true" className="size-5" />
          </span>
          <CardDescription>Module placeholder</CardDescription>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-xl text-center text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
