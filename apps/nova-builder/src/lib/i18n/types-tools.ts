// Builder tool panels: AI, accessibility, performance, history, SEO, CMS, tokens, etc.

export interface I18nTimeAgoDictionary {
  justNow: string;
  /** "{n}" is replaced with the number of minutes. */
  minutesAgo: string;
  /** "{n}" is replaced with the number of hours. */
  hoursAgo: string;
  /** "{n}" is replaced with the number of days. */
  daysAgo: string;
}

export interface I18nRailDictionary {
  components: string;
  pages: string;
  navigator: string;
  assets: string;
  styles: string;
  css: string;
  marketplace: string;
}

export interface I18nBreakpointPillsDictionary {
  desktop: string;
  tablet: string;
  mobile: string;
  mobileLandscape: string;
  mobilePortrait: string;
  allSizes: string;
}

export interface I18nAIPanelDictionary {
  title: string;
  building: string;
  placeholder: string;
  shortcutHint: string;
  generate: string;
  generating: string;
  needsAccount: string;
  /** "{status}" is replaced with the HTTP status. */
  genericError: string;
  signUpFree: string;
  tryAgain: string;
  readyTitle: string;
  /** "{count}" is replaced with the number of generated elements. */
  readyBody: string;
  discard: string;
  applyToPage: string;
  /** Shown when the page already has content: generation replaces it; how to change one section. */
  replacesHint: string;
}

export interface I18nAIContentDictionary {
  dialogLabel: string;
  title: string;
  /** "{count}" is replaced with the number of text elements. */
  found: string;
  /** "{count}" text elements inside the selected element "{name}". */
  foundSelection: string;
  placeholder: string;
  generating: string;
  fill: string;
  failed: string;
  /** "{count}" is replaced with the number of filled elements. */
  filled: string;
  /** "{count}" further changes not listed in the preview. */
  more: string;
  undoHint: string;
  discard: string;
  apply: string;
}

export interface I18nA11yDictionary {
  dialogLabel: string;
  title: string;
  checking: string;
  run: string;
  /** "{count}" is replaced with the number of errors. */
  errors: string;
  /** "{count}" is replaced with the number of warnings. */
  warnings: string;
  allClear: string;
  select: string;
  noIssues: string;
  severity: Record<string, string>;
  /** Rule id (img-alt, link-text…) → plain explanation of the issue. */
  rules: Record<string, string>;
  /** Prefix of the fix suggestion line. */
  suggestion: string;
  /** Rule id → fix shown when the AI suggestion is not available. */
  fixes: Record<string, string>;
}

export interface I18nPerfDictionary {
  dialogLabel: string;
  title: string;
  analyzing: string;
  analyze: string;
  /** "{impact}" is replaced with the localised impact level. */
  impact: string;
  impactLevels: Record<string, string>;
  hint: string;
}

export interface I18nHistoryDictionary {
  dialogLabel: string;
  title: string;
  labelPlaceholder: string;
  save: string;
  loading: string;
  empty: string;
  unnamed: string;
  restore: string;
  saved: string;
  saveFailed: string;
  confirmRestore: string;
  restored: string;
  restoreFailed: string;
}

export interface I18nActivityDictionary {
  title: string;
  loading: string;
  empty: string;
  save: string;
  aiCompose: string;
  /** "{label}" is replaced with the snapshot label. */
  snapshotNamed: string;
  snapshot: string;
  /** "{provider}" is replaced with the deploy provider. */
  deploy: string;
  platform: string;
  /** "{branch}" is replaced with the git branch. */
  githubPush: string;
  restore: string;
  comment: string;
}

export interface I18nCommentsDictionary {
  placeholder: string;
  pin: string;
  post: string;
  showResolved: string;
  loading: string;
  empty: string;
  element: string;
  resolve: string;
  unresolve: string;
}

export interface I18nCookieDictionary {
  title: string;
  enable: string;
  message: string;
  acceptLabel: string;
  declineLabel: string;
  position: string;
  positions: Record<string, string>;
  bg: string;
  text: string;
  button: string;
  saved: string;
  save: string;
}

export interface I18nCssPreviewDictionary {
  selectElement: string;
  title: string;
  copyTitle: string;
  copy: string;
  noStyles: string;
}

export interface I18nCmsDictionary {
  title: string;
  fields: Record<string, string>;
  testing: string;
  test: string;
  saveAsResource: string;
  failed: string;
  /** "{count}" is replaced with the item count. */
  fetchedOne: string;
  /** "{count}" is replaced with the item count. */
  fetchedMany: string;
  savedAsResource: string;
  preview: string;
}

export interface I18nDeployDictionary {
  title: string;
  apiToken: string;
  repo: string;
  branch: string;
  siteId: string;
  accountId: string;
  projectName: string;
  deploying: string;
  deploy: string;
  triggered: string;
  /** "{url}" is replaced with the deploy URL. */
  deployed: string;
  failed: string;
}

export interface I18nInteractionsDictionary {
  selectElement: string;
  activeInPreview: string;
  add: string;
  onClick: string;
  onHover: string;
  onFocus: string;
  navigate: string;
  toggleClass: string;
  showHide: string;
  newTab: string;
  classPlaceholder: string;
  targetPlaceholder: string;
}

export interface I18nSeoPanelDictionary {
  home: string;
  pageTitle: string;
  pageTitlePlaceholder: string;
  metaDescription: string;
  metaDescriptionPlaceholder: string;
  canonicalUrl: string;
  robotsDirective: string;
  robotsDefault: string;
  noindex: string;
  openGraph: string;
  ogTitle: string;
  ogTitlePlaceholder: string;
  ogDescription: string;
  ogDescriptionPlaceholder: string;
  ogImage: string;
  noOgImage: string;
  previewTitle: string;
  previewDescription: string;
  redirects: string;
  noRedirects: string;
  redirectFrom: string;
  redirectTo: string;
  addRedirect: string;
  robotsTxt: string;
  viewSitemap: string;
  saved: string;
  save: string;
}

export interface I18nTokensDictionary {
  title: string;
  description: string;
  empty: string;
  remove: string;
  apply: string;
  deleteTitle: string;
  create: string;
  namePlaceholder: string;
  createButton: string;
  selectInstance: string;
  errorRequired: string;
  errorExists: string;
}

export interface I18nToolsDictionary {
  logoAlt: string;
  time: I18nTimeAgoDictionary;
  rail: I18nRailDictionary;
  breakpointPills: I18nBreakpointPillsDictionary;
  ai: I18nAIPanelDictionary;
  aiContent: I18nAIContentDictionary;
  a11y: I18nA11yDictionary;
  perf: I18nPerfDictionary;
  history: I18nHistoryDictionary;
  activity: I18nActivityDictionary;
  comments: I18nCommentsDictionary;
  cookie: I18nCookieDictionary;
  cssPreview: I18nCssPreviewDictionary;
  cms: I18nCmsDictionary;
  deploy: I18nDeployDictionary;
  interactions: I18nInteractionsDictionary;
  seo: I18nSeoPanelDictionary;
  tokens: I18nTokensDictionary;
}
