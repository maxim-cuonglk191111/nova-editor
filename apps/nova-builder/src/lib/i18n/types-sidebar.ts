// Builder left sidebar: pages, CSS variables, symbols, custom CSS, components library.

export interface I18nPagesPanelDictionary {
  noPages: string;
  title: string;
  pageName: string;
  pathPlaceholder: string;
  pathShortPlaceholder: string;
  pathParamHintBefore: string;
  pathParamHintAfter: string;
  create: string;
  cancel: string;
  folderName: string;
  createFolder: string;
  addPage: string;
  addFolder: string;
  /** "{name}" is replaced with the folder name. */
  confirmDeleteFolder: string;
  /** "{name}" is replaced with the page name. */
  confirmDeletePage: string;
  seoSettings: string;
  deletePage: string;
  deleteFolder: string;
  seoMeta: string;
  browserTitle: string;
  metaDescription: string;
  metaDescriptionPlaceholder: string;
  noindex: string;
}

export interface I18nCssVarsPanelDictionary {
  title: string;
  empty: string;
  addVariable: string;
  namePlaceholder: string;
  valuePlaceholder: string;
  addButton: string;
  usage: string;
  errorNameRequired: string;
  errorNameFormat: string;
}

export interface I18nSymbolsPanelDictionary {
  title: string;
  namePlaceholder: string;
  selectFirst: string;
  saveTitle: string;
  save: string;
  empty: string;
  /** "{count}" is replaced with the element count. */
  elementOne: string;
  /** "{count}" is replaced with the element count. */
  elementMany: string;
  insertTitle: string;
  insert: string;
  deleteTitle: string;
}

export interface I18nCustomCssPanelDictionary {
  title: string;
  description: string;
  footer: string;
}

export interface I18nComponentsPanelDictionary {
  title: string;
  search: string;
  /** Category headings, keyed by the registry's ComponentCategory. */
  categories: Record<string, string>;
  /**
   * Localised descriptions keyed by component id. Missing entries fall back to
   * the registry's own (English) description, so `en` leaves this empty.
   */
  descriptions: Record<string, string>;
}

export interface I18nSidebarDictionary {
  pages: I18nPagesPanelDictionary;
  cssVars: I18nCssVarsPanelDictionary;
  symbols: I18nSymbolsPanelDictionary;
  customCss: I18nCustomCssPanelDictionary;
  components: I18nComponentsPanelDictionary;
}
