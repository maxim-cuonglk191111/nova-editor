"use client";
// "Sign in" link that returns to the page the user is on once they are back in.
import Link from "next/link";

export function SignInLink({ label }: { label: string }) {
  const here = typeof window !== "undefined" ? window.location.pathname : "/projects";
  return (
    <Link href={`/login?callbackUrl=${encodeURIComponent(here)}`} style={{ color: "#fca5a5", fontWeight: 700 }}>
      {label}
    </Link>
  );
}
