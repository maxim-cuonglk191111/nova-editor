// Public site chrome (landing extras, nav, footer), account menu, error + preview pages.

export interface I18nSiteDictionary {
  /** "{year}" is replaced with the current year. */
  footerRights: string;
  footerPricing: string;
  footerTerms: string;
  footerPrivacy: string;
  footerSupport: string;
  footerProduct: string;
  footerAccount: string;
  footerLegal: string;
  footerTagline: string;
  navHome: string;
  navMenu: string;
  userAvatarAlt: string;
  userFallback: string;
  dismissWelcome: string;
  errorTitle: string;
  /** "{digest}" is replaced with the error digest. */
  errorCode: string;
  errorRetry: string;
  previewLoadFailed: string;
  previewLoading: string;
  sectionErrorTitle: string;
  sectionErrorBody: string;
  sectionErrorReload: string;
}
