// Internal admin console (users + feature flags).

export interface I18nAdminDictionary {
  title: string;
  featureFlagsLink: string;
  searchPlaceholder: string;
  search: string;
  /** "{count}" is replaced with the number of users. */
  usersOne: string;
  /** "{count}" is replaced with the number of users. */
  usersMany: string;
  loading: string;
  /** "{date}" is replaced with the sign-up date. */
  joined: string;
  save: string;
  cancel: string;
  edit: string;
  adminBadge: string;
  /** "{count}" is replaced with the credit balance. */
  credits: string;
  accessDenied: string;
  flagsTitle: string;
  flagKey: string;
  flagDescription: string;
  flagDescriptionPlaceholder: string;
  creating: string;
  addFlag: string;
  flagsEmpty: string;
  on: string;
  off: string;
  deleteFlag: string;
  /** Business overview panel. */
  overviewTitle: string;
  kpiUsers: string;
  /** "{count}" is replaced with the number of sign-ups in the last 7 days. */
  kpiUsersNew: string;
  kpiPaidUsers: string;
  /** "{percent}" is replaced with the paid share of all users. */
  kpiPaidShare: string;
  kpiProjects: string;
  kpiRevenue: string;
  /** "{count}" is replaced with the number of seeded demo orders in the revenue. */
  kpiRevenueDemo: string;
  kpiOrders: string;
  kpiAverage: string;
  /** Says who is left out of the numbers. */
  overviewScope: string;
  transactionsTitle: string;
  transactionsEmpty: string;
  colOrder: string;
  colUser: string;
  colPlan: string;
  colAmount: string;
  colProvider: string;
  colPaidAt: string;
  projectsTitle: string;
  projectsEmpty: string;
  colProject: string;
  colOwner: string;
  colUpdated: string;
  demoBadge: string;
  allUsersTitle: string;
  /** Checkbox above the user list: leave out admins and @testqa.dev accounts. */
  hideInternal: string;
}
