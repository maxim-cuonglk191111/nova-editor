"use client";
// Landing page motion: typing animation for the hero search bar and fade-in on scroll.
import { useState, useEffect, useRef } from "react";

export function useTypingAnimation(phrases: string[], typingSpeed = 60, deleteSpeed = 40, pauseDuration = 2000) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex] || "";
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === currentPhrase) {
      timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else if (isDeleting) {
      timeout = setTimeout(() => setText(text.slice(0, -1)), deleteSpeed);
    } else {
      timeout = setTimeout(() => setText(currentPhrase.slice(0, text.length + 1)), typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases, typingSpeed, deleteSpeed, pauseDuration]);

  return text;
}

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
