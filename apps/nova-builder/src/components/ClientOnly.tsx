"use client";
// Renders its children only in the browser. The builder, canvas, project list
// and preview are fully client-driven (data loads after mount), so rendering
// them on the server only burned Worker CPU — on Workers Free (10 ms/request)
// that produced intermittent Error 1102. The server now returns an empty shell.
import { useEffect, useState, type ReactNode } from "react";

export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
