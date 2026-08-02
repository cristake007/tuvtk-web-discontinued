import * as React from "react"

import { cn } from "@/lib/utils"

function PageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold tracking-tight sm:text-3xl text-heading",
        className
      )}
      {...props}
    />
  )
}

function SectionTitle({
  as: Component = "h2",
  className,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h2" | "h3" }) {
  return (
    <Component
      className={cn(
        "text-lg font-semibold tracking-tight text-heading sm:text-xl",
        className
      )}
      {...props}
    />
  )
}

export { PageTitle, SectionTitle }
