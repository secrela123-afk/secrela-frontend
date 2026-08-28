"use client";

import Link from "next/link";
import { authEnter, authPrimaryBtn } from "./auth-classes";
import { AuthShell } from "./AuthShell";

export function AuthPlaceholder({
  title,
  accent,
  body,
}: {
  title: string;
  accent: string;
  body: string;
}) {
  return (
    <AuthShell>
      <div className={`${authEnter} flex w-full flex-col`}>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-text-primary">
          {title} <span className="text-brand-primary">{accent}</span>
        </h1>
        <p className="mt-4 text-body text-text-secondary">{body}</p>
        <Link href="/login" className={`${authPrimaryBtn} mt-8 inline-flex`}>
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
