import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/GoogleSignIn";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

const errorCopy: Record<string, string> = {
  noemail:
    "Your Google account did not return an email address. Try another account.",
  norole:
    "Your Google account is not in the handbook access list. Ask an administrator to add your email to HANDBOOK_ROLE_MAP.",
  AccessDenied: "Sign-in was cancelled or denied.",
  OAuthAccountNotLinked: "This account could not be linked.",
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error } = await searchParams;
  const message = error ? errorCopy[error] ?? `Sign-in error: ${error}` : null;

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Handbook sign-in</h1>
        <p className="login__lead">
          Internal Triangle ACT content. Use your Google workspace account.
        </p>
        {message ? (
          <p className="login__error" role="alert">
            {message}
          </p>
        ) : null}
        <GoogleSignIn callbackUrl="/" />
      </div>
    </div>
  );
}
