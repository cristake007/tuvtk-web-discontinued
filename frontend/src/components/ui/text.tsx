import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      corp: "text-base",
      interfata: "text-sm",
      detaliu: "text-xs",
      eticheta: "text-sm font-medium",
    },
  },
  defaultVariants: {
    variant: "interfata",
  },
})

function Text({
  className,
  variant = "interfata",
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof textVariants>) {
  return <p className={cn(textVariants({ variant }), className)} {...props} />
}

export { Text, textVariants }
