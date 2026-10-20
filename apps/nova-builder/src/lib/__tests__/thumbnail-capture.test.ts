import { describe, it, expect } from "vitest";
import { extractProjectPreviewData, generateProjectThumbnailSvg } from "../thumbnailCapture";
import type { Instance } from "@webstudio-is/sdk";

describe("thumbnailCapture", () => {
  it("extracts title and subtitle from instances map", () => {
    const instances = new Map<string, Instance>();
    instances.set("h1", {
      type: "instance",
      id: "h1",
      component: "Heading",
      children: [{ type: "text", value: "Welcome to Acme Corp" }],
    } as any);
    instances.set("p1", {
      type: "instance",
      id: "p1",
      component: "Paragraph",
      children: [{ type: "text", value: "We build high-performance software." }],
    } as any);

    const { title, subtitle } = extractProjectPreviewData(instances);
    expect(title).toBe("Welcome to Acme Corp");
    expect(subtitle).toBe("We build high-performance software.");
  });

  it("falls back to default title and subtitle when instances are empty", () => {
    const instances = new Map<string, Instance>();
    const { title, subtitle } = extractProjectPreviewData(instances);
    expect(title).toBe("Untitled Website");
    expect(subtitle).toBe("Designed with Nova");
  });

  it("generates a valid SVG data URI containing title and brand", () => {
    const dataUri = generateProjectThumbnailSvg({
      title: "Alpha Innovation",
      subtitle: "The future of automation",
      brand: "Nova Studio",
      theme: "dark",
    });

    expect(dataUri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
    const decoded = decodeURIComponent(dataUri);
    expect(decoded).toContain("Alpha Innovation");
    expect(decoded).toContain("Nova Studio");
    expect(decoded).toContain("<svg");
  });
});
