// Builder right panel: Style inspector + CSS editors, Props, Settings, Form settings, breakpoints.

export interface I18nStyleEditorsDictionary {
  remove: string;
  /** "{label}" is replaced with the panel name. */
  addItem: string;
  /** "{label}" is replaced with the panel name. */
  removeItem: string;
  /** "{label}" is replaced with the panel name. */
  addFunction: string;
  transform: string;
  translate: string;
  rotate: string;
  scale: string;
  skew: string;
  boxShadow: string;
  textShadow: string;
  blur: string;
  spread: string;
  color: string;
  inset: string;
  insetIn: string;
  insetOut: string;
  removeShadow: string;
  filter: string;
  backdropFilter: string;
  fn: string;
  value: string;
  alpha: string;
  transition: string;
  animation: string;
  property: string;
  duration: string;
  delay: string;
  easing: string;
  name: string;
  repeat: string;
  direction: string;
  fill: string;
  gradient: string;
  addGradient: string;
  removeGradient: string;
  removeStop: string;
  addStop: string;
  linear: string;
  radial: string;
  ellipse: string;
  circle: string;
  gridTracks: string;
  columns: string;
  rows: string;
  /** "{label}" is replaced with the lower-cased track kind. */
  noTracks: string;
  /** "{label}" is replaced with the lower-cased track kind. */
  addTrack: string;
  removeTrack: string;
  /** Shown for a responsive repeat(auto-fit, …) track list. */
  autoTracks: string;
  gridPlacement: string;
  colStartSpan: string;
  columnStartLine: string;
  columnSpan: string;
  rowStartSpan: string;
  rowStartLine: string;
  rowSpan: string;
  gridColumnPosition: string;
  gpcCol: string;
  gpcEnd: string;
  gpcSpan: string;
  /** "{col}" is replaced with the column number. */
  gpcColumn: string;
  /** "{start}" / "{end}" are replaced with column numbers. */
  gpcRange: string;
}

export interface I18nPropsPanelDictionary {
  selectElement: string;
  componentProps: string;
  customProps: string;
  noProps: string;
  content: string;
  contentHint: string;
  defaultOption: string;
  pickFromLibrary: string;
  assetManagerSoon: string;
  previewAlt: string;
  /** Shown in the image picker when the project has no uploaded images. */
  libraryEmpty: string;
  /** Under a variant select when the element has its own colours in the Style tab. */
  variantOverridden: string;
  /** Friendly labels for common component props, keyed by prop name. */
  propLabels: Record<string, string>;
  /** Friendly labels for select options, keyed by option value (e.g. "_blank"). */
  optionLabels: Record<string, string>;
}

export interface I18nSettingsPanelDictionary {
  selectInstance: string;
  noProps: string;
  objectFit: string;
  /** Labels for well-known props, keyed by prop name. */
  propLabels: Record<string, string>;
  targetSelf: string;
  targetBlank: string;
  loadingLazy: string;
  loadingEager: string;
  decodingAuto: string;
  decodingAsync: string;
  decodingSync: string;
}

export interface I18nFormSettingsDictionary {
  selectElement: string;
  noSettings: string;
  defaultOption: string;
  /** Field labels keyed by field id. */
  fields: Record<string, string>;
}

export interface I18nBreakpointsDictionary {
  title: string;
  label: string;
  min: string;
  max: string;
  condition: string;
  allSizes: string;
  conditionPlaceholder: string;
  baseCannotDelete: string;
  deleteBreakpoint: string;
  add: string;
}

export interface I18nInspectorDictionary {
  cascade: string;
  removeToken: string;
  /** "{name}" is replaced with the token name. */
  fromToken: string;
  selectInstance: string;
  noSharedStyles: string;
  /** "{state}" is replaced with the pseudo-state, e.g. ":hover". */
  noStateStyles: string;
  noStyles: string;
  /** "{count}" is replaced with the number of selected instances. */
  instancesSelected: string;
  sharedOnly: string;
  /** Style section headings keyed by SectionName. */
  sections: Record<string, string>;
  stateDefault: string;
  propertyPlaceholder: string;
  valuePlaceholder: string;
  expressionPlaceholder: string;
  /** Heading above the "add a style" row. */
  addStyle: string;
  /** Tooltip of the × button that removes a style value. */
  removeValue: string;
  /** Human-readable CSS property names, keyed by camelCase property. */
  propNames: Record<string, string>;
  /** Plain-language tooltips for the pseudo-state pills, keyed by state (":hover"). */
  stateHints: Record<string, string>;
  editors: I18nStyleEditorsDictionary;
  props: I18nPropsPanelDictionary;
  settings: I18nSettingsPanelDictionary;
  form: I18nFormSettingsDictionary;
  breakpoints: I18nBreakpointsDictionary;
}
