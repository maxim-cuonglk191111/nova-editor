"use client";
// Reads GET /api/promo once per session state. null until the answer arrives (or when the
// request fails), so the offer never flashes in and prices never change under the user.
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { PromoStatus } from "./promo";

export function usePromo(): PromoStatus | null {
  const { status } = useSession();
  const [promo, setPromo] = useState<PromoStatus | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    fetch("/api/promo", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PromoStatus>) : null))
      .then((data) => { if (!cancelled) setPromo(data); })
      .catch(() => { if (!cancelled) setPromo(null); });
    return () => { cancelled = true; };
  }, [status]);

  return promo;
}
