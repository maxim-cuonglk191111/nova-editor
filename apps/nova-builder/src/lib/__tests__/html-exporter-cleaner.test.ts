import { describe, it, expect } from "vitest";
import { exportToHtml } from "../htmlExporter";
import type { WebstudioData, Page, Instance } from "@webstudio-is/sdk";

function makeMinimalData(instancesList: Instance[]): WebstudioData {
  const homePage: Page = {
    id: "page_home",
    name: "Home",
    path: "/",
    title: "Test Page",
    meta: {},
    rootInstanceId: "root",
  };

  const pagesMap = new Map<string, Page>();
  pagesMap.set("page_home", homePage);

  const instancesMap = new Map<string, Instance>();
  const rootInstance: Instance = {
    type: "instance",
    id: "root",
    component: "Body",
    children: instancesList.map((inst) => ({ type: "id", value: inst.id })),
  };
  instancesMap.set("root", rootInstance);
  for (const inst of instancesList) {
    instancesMap.set(inst.id, inst);
  }

  return {
    pages: {
      homePageId: "page_home",
      pages: pagesMap,
    },
    instances: instancesMap,
    props: new Map(),
    styles: new Map(),
    styleSources: new Map(),
    styleSourceSelections: new Map(),
    breakpoints: new Map([
      ["base", { id: "base", label: "Base" }],
    ]),
    assets: new Map(),
    dataSources: new Map(),
    resources: new Map(),
  } as unknown as WebstudioData;
}

describe("htmlExporter cleaner (Task 019)", () => {
  it("omits empty Heading tags with no text from exported HTML", () => {
    const data = makeMinimalData([
      {
        type: "instance",
        id: "empty_h1",
        component: "Heading",
        children: [{ type: "text", value: "   " }],
      },
      {
        type: "instance",
        id: "valid_h2",
        component: "Heading",
        children: [{ type: "text", value: "Real Section Title" }],
      },
    ]);

    const html = exportToHtml(data, { title: "Test Page" });
    expect(html).not.toContain("empty_h1");
    expect(html).toContain("Real Section Title");
  });

  it("omits empty Paragraph tags from exported HTML", () => {
    const data = makeMinimalData([
      {
        type: "instance",
        id: "empty_p",
        component: "Paragraph",
        children: [],
      },
      {
        type: "instance",
        id: "valid_p",
        component: "Paragraph",
        children: [{ type: "text", value: "This is real content." }],
      },
    ]);

    const html = exportToHtml(data, { title: "Test Page" });
    expect(html).not.toContain("empty_p");
    expect(html).toContain("This is real content.");
  });

  it("preserves Headings containing non-empty text", () => {
    const data = makeMinimalData([
      {
        type: "instance",
        id: "h1_welcome",
        component: "Heading",
        children: [{ type: "text", value: "Welcome to Nova" }],
      },
    ]);

    const html = exportToHtml(data, { title: "Test Page" });
    expect(html).toContain("Welcome to Nova");
    expect(html).toContain("h2");
  });
});
