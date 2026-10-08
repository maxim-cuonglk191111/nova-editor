// Projects dashboard, analytics, form submissions, account settings pages.

export interface I18nProjectsDictionary {
  mySites: string;
  upgrade: string;
  newSite: string;
  loadingSites: string;
  retry: string;
  emptyTitle: string;
  emptyBody: string;
  writeOwnPrompt: string;
  /** "{query}" is replaced with the search text. */
  noMatch: string;
  /** "{time}" is replaced with a relative time. */
  edited: string;
  neverSaved: string;
  edit: string;
  viewAnalytics: string;
  viewSubmissions: string;
  duplicate: string;
  deleteSite: string;
  /** Short labels of the site card actions. */
  rename: string;
  renameLabel: string;
  visits: string;
  messages: string;
  copy: string;
  remove: string;
  /** "{name}" is the new site name. */
  renamed: string;
  renameFailed: string;
  newSiteTitle: string;
  newSiteBody: string;
  newSitePlaceholder: string;
  defaultSiteName: string;
  cancel: string;
  building: string;
  buildWithAI: string;
  deleteTitle: string;
  /** "{name}" is replaced with the site name. */
  deleteBody: string;
  deleting: string;
  delete: string;
  createFailed: string;
  deleteFailed: string;
  cloneFailed: string;
}

export interface I18nAnalyticsDictionary {
  title: string;
  loading: string;
  /** "{days}" is replaced with the period length. */
  totalViews: string;
  topPage: string;
  /** "{count}" is replaced with the view count. */
  views: string;
  mostCommonDevice: string;
  /** "{pct}" is replaced with a percentage. */
  pctOfViews: string;
  viewsOverTime: string;
  topPages: string;
  devices: string;
  topReferrers: string;
  noData: string;
  noViewsTitle: string;
  noViewsBody: string;
  desktop: string;
  mobile: string;
  tablet: string;
  /** "{days}" is replaced with the number of days. */
  daysShort: string;
}

export interface I18nSubmissionsDictionary {
  title: string;
  exportCsv: string;
  allForms: string;
  loading: string;
  emptyTitle: string;
  emptyBody: string;
  date: string;
  form: string;
  deleteTitle: string;
  /** "{count}" is replaced with the number of submissions. */
  countOne: string;
  /** "{count}" is replaced with the number of submissions. */
  countMany: string;
}

export interface I18nApiKeysDictionary {
  title: string;
  createTitle: string;
  namePlaceholder: string;
  creating: string;
  create: string;
  createdNotice: string;
  copy: string;
  listTitle: string;
  loading: string;
  empty: string;
  /** "{date}" is replaced with a date. */
  created: string;
  /** "{date}" is replaced with a date. */
  lastUsed: string;
  neverUsed: string;
  revoke: string;
  confirmRevoke: string;
  footerBefore: string;
  footerAfter: string;
}

export interface I18nBrandingDictionary {
  title: string;
  loading: string;
  brandName: string;
  brandNamePlaceholder: string;
  brandNameHint: string;
  logoUrl: string;
  logoHint: string;
  preview: string;
  logoAlt: string;
  saving: string;
  saved: string;
  save: string;
  footer: string;
}

export interface I18nDomainsDictionary {
  title: string;
  addTitle: string;
  adding: string;
  add: string;
  loading: string;
  empty: string;
  dnsHint: string;
  verifying: string;
  verify: string;
  remove: string;
  accessDenied: string;
  failed: string;
}

export interface I18nNotificationTypeCopy {
  label: string;
  description: string;
}

export interface I18nNotificationsPageDictionary {
  title: string;
  loading: string;
  saved: string;
  save: string;
  /** Copy for each notification type, keyed by preference key. */
  types: Record<string, I18nNotificationTypeCopy>;
}

export interface I18nTeamsDictionary {
  title: string;
  loading: string;
  newTeamPlaceholder: string;
  empty: string;
  seatsBilling: string;
  seatsUsed: string;
  perMonth: string;
  perSeat: string;
  members: string;
  invite: string;
  failed: string;
}

export interface I18nDashboardDictionary {
  projects: I18nProjectsDictionary;
  analytics: I18nAnalyticsDictionary;
  submissions: I18nSubmissionsDictionary;
  apiKeys: I18nApiKeysDictionary;
  branding: I18nBrandingDictionary;
  domains: I18nDomainsDictionary;
  notifications: I18nNotificationsPageDictionary;
  teams: I18nTeamsDictionary;
}
