# Frontend feature conventions

- New features must define TanStack Query keys as one feature-scoped `<feature>QueryKeys` object in `queryKeys.ts`.
- Include an `all` root key and derive child keys or parameterized key factories from it.
- Do not introduce new standalone query-key constants. Existing flat query keys do not need to be retrofitted until their feature is otherwise changed.
