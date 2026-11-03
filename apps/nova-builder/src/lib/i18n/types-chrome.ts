// Builder chrome: topbar, footer, dialogs, command palette, shortcuts modal.

export interface I18nSaveDialogDictionary {
  titleConfirm: string;
  titleCreate: string;
  titleSaveAs: string;
  confirmBody: string;
  projectLabel: string;
  cancel: string;
  saveAs: string;
  update: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  thumbnailLabel: string;
  thumbnailPlaceholder: string;
  createProject: string;
  saveAsBody: string;
  newNameLabel: string;
  newNamePlaceholder: string;
  back: string;
  saveAsCopy: string;
  untitled: string;
  /** "{name}" is replaced with the original project name. */
  copyName: string;
  errorUpdate: string;
  /** Update refused because another tab saved first. */
  errorConflict: string;
  errorCreate: string;
  /** The session ended before the save reached the server. */
  errorSignedOut: string;
  signInAction: string;
  errorSaveAs: string;
  errorNameRequired: string;
}

export interface I18nShortcutsDictionary {
  title: string;
  search: string;
  /** "{query}" is replaced with the search text. */
  noMatch: string;
  hintBefore: string;
  hintAfter: string;
  keyClick: string;
  keySpace: string;
  groupEdit: string;
  groupSelection: string;
  groupCanvas: string;
  groupPanels: string;
  groupAI: string;
  undo: string;
  redo: string;
  copy: string;
  paste: string;
  duplicate: string;
  delete: string;
  select: string;
  deselect: string;
  navigateTree: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  previewToggle: string;
  openPalette: string;
  openShortcuts: string;
  saveProject: string;
  generateAI: string;
}

export interface I18nPaletteDictionary {
  search: string;
  /** "{query}" is replaced with the search text. */
  noResults: string;
  groupPages: string;
  groupComponents: string;
  groupActions: string;
  navigate: string;
  select: string;
  close: string;
}

export interface I18nChromeDictionary {
  zoomOut: string;
  zoomReset: string;
  zoomIn: string;
  zoomFit: string;
  preview: string;
  /** Label of the current segment of the top-bar switch. */
  design: string;
  /** Accessible name of the floating pill at the bottom of the canvas. */
  canvasToolbar: string;
  /** Tooltip of the + button of the floating toolbar (opens the Add tab). */
  canvasAdd: string;
  /** Tooltip of the AI button of the floating toolbar. */
  canvasAi: string;
  /** Hides or shows the right panel (the inspector). */
  toggleInspector: string;
  /** Notice on phone-sized screens, where the builder has no room for its panels. */
  smallScreenTitle: string;
  smallScreenBody: string;
  smallScreenContinue: string;
  modeSwitch: string;
  previewOpensTab: string;
  saving: string;
  saveFailedRetry: string;
  save: string;
  saved: string;
  /** "{s}" is replaced with seconds. */
  savedSecondsAgo: string;
  /** "{m}" is replaced with minutes. */
  savedMinutesAgo: string;
  generateWithAI: string;
  toastUpdated: string;
  toastUpdateFailed: string;
  toastCreated: string;
  toastCreateFailed: string;
  toastSignedOut: string;
  toastCopySaved: string;
  toastCopyFailed: string;
  toastExported: string;
  toastExportFailed: string;
  toastNoProject: string;
  toastHtmlExported: string;
  toastImported: string;
  toastImportFailed: string;
  exportHtmlTitle: string;
  exportProjectTitle: string;
  importProjectTitle: string;
  unsavedTitle: string;
  unsavedBody: string;
  /** Confirm shown by the builder's back button while autosave has unsent work. */
  leaveUnsaved: string;
  cancel: string;
  import: string;
  language: string;
  undoTitle: string;
  redoTitle: string;
  /** "{count}" is replaced with the number of selected elements. */
  multiSelected: string;
  noSelection: string;
  boldTitle: string;
  italicTitle: string;
  underlineTitle: string;
  linkTitle: string;
  loadingProject: string;
  loadFailed: string;
  loadNotFound: string;
  loadFailedHint: string;
  loadRetry: string;
  dragToResize: string;
  saveDialog: I18nSaveDialogDictionary;
  shortcuts: I18nShortcutsDictionary;
  palette: I18nPaletteDictionary;
  featureGate: I18nFeatureGateDictionary;
}

export interface I18nFeatureGateDictionary {
  titleSave: string;
  descSave: string;
  ctaSave: string;
  titleExportHtml: string;
  descExportHtml: string;
  ctaExportHtml: string;
  titleDeploy: string;
  descDeploy: string;
  ctaDeploy: string;
  titleAssets: string;
  descAssets: string;
  ctaAssets: string;
  titleAI: string;
  descAI: string;
  ctaAI: string;
  badgePro: string;
  badgeFree: string;
  cancel: string;
}
