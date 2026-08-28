/**
 * TanStack Query UI helpers — avoid empty-state flicker while the first
 * response is still in flight (or while a dependent query is still booting).
 */

export type QueryBootLike = {
  isPending: boolean;
  isFetching: boolean;
  data: unknown;
};

/** True until we have a first successful `data` (or a settled empty result). */
export function isQueryBooting(query: QueryBootLike): boolean {
  return query.isPending || (query.isFetching && query.data === undefined);
}

/** True if any of the queries are still on their first load. */
export function isAnyQueryBooting(...queries: QueryBootLike[]): boolean {
  return queries.some(isQueryBooting);
}
