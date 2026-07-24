# Frontend styling

The frontend uses Tailwind CSS v4 and shadcn/ui with the `base-nova` Base UI style.

`src/main.tsx` loads styles in this order:

1. `globals.css` — Tailwind, shadcn utilities, the TUV theme, Preflight, and document defaults.
2. `index.css` — temporary legacy shell styles during the shell migration.
3. `auth.css` — temporary legacy authentication styles during the shell migration.

The legacy component styles will be removed after the shell and login page are rebuilt with shadcn components and Tailwind utilities.

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

Components should use Tailwind semantic utilities such as:

```tsx
<div className="border-border bg-card text-card-foreground" />
<Button className="bg-primary text-primary-foreground" />
```

Do not hard-code reusable colors in components. Change the semantic variables in `globals.css` instead.

## Normalization and reset

Tailwind Preflight is the only browser reset. It is built into `@import "tailwindcss"`, so a separate normalize package or reset stylesheet is intentionally not used.

## shadcn registry

`frontend/components.json` configures:

- Base UI primitives;
- the compact `base-nova` style;
- TypeScript components;
- CSS-variable theming;
- Lucide icons;
- the `@/*` source alias.

Add the complete standard registry with:

```bash
npm run shadcn:add-all
```

Generated component source belongs in `src/components/ui/` and is owned by this repository.

## Validation

Run:

```bash
npm run theme:check
```

The check verifies required shadcn tokens, required Tailwind imports, undefined local custom properties, and direct color literals outside `globals.css`. It runs automatically during `npm run build`.
