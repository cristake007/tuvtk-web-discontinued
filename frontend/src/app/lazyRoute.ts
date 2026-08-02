import { lazy, type ComponentType } from "react";

export function lazyRoute<TModule, TExport extends keyof TModule>(
  importer: () => Promise<TModule>,
  exportName: TExport,
) {
  type RouteComponent =
    TModule[TExport] extends ComponentType<infer Props> ? ComponentType<Props> : never;

  return lazy<RouteComponent>(async () => {
    const module = await importer();
    return { default: module[exportName] as RouteComponent };
  });
}
