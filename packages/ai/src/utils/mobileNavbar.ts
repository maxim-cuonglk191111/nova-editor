// Phone layout for the AI page header. The composer only writes base (desktop)
// styles, so on a phone the <header> row wrapped into a 4–5 line stack. At the
// "mobile" breakpoint (applyWSComposition maps it to max-width 767px) the header
// becomes two compact rows: logo + call-to-action, then the <nav> links on one
// horizontally scrollable line — navigation stays reachable without a menu script.

type Value = { type: "keyword"; value: string } | { type: "unit"; value: number; unit: string };

type Doc = {
  instances: { id: string; children: { type: string; value?: string }[] }[];
  props: { instanceId: string; name: string; value: unknown }[];
  styleSources: { id: string; type: "local" }[];
  styleSourceSelections: { instanceId: string; values: string[] }[];
  styles: { styleSourceId: string; breakpointId: string; property: string; value: Value }[];
};

const kw = (value: string): Value => ({ type: "keyword", value });
const px = (value: number): Value => ({ type: "unit", value, unit: "px" });
const num = (value: number): Value => ({ type: "unit", value, unit: "number" });
const pct = (value: number): Value => ({ type: "unit", value, unit: "%" });

const HEADER: Record<string, Value> = {
  flexWrap: kw("wrap"),
  justifyContent: kw("space-between"),
  alignItems: kw("center"),
  rowGap: px(8),
  columnGap: px(12),
  paddingTop: px(12),
  paddingBottom: px(12),
  paddingLeft: px(16),
  paddingRight: px(16),
};

const NAV: Record<string, Value> = {
  order: num(3),
  flexBasis: pct(100),
  width: pct(100),
  flexWrap: kw("nowrap"),
  overflowX: kw("auto"),
  justifyContent: kw("flex-start"),
  columnGap: px(20),
};

const NAV_ITEM: Record<string, Value> = { whiteSpace: kw("nowrap"), flexShrink: num(0) };

export function addMobileNavbarStyles(doc: Doc, genId: (prefix: string) => string): void {
  const tagOf = (id: string) => doc.props.find((p) => p.instanceId === id && p.name === "tag")?.value;
  const byId = new Map(doc.instances.map((i) => [i.id, i]));
  const childIds = (id: string) => (byId.get(id)?.children ?? []).flatMap((c) => (c.type === "id" && c.value ? [c.value] : []));

  const sourceOf = (instanceId: string) => {
    let sel = doc.styleSourceSelections.find((s) => s.instanceId === instanceId);
    if (!sel) {
      sel = { instanceId, values: [] };
      doc.styleSourceSelections.push(sel);
    }
    if (!sel.values[0]) {
      const id = genId("src_");
      doc.styleSources.push({ id, type: "local" });
      sel.values.push(id);
    }
    return sel.values[0]!;
  };
  const add = (instanceId: string, decls: Record<string, Value>) => {
    const styleSourceId = sourceOf(instanceId);
    for (const [property, value] of Object.entries(decls)) {
      doc.styles.push({ styleSourceId, breakpointId: "mobile", property, value });
    }
  };

  for (const header of doc.instances.filter((i) => tagOf(i.id) === "header")) {
    add(header.id, HEADER);
    for (const nav of childIds(header.id).filter((id) => tagOf(id) === "nav")) {
      add(nav, NAV);
      for (const item of childIds(nav)) add(item, NAV_ITEM);
    }
  }
}
