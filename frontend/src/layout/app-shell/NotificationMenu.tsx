import { Bell } from "lucide-react";

import { textVariants } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Deschide notificările"
            className="relative cursor-pointer rounded-sm text-primary hover:bg-primary/5 hover:text-brand-red"
            size="icon-lg"
            title="Notificări"
            variant="ghost"
          />
        }
      >
        <Bell aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-1" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2.5">
            <span
              className={textVariants({
                variant: "interfata",
                className: "block font-semibold text-foreground",
              })}
            >
              Notificări
            </span>
            <span
              className={textVariants({
                variant: "detaliu",
                className: "mt-0.5 block font-normal text-muted-foreground",
              })}
            >
              Actualizările care necesită atenția ta vor apărea aici.
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex min-h-28 flex-col items-center justify-center px-5 py-6 text-center">
          <span className="grid size-9 place-items-center rounded-sm bg-primary/5 text-primary">
            <Bell aria-hidden="true" className="size-4" />
          </span>
          <p className={textVariants({ variant: "eticheta", className: "mt-3 text-foreground" })}>
            Nu există notificări noi
          </p>
          <p
            className={textVariants({
              variant: "detaliu",
              className: "mt-1 leading-5 text-muted-foreground",
            })}
          >
            Ești la zi.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
