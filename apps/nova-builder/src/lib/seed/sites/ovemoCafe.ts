import { box, h, p, a, badge, SERIF, MONO, SANS, type Tree, type Styles, type SeedContext } from "../builders";

// ═══ 7. A café: Ovemo, "Over The Moon" ═══════════════════════════════════════
// Prices, hours, phones, address and the slogan are the owner's. The photos and the logo are
// the shop's own, uploaded to the same Supabase "assets" bucket the editor uses for uploads.
// The menu marks some drinks with a small black cat; the profile does not say what the mark
// means, so it is not reproduced.
export function ovemoCafe(ctx: SeedContext): Tree[] {
  const blue = "#0a56a6", deep = "#073b73", ink = "#0f1318", tint = "#e6eefa", white = "#ffffff", moon = "#ffe27a", dot = "#8fb4e3";
  const asset = (file: string) => `${ctx.assetBase}/ovemo/${file}`;
  const photo = (file: string, alt: string, styles: Styles = {}): Tree => ({ component: "Image", label: "Image", props: { src: asset(file), alt }, styles });
  const PHONE_1 = "0328 239 709", PHONE_2 = "0862 901 849";
  const DISPLAY = SERIF;

  // A black cat made of boxes: two ear triangles, a head, a body and two white eyes.
  const cat = (s: number, styles: Styles): Tree => {
    const px = (n: number) => `${Math.round(n * s)}px`;
    const ear = (left: number, tilt: string): Tree => box("Ear", { position: "absolute", left: px(left), top: px(0.02), width: "0", height: "0", borderLeft: `${px(0.1)} solid transparent`, borderRight: `${px(0.1)} solid transparent`, borderBottom: `${px(0.24)} solid ${ink}`, transform: `rotate(${tilt})` });
    const eye = (left: number): Tree => box("Eye", { position: "absolute", left: px(left), top: px(0.4), width: px(0.15), height: px(0.15), borderRadius: "50%", backgroundColor: white }, [
      box("Pupil", { position: "absolute", left: px(0.04), top: px(0.04), width: px(0.07), height: px(0.07), borderRadius: "50%", backgroundColor: ink }),
    ]);
    return box("Cat", { position: "absolute", width: px(1), height: px(1.05), ...styles }, [
      box("Body", { position: "absolute", left: px(0.1), bottom: "0", width: px(0.8), height: px(0.45), backgroundColor: ink, borderRadius: "46% 46% 24% 24%" }),
      box("Head", { position: "absolute", left: px(0.14), top: px(0.16), width: px(0.72), height: px(0.56), backgroundColor: ink, borderRadius: "50% 50% 46% 46%" }),
      ear(0.14, "-12deg"),
      ear(0.66, "12deg"),
      eye(0.3),
      eye(0.55),
    ]);
  };

  const checker = (h: string): Tree =>
    box("Checker", { height: h, backgroundImage: `repeating-conic-gradient(${blue} 0% 25%, ${white} 0% 50%)`, backgroundSize: "44px 44px" });

  // One menu line: drink, dotted leader, prices for ly M and ly L.
  const item = (name: string, prices: string, dark: boolean): Tree =>
    box("Item", { display: "flex", flexWrap: "nowrap", alignItems: "baseline", gap: "10px", padding: "9px 0" }, [
      p(name, { fontFamily: SANS, fontSize: "17px", fontWeight: "600", lineHeight: "1.3", color: dark ? white : ink, margin: "0", flex: "0 1 auto", minWidth: "0" }),
      box("Leader", { flex: "1 1 8px", minWidth: "8px", height: "0", borderBottom: `2px dotted ${dark ? dot : "#9bb6d8"}`, alignSelf: "flex-end", marginBottom: "6px" }),
      p(prices, { fontFamily: SANS, fontSize: "17px", fontWeight: "800", color: dark ? moon : blue, margin: "0", whiteSpace: "nowrap" }),
    ]);

  const group = (title: string, unit: string, rows: Tree[], dark: boolean, tilt: string, extra: Tree[] = []): Tree =>
    box("Group", { flex: "1 1 360px", position: "relative", display: "flex", flexDirection: "column", padding: "30px 32px 22px", backgroundColor: dark ? blue : white, border: `3px solid ${blue}`, borderRadius: "30px", transform: `rotate(${tilt})` }, [
      box("Group head", { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }, [
        h(title, "h3", { fontFamily: DISPLAY, fontSize: "36px", fontWeight: "700", color: dark ? white : blue, margin: "0", letterSpacing: "-0.02em" }),
        p(unit, { fontFamily: MONO, fontSize: "14px", fontWeight: "700", color: dark ? moon : ink, margin: "0", whiteSpace: "nowrap" }),
      ]),
      ...rows,
      ...extra,
    ]);

  const chip = (text: string, bg: string, color: string, tilt: string): Tree =>
    p(text, { fontFamily: SANS, fontSize: "18px", fontWeight: "700", color, margin: "0", padding: "12px 22px", backgroundColor: bg, border: `2px solid ${ink}`, borderRadius: "999px", transform: `rotate(${tilt})` });

  const phone = (number: string, href: string): Tree =>
    a(number, href, { fontFamily: DISPLAY, fontSize: "40px", fontWeight: "700", color: ink, padding: "10px 30px", backgroundColor: moon, border: `3px solid ${ink}`, borderRadius: "999px", boxShadow: `6px 6px 0 ${ink}`, width: "fit-content" });

  return [
    checker("44px"),
    box("Bar", { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", padding: "18px 48px", backgroundColor: white, borderBottom: `3px solid ${blue}` }, [
      h("ovemo.", "h2", { fontFamily: DISPLAY, fontSize: "42px", fontWeight: "700", color: blue, margin: "0", letterSpacing: "-0.04em" }),
      box("Nav", { display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "center" }, [
        a("Menu", "#menu", { fontFamily: SANS, fontSize: "17px", fontWeight: "800", color: blue }),
        a("Topping", "#topping", { fontFamily: SANS, fontSize: "17px", fontWeight: "800", color: blue }),
        a("Ghé quán", "#ghe-quan", { fontFamily: SANS, fontSize: "17px", fontWeight: "800", color: blue }),
      ], { tag: "nav" }),
    ], { tag: "header" }),

    box("Hero", { padding: "80px 48px 96px", backgroundColor: blue, display: "flex", flexWrap: "wrap", gap: "56px", alignItems: "center", overflow: "hidden" }, [
      box("Hero text", { flex: "1 1 460px", display: "flex", flexDirection: "column", gap: "22px" }, [
        badge("Over The Moon · Quy Nhơn Nam", { fontFamily: MONO, color: moon, border: `2px solid ${moon}`, width: "fit-content" }),
        h("Hãy hài lòng bản thân của bạn,", "h1", { fontFamily: DISPLAY, fontSize: "68px", fontWeight: "700", lineHeight: "1.02", letterSpacing: "-0.03em", color: white, margin: "0" }),
        p("đừng cố làm hài lòng người khác.", { fontFamily: DISPLAY, fontSize: "34px", fontStyle: "italic", lineHeight: "1.2", color: moon, margin: "0" }),
        p("Ovemo là quán phê phin, trà sữa, matcha và cacao ở 03 Ngô Đức Đệ, Quy Nhơn Nam. Quán mở cửa từ 7:30 đến 22:30.", { fontFamily: SANS, fontSize: "19px", lineHeight: "1.6", color: tint, margin: "0", maxWidth: "520px" }),
        box("Hero actions", { display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "6px" }, [
          a("Xem menu", "#menu", { fontFamily: SANS, fontSize: "18px", fontWeight: "800", padding: "15px 30px", backgroundColor: white, color: blue, borderRadius: "999px", border: `3px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}` }),
          a(`Gọi ${PHONE_1}`, "tel:0328239709", { fontFamily: SANS, fontSize: "18px", fontWeight: "800", padding: "15px 30px", color: white, borderRadius: "999px", border: `3px solid ${white}` }),
        ]),
      ]),
      box("Hero picture", { flex: "1 1 320px", maxWidth: "430px", position: "relative", transform: "rotate(3deg)" }, [
        photo("ovemo-matcha.jpg", "Ly matcha latte của Ovemo cầm trên tay", { width: "100%", height: "540px", objectFit: "cover", border: `6px solid ${white}`, borderRadius: "215px 215px 28px 28px", boxShadow: `10px 10px 0 ${ink}` }),
        box("Sticker", { position: "absolute", right: "-22px", top: "22px", width: "132px", height: "132px", borderRadius: "50%", backgroundColor: moon, border: `3px solid ${ink}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(10deg)" }, [
          p("ly M từ", { fontFamily: MONO, fontSize: "13px", fontWeight: "700", color: ink, margin: "0" }),
          p("10K", { fontFamily: DISPLAY, fontSize: "44px", fontWeight: "700", lineHeight: "1", color: ink, margin: "0" }),
        ]),
      ]),
    ], { tag: "section" }),

    box("Band", { padding: "16px 48px", backgroundColor: ink }, [
      p("phê phin  ·  trà sữa  ·  matcha  ·  cacao  ·  trà trái cây", { fontFamily: MONO, fontSize: "16px", color: white, margin: "0", textAlign: "center" }),
    ]),

    box("Menu", { padding: "104px 48px 96px", backgroundColor: tint, position: "relative" }, [
      box("Menu head", { display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "24px", marginBottom: "56px" }, [
        h("menu.", "h2", { fontFamily: DISPLAY, fontSize: "96px", fontWeight: "700", lineHeight: "0.9", color: blue, margin: "0", letterSpacing: "-0.05em" }),
        p("Giá ghi theo thứ tự ly M rồi ly L. Món nào chỉ có một cỡ thì ghi rõ cỡ đó.", { fontFamily: SANS, fontSize: "18px", lineHeight: "1.6", color: ink, margin: "0", maxWidth: "420px" }),
      ]),
      box("Groups", { display: "flex", flexWrap: "wrap", gap: "40px 36px", alignItems: "flex-start" }, [
        group("phê phin.", "M · L", [
          item("Phê đen", "10K · 15K", false),
          item("Phê sữa", "12K · 17K", false),
          item("Phê muối", "15K · 20K", false),
          item("Phê hạnh nhân", "15K · 20K", false),
          item("Bạc xỉu", "15K · 20K", false),
          item("Bạc xỉu muối", "18K · 23K", false),
          item("Phê dừa", "18K · 23K", false),
          item("Phê đậu phộng", "20K · 27K", false),
        ], false, "-1deg"),
        group("trà sữa.", "M · L", [
          item("Trà sữa gạo rang", "15K · 20K", true),
          item("Trà sữa Olong nhài", "15K · 20K", true),
          item("Trà sữa hạnh nhân", "18K · 23K", true),
          item("Lục trà sữa xoài", "L 30K", true),
          item("Sơn trà ba tiêu", "L 30K", true),
        ], true, "1deg", [cat(96, { right: "40px", top: "-92px" })]),
        group("matcha.", "M · L", [
          item("Đổi sang matcha Nhật", "+3K · +5K", false),
          item("Matcha latte", "15K · 23K", false),
          item("Matcha oatside", "18K · 27K", false),
          item("Matcha gạo rang", "18K · 27K", false),
          item("Matcha latte kem muối", "18K · 27K", false),
          item("Matcha oatside kem muối", "21K · 30K", false),
          item("Matcha Oreo", "21K · 30K", false),
        ], false, "0.8deg"),
        group("cacao.", "M · L", [
          item("Thêm sốt cacao", "+7K · +13K", true),
          item("Cacao đá", "15K · 20K", true),
          item("Cacao latte", "18K · 25K", true),
          item("Cacao coffee", "18K · 25K", true),
          item("Cacao muối", "18K · 25K", true),
          item("Cacao sữa dừa", "18K · 25K", true),
          item("Choco mint (bạc hà)", "18K · 25K", true),
          item("Choco Oreo", "21K · 30K", true),
        ], true, "-0.8deg"),
        group("trà trái cây.", "bình 1L", [
          item("Lựu đạn", "25K", false),
          item("Quýt xanh lè", "25K", false),
          item("Vải đỏ ruby", "25K", false),
          item("Xoài chanh dây", "25K", false),
          item("Bưởi Yuzuuu", "30K", false),
        ], false, "1deg"),
        box("Cacao photo", { flex: "1 1 300px", maxWidth: "380px", alignSelf: "center", transform: "rotate(-3deg)" }, [
          photo("ovemo-cacao.jpg", "Ly cacao đá của Ovemo cầm trên tay", { width: "100%", height: "460px", objectFit: "cover", border: `6px solid ${white}`, borderRadius: "28px", boxShadow: `9px 9px 0 ${blue}` }),
        ]),
      ]),
    ], { tag: "section", id: "menu" }),

    box("Toppings", { padding: "88px 48px", backgroundColor: white, borderTop: `3px solid ${blue}` }, [
      box("Toppings head", { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "20px", marginBottom: "36px" }, [
        h("topping.", "h2", { fontFamily: DISPLAY, fontSize: "72px", fontWeight: "700", lineHeight: "1", color: blue, margin: "0", letterSpacing: "-0.04em" }),
        p("Mỗi món thêm 5K", { fontFamily: SANS, fontSize: "20px", fontWeight: "800", color: ink, margin: "0" }),
      ]),
      box("Chips", { display: "flex", flexWrap: "wrap", gap: "16px" }, [
        chip("Trân châu trắng / đen / hoàng kim", moon, ink, "-1.2deg"),
        chip("Kem muối / trứng / cheese", blue, white, "1deg"),
        chip("Sương sáo", tint, ink, "-0.8deg"),
        chip("Thạch nổ củ năng", white, ink, "1.4deg"),
        chip("Khúc bạch", moon, ink, "-1deg"),
      ]),
    ], { tag: "section", id: "topping" }),

    box("Visit", { padding: "96px 48px 112px", backgroundColor: blue, display: "flex", flexWrap: "wrap", gap: "56px", alignItems: "center", position: "relative" }, [
      box("Visit text", { flex: "1 1 440px", display: "flex", flexDirection: "column", gap: "18px" }, [
        h("ghé quán.", "h2", { fontFamily: DISPLAY, fontSize: "80px", fontWeight: "700", lineHeight: "1", color: white, margin: "0", letterSpacing: "-0.04em" }),
        p("03 Ngô Đức Đệ, Quy Nhơn Nam, Gia Lai", { fontFamily: SANS, fontSize: "22px", fontWeight: "700", color: white, margin: "0" }),
        p("Mở cửa 7:30 – 22:30", { fontFamily: SANS, fontSize: "20px", color: tint, margin: "0" }),
        p("Gọi hoặc nhắn Zalo, số nào cũng được:", { fontFamily: SANS, fontSize: "18px", color: tint, margin: "10px 0 0" }),
        phone(PHONE_1, "tel:0328239709"),
        phone(PHONE_2, "tel:0862901849"),
      ]),
      box("Visit pictures", { flex: "1 1 300px", maxWidth: "400px", position: "relative", transform: "rotate(-2deg)" }, [
        photo("ovemo-tra-sua.jpg", "Ly trà sữa của Ovemo cầm trên tay, nền đường phố", { width: "100%", height: "480px", objectFit: "cover", border: `6px solid ${white}`, borderRadius: "28px 28px 200px 200px", boxShadow: `10px 10px 0 ${ink}` }),
        photo("ovemo-logo.png", "Logo Ovemo: trăng khuyết và ngôi sao", { position: "absolute", left: "-40px", bottom: "-34px", width: "128px", height: "128px", objectFit: "cover", backgroundColor: white, border: `4px solid ${ink}`, borderRadius: "50%", transform: "rotate(-8deg)" }),
      ]),
      cat(88, { left: "72px", top: "-58px" }),
    ], { tag: "section", id: "ghe-quan" }),

    checker("44px"),
    box("Foot", { padding: "22px 48px", backgroundColor: ink }, [
      p("© 2026 Ovemo · Over The Moon · 03 Ngô Đức Đệ, Quy Nhơn Nam, Gia Lai", { fontFamily: MONO, fontSize: "13px", color: tint, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
