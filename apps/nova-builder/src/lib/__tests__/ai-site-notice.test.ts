import { describe, it, expect } from "vitest";
import * as ReactNS from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AISitePlanNotice } from "../../builder/AISitePlanNotice";
import { planSitePages } from "../aiSitePlan";
import { getDictionary } from "../i18n/dictionaries";

// Components in this repo rely on the automatic JSX runtime; vitest here uses the classic one.
(globalThis as { React?: unknown }).React = ReactNS;

describe("AISitePlanNotice", () => {
  it("names every planned page with its path and the cost in generations", () => {
    const names = getDictionary("en").tools.ai.sitePageNames;
    const pages = planSitePages("Tạo website bán hàng có trang chủ, danh sách sản phẩm, chi tiết sản phẩm và thanh toán")!;
    const html = renderToStaticMarkup(
      createElement(AISitePlanNotice, { pages, nameOf: (k) => names[k], onePageOnly: false, onToggle: () => {} })
    );
    expect(html).toContain("This looks like a 4-page website");
    expect(html).toContain("Home (/), Products (/products), Product detail (/product), Checkout (/checkout)");
    expect(html).toContain("uses 4 generations");
    expect(html).toContain("Build one page only");
  });

  it("has Vietnamese copy for every page kind", () => {
    const vi = getDictionary("vi").tools.ai.sitePageNames;
    for (const v of Object.values(vi)) expect(v.length).toBeGreaterThan(0);
    expect(vi.checkout).toBe("Thanh toán");
  });
});
