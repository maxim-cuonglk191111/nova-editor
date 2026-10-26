// Subscription page, transaction history and the VietQR checkout modal.
// Plan names and feature lists come from `pricing.planCopy`.

export interface I18nBillingDictionary {
  /** Welcome offer: banner, price badge and checkout note. */
  promoBannerTitle: string;
  /** "{date}" end date, "{days}" whole days left. */
  promoBannerBody: string;
  promoCtaSignUp: string;
  promoCtaPlans: string;
  /** "{percent}" percent off. */
  promoBadge: string;
  promoDismiss: string;
  promoWasPrice: string;
  /** "{percent}" percent off. */
  promoCheckoutNote: string;
  promoTerms: string;
  back: string;
  subscriptionTitle: string;
  historyTitle: string;
  loading: string;
  creditsRemaining: string;
  topUpTitle: string;
  topUp: string;
  /** "{n}" is replaced with the remaining credits. */
  creditsLeft: string;
  /** "{n}" is replaced with the monthly allowance. */
  creditsPerMonth: string;
  unlimitedPlan: string;
  perMonth: string;
  currentPlan: string;
  included: string;
  customPlan: string;
  contactUs: string;

  historyLoading: string;
  historyEmptyTitle: string;
  historyEmptyBody: string;
  colOrder: string;
  colPlan: string;
  colAmount: string;
  colProvider: string;
  colTime: string;
  colStatus: string;
  /** "{plan}" is replaced with the plan name. */
  planName: string;
  statusPaid: string;

  creditsPackLabel: string;
  creditsPackFeatures: string[];
  stepDetails: string;
  stepQr: string;
  stepSuccess: string;
  close: string;
  loginRequiredTitle: string;
  loginRequiredBody: string;
  loginNow: string;
  selectedPlan: string;
  highlights: string;
  agreeTerms: string;
  processing: string;
  proceedToPay: string;
  createLinkFailed: string;
  genericError: string;
  qrAlt: string;
  qrHint: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  transferNote: string;
  copy: string;
  copied: string;
  waitingForPayment: string;
  simulatePayment: string;
  successTitle: string;
  successBody: string;
  /** "{n}" is replaced with the seconds left. */
  reloadingIn: string;
}
