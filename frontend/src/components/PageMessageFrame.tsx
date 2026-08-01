import { useId } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";

type PageMessageFrameProps = {
  context: string;
  description: string;
  title: string;
};

export function PageMessageFrame({
  context,
  description,
  title,
}: PageMessageFrameProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="items-center text-center">
          <CardDescription>{context}</CardDescription>
          <PageTitle id={titleId}>{title}</PageTitle>
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
