import { redirect } from "next/navigation";

// Cut (TEST-ROADMAP Tier C): the old page had a billing-info form that saved nothing.
// VietQR receipts come from the customer's bank; plan and history live on /settings/subscription.
export default function BillingPage() {
  redirect("/settings/subscription");
}
