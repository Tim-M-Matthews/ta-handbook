import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

type Props = {
  email?: string | null;
  roles: string[];
  children: React.ReactNode;
};

export function AppShell({ email, roles, children }: Props) {
  return (
    <div className="shell">
      <header className="shell__header">
        <div className="shell__brand">
          <Link href="/">Triangle ACT Handbook</Link>
        </div>
        <form className="shell__search" action="/search" method="get" role="search">
          <label className="sr-only" htmlFor="global-search">
            Search handbook
          </label>
          <input
            id="global-search"
            name="q"
            type="search"
            placeholder="Search…"
            autoComplete="off"
          />
          <button type="submit" className="btn btn--small">
            Search
          </button>
        </form>
        <div className="shell__user">
          <span className="shell__email" title={roles.join(", ")}>
            {email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="shell__main">{children}</main>
    </div>
  );
}
