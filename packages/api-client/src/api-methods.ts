// A real `enum` isn't erasable (it emits a runtime object), which this
// workspace's tsconfig forbids (`erasableSyntaxOnly`) — a `const` object +
// union type gets the same ergonomics and compiles away entirely.
export const METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;
export type METHODS = (typeof METHODS)[keyof typeof METHODS];

type PathFn = (params: Record<string, string>) => string;

/**
 * Declarative endpoint definition. `queryKey` doubles as the TanStack Query
 * key for `useQueryEndpoint`; `invalidates` lists query keys a mutation
 * should invalidate on success. `_types` is compile-time only (never
 * populated at runtime) — it lets `TRes`/`TBody`/`TQuery` be inferred at the
 * call site without redundant generic annotations.
 */
export interface EndpointDef<TRes = void, TBody = never, TQuery = never> {
  path: string | PathFn;
  method: METHODS;
  queryKey?: readonly unknown[];
  invalidates?: readonly unknown[];
  _types?: { response: TRes; body: TBody; query: TQuery };
}

export const GET = <TRes, TQuery = never>(
  def: Omit<EndpointDef<TRes, never, TQuery>, 'method'>,
): EndpointDef<TRes, never, TQuery> => ({ ...def, method: METHODS.GET });

export const POST = <TRes, TBody, TQuery = never>(
  def: Omit<EndpointDef<TRes, TBody, TQuery>, 'method'>,
): EndpointDef<TRes, TBody, TQuery> => ({ ...def, method: METHODS.POST });

export const PATCH = <TRes, TBody, TQuery = never>(
  def: Omit<EndpointDef<TRes, TBody, TQuery>, 'method'>,
): EndpointDef<TRes, TBody, TQuery> => ({ ...def, method: METHODS.PATCH });

export const PUT = <TRes, TBody, TQuery = never>(
  def: Omit<EndpointDef<TRes, TBody, TQuery>, 'method'>,
): EndpointDef<TRes, TBody, TQuery> => ({ ...def, method: METHODS.PUT });

export const DELETE = <TQuery = never>(
  def: Omit<EndpointDef<void, never, TQuery>, 'method'>,
): EndpointDef<void, never, TQuery> => ({ ...def, method: METHODS.DELETE });
