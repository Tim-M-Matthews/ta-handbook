import Link from "next/link";
import { auth } from "@/auth";
import { searchRowsForRoles } from "@/lib/content";
import Fuse from "fuse.js";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const rows = searchRowsForRoles(roles);
  const fuse = new Fuse(rows, {
    keys: ["title", "category", "excerpt"],
    threshold: 0.35,
    ignoreLocation: true,
  });
  const query = q.trim();
  const results = query ? fuse.search(query).map((r) => r.item) : [];

  return (
    <>
      <h1 className="h1">Search</h1>
      <form className="shell__search" action="/search" method="get" role="search">
        <label className="sr-only" htmlFor="search-q">
          Query
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search titles and text…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn--small btn--primary">
          Search
        </button>
      </form>
      <p className="search-meta">
        {query
          ? `${results.length} result${results.length === 1 ? "" : "s"}`
          : "Enter a search term."}
      </p>
      {query && results.length === 0 ? (
        <p className="empty">No matches among pages you can access.</p>
      ) : (
        <ul className="search-list" role="list">
          {results.map((hit) => (
            <li key={hit.slug} className="search-hit">
              <h2 className="search-hit__title">
                <Link href={`/p/${hit.slug}`}>{hit.title}</Link>
              </h2>
              <div className="search-hit__cat">{hit.category}</div>
              <p className="search-hit__excerpt">{hit.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
