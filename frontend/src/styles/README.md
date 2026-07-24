# Frontend styling

The frontend uses Tailwind CSS v4 and shadcn/ui with the `base-nova` Base UI style.

`src/main.tsx` imports only `globals.css`. That file owns:

- Tailwind and shadcn imports;
- Tailwind Preflight;
- the TUV semantic theme;
- light and dark token values;
- document-level defaults;
- reduced-motion behavior.

Application components use Tailwind utilities and shadcn primitives. There are no shell-specific or authentication-specific global stylesheets.

## Theme contract

`globals.css` is the single theme source. It defines the standard shadcn semantic roles:

```text
background / foreground
card / card-foreground
popover / popover-foreground
primary / primary-foreground
secondary / secondary-foreground
muted / muted-foreground
accent / accent-foreground
destructive
border / input / ring
sidebar roles
chart roles
```

TUV-specific additions include `brand-red`, `success`, and `warning`.

Components use semantic utilities:

```tsx
<div className="border-border bg-card text-card-foreground" />
<Button className="bg-primary text-primary-foreground" />
```

Do not hard-code reusable colors in components. Change semantic variables in `globals.css` instead.

## Application shell

Shell orchestration stays in `src/layout/AppShell.tsx`. Focused shell components live under `src/layout/app-shell/`:

```text
AppHeader.tsx
AppSidebar.tsx
navigation.ts
```

The shell uses the shadcn `SidebarProvider`, `Sidebar`, `SidebarInset`, menu, breadcrumb, avatar, dropdown, alert, spinner, and separator components. Responsive and collapsed states are owned by the shadcn sidebar context rather than custom global CSS.

## Normalization and reset

Tailwind Preflight is the only browser reset. It is included by `@import "tailwindcss"`, so a separate normalize package or reset stylesheet is intentionally not used.

## shadcn registry

`frontend/components.json` configures Base UI primitives, the compact `base-nova` style, TypeScript, CSS-variable theming, Lucide icons, and the `@/*` source alias.

Generated component source belongs in `src/components/ui/` and is owned by this repository. Add individual components when needed instead of regenerating or overwriting the entire registry.

## Validation

Run:

```bash
npm run theme:check
npm run typecheck
npm run build
```

The theme check verifies required shadcn tokens, required Tailwind imports, undefined local custom properties, and direct color literals outside `globals.css`. It runs automatically during `npm run build`.
