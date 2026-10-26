"use client";
// Landing page motion: fade-in on scroll.
import { useState, useEffect, useRef } from "react";

/* ─── Scroll fade-in hook ─── */
export function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, style: { opacity: isVisible ? 1 : 0, transform: isVisible ? "translateY(0)" : "translateY(48px)", transition: "opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)" } };
}

/* ─── FadeSection wrapper ─── */
export function FadeSection({ children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { ref, style: fadeStyle } = useFadeInOnScroll();
  return <div ref={ref} style={{ ...fadeStyle, ...style }} {...props}>{children}</div>;
}
