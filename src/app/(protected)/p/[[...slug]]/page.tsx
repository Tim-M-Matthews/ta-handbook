import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { auth } from "@/auth";
import { getDocBySlug } from "@/lib/content";
import { userCanViewPage } from "@/lib/roles";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function HandbookPage({ params }: Props) {
  const { slug: parts } = await params;
  const slug = parts?.join("/");
  if (!slug) notFound();

  const session = await auth();
  const userRoles = session?.user?.roles ?? [];
  const doc = getDocBySlug(slug);
  if (!doc) notFound();
  if (!userCanViewPage(userRoles, doc.roles)) notFound();

  return (
    <>
      <p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>
        <Link href="/">← Handbook home</Link>
        {" · "}
        <span style={{ color: "var(--muted)" }}>{doc.category}</span>
      </p>
      <article className="prose">
        <h1>{doc.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body}</ReactMarkdown>
      </article>
    </>
  );
}
