"use client";

import { signIn } from "next-auth/react";

type Props = {
  callbackUrl?: string;
};

export function GoogleSignIn({ callbackUrl = "/" }: Props) {
  return (
    <button
      type="button"
      className="btn btn--primary"
      onClick={() => signIn("google", { callbackUrl })}
    >
      Continue with Google
    </button>
  );
}
