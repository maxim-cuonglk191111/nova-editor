// Public site chrome (landing extras, nav, footer), account menu, error + preview pages.

export interface I18nSiteDictionary {
  /** "{year}" is replaced with the current year. */
  footerRights: string;
  footerPricing: string;
  footerTerms: string;
  footerPrivacy: string;
  footerSupport: string;
  navHome: string;
  navMenu: string;
  typingPhrases: string[];
  connectLead: string;
  connectRest: string;
  connectBody: string;
  exploreIntegrations: string;
  starsAlt: string;
  userAvatarAlt: string;
  userFallback: string;
  dismissWelcome: string;
  errorTitle: string;
  /** "{digest}" is replaced with the error digest. */
  errorCode: string;
  errorRetry: string;
  previewLoadFailed: string;
  previewLoading: string;
}
