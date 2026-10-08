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
  preview: string;
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
}
