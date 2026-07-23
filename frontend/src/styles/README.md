# Frontend styling

The frontend uses a layered styling foundation loaded in this order from `src/main.tsx`:

1. `modern-normalize` — modern browser normalization.
2. `theme.css` — primitive scales and semantic design tokens.
3. `reset.css` — project reset and accessibility defaults.
4. `base.css` — document-level typography and surfaces.
5. `index.css` and feature styles — components that consume semantic tokens.

## Token rules

Components use semantic tokens such as:

```css
color: var(--color-text-muted);
background: var(--color-surface-raised);
border-color: var(--color-border);
```

Components must not use palette tokens such as `--palette-brand-500` directly. Palette tokens are implementation details used to define semantic roles in `theme.css`.

Do not place component selectors in `theme.css`. Do not hard-code reusable brand, text, surface, border, status, radius, shadow, or motion values in component styles.

## Token groups

- `--palette-*`: raw color primitives; only `theme.css` should consume them.
- `--color-*`: semantic UI roles used by components.
- `--font-*`, `--line-height-*`, `--letter-spacing-*`: typography.
- `--space-*`: spacing scale.
- `--radius-*`, `--border-*`, `--shadow-*`: shape and elevation.
- `--duration-*`, `--easing-*`: motion.
- `--layout-*`: global shell dimensions.

## Theme scope

The default theme is declared on the document:

```html
<html data-theme="tuvtk">
```

`:root` also receives the same values so the application remains usable before or without an explicit theme attribute. Future themes should override semantic tokens under another `data-theme` selector rather than duplicating component rules.

## Reset policy

`modern-normalize` handles modern browser inconsistencies. `reset.css` contains only application-level behavior that normalization intentionally does not provide, such as consistent box sizing, margin removal, media defaults, focus visibility, and reduced-motion handling.
