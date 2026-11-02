"use client";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@nanostores/react";
import { $aiPanelOpen, openFeatureGate } from "@/lib/nano-states";

/**
 * Opens or closes the AI tab. A signed-out visitor of the demo gets the sign-up gate instead
 * (ADR-NB-022: same button for everyone, the gate sits behind the click). Shared by the top bar
 * and the floating canvas toolbar so both behave the same.
 */
export function useToggleAIPanel(isDemo?: boolean): { open: boolean; toggle: () => void } {
  const open = useStore($aiPanelOpen);
  const { status } = useSession();
  const toggle = useCallback(() => {
    if (isDemo && status !== "authenticated") openFeatureGate("ai");
    else $aiPanelOpen.set(!$aiPanelOpen.get());
  }, [isDemo, status]);
  return { open, toggle };
}
