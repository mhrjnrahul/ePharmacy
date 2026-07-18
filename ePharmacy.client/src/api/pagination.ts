import type { Paginated } from "@/types/pagination"

/** Walks every page of a paginated endpoint and flattens the results.
 *  Use only for populating dropdowns/selects, never for primary list views. */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
): Promise<T[]> {
  const all: T[] = []
  let page = 1
  while (true) {
    const data = await fetchPage(page)
    all.push(...data.results)
    if (!data.next) break
    page += 1
  }
  return all
}
