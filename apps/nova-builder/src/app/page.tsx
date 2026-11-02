// The landing page. It is the version from before task 028 (sky video hero, dark pill navbar),
// restored because the new one was not liked; see components/landing/legacy.
import LegacyLanding from "@/components/landing/legacy/LegacyLanding";

export const dynamic = "force-dynamic";

export default function Home() {
  return <LegacyLanding />;
}
