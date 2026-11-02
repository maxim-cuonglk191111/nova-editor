"use client";
// One insertable component as a card: a scaled live preview on a dot grid, its name and a line of
// description. Click inserts it below the selection; dragging it onto the page drops it there.
import React, { useEffect, useRef, useState } from "react";

function LazyComponentPreview({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full flex items-center justify-center min-h-[50px]">
      {isVisible ? children : (
        <div className="flex flex-col items-center justify-center gap-2 w-full py-4">
          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
}

// Components that are big on their own are scaled down harder to fit the card.
const LARGE = new Set([
  "shadcn:Sidebar", "shadcn:Table", "shadcn:DataTable", "shadcn:Dialog", "shadcn:AlertDialog", "shadcn:Drawer",
  "shadcn:Sheet", "shadcn:Carousel", "shadcn:Command", "shadcn:Row", "shadcn:Row2Cols", "shadcn:Row3Cols",
  "shadcn:Row4Cols", "shadcn:Calendar",
]);

type Props = {
  id: string;
  name: string;
  description: string;
  preview: React.ReactNode;
  onClick: (id: string) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
};

export function ComponentCard({ id, name, description, preview, onClick, onMouseDown }: Props) {
  return (
    <div
      role="button"
      aria-label={name}
      className="group relative shrink-0 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col bg-card select-none border-border hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
      onClick={() => onClick(id)}
      onMouseDown={(e) => onMouseDown(e, id)}
    >
      <div className="w-full h-[120px] flex items-center justify-center relative overflow-hidden bg-muted/20 border-b border-border/40 p-4 select-none pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(ellipse_at_center,_var(--ui-text)_1px,_transparent_1px)] bg-[size:10px_10px]" />
        <div className={`transform ${LARGE.has(id) ? "scale-[0.62]" : "scale-[0.88]"} origin-center max-w-full max-h-full flex items-center justify-center`}>
          <LazyComponentPreview>{preview}</LazyComponentPreview>
        </div>
      </div>
      <div className="p-3.5 flex flex-col gap-1 bg-card/60">
        <div className="text-sm font-semibold text-foreground leading-none">{name}</div>
        <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">{description}</p>
      </div>
    </div>
  );
}
