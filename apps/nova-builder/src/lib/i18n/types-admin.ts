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
}
