import Link from "next/link";
import { auth } from "@/auth";
import { listMetaForRoles } from "@/lib/content";

export default async function HomePage() {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const pages = listMetaForRoles(roles);
  const byCategory = new Map<string, typeof pages>();
  for (const p of pages) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const categories = [...byCategory.keys()].sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <>
      <h1 className="h1">Handbook</h1>
      <p className="lead">
        Pages shown here match your roles:{" "}
        <strong>{roles.length ? roles.join(", ") : "—"}</strong>. Edit{" "}
        <code>content/pages</code> and redeploy to publish updates.
      </p>
      {categories.length === 0 ? (
        <p className="empty">No pages available yet. Add markdown under{" "}
          <code>content/pages</code>.
        </p>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="cat" aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`} className="cat__title">
              {cat}
            </h2>
            <ul className="cat__list" role="list">
              {(byCategory.get(cat) ?? []).map((p) => (
                <li key={p.slug} className="cat__item">
                  <Link className="cat__link" href={`/p/${p.slug}`}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
