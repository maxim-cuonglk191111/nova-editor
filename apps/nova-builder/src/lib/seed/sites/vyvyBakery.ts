import { box, h, p, a, img, badge, SERIF, MONO, SANS, type Tree } from "../builders";

// ═══ 6. A bakery: Tiệm bánh VyVy ═════════════════════════════════════════════
// Facts come from the owner's brand profile and nothing is added to them: no flavours described,
// no sizes named, no delivery area promised. The photos are stand-ins for the shop's own.
export function vyvyBakery(): Tree[] {
  const cream = "#fbf4e4", white = "#fffdf6", forest = "#1f3d2b", pandan = "#5d8a3a", cocoa = "#4a2c22", blush = "#f7d3c8", yolk = "#f4c542";
  const PHONE = "0775 624 683", TEL = "tel:0775624683";

  // One line of the cake menu: name, a dotted leader, then the prices.
  const cakeRow = (name: string, price: string, best = false): Tree =>
    box("Cake row", { display: "flex", alignItems: "baseline", gap: "12px", padding: "14px 0" }, [
      h(name, "h3", { fontFamily: SERIF, fontSize: "26px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0" }),
      ...(best ? [badge("bán chạy nhất", { fontFamily: SANS, fontSize: "12px", fontWeight: "700", color: forest, backgroundColor: yolk, border: `2px solid ${cocoa}`, transform: "rotate(-3deg)" })] : []),
      box("Leader", { flex: "1 1 24px", height: "0", borderBottom: `3px dotted ${cocoa}`, opacity: "0.45", alignSelf: "flex-end", marginBottom: "6px" }),
      p(price, { fontFamily: SERIF, fontSize: "24px", fontWeight: "700", color: forest, margin: "0", whiteSpace: "nowrap" }),
    ]);

  // A snack as a price tag stuck on at a slight angle.
  const tag = (name: string, price: string, note: string, bg: string, tilt: string): Tree =>
    box("Snack tag", { flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "4px", padding: "20px 22px", backgroundColor: bg, border: `2px solid ${cocoa}`, borderRadius: "18px", boxShadow: `5px 5px 0 ${cocoa}`, transform: `rotate(${tilt})` }, [
      h(name, "h3", { fontFamily: SERIF, fontSize: "23px", fontStyle: "italic", fontWeight: "400", lineHeight: "1.2", color: cocoa, margin: "0" }),
      p(price, { fontFamily: SERIF, fontSize: "36px", fontWeight: "700", lineHeight: "1.1", color: forest, margin: "0" }),
      ...(note ? [p(note, { fontFamily: SANS, fontSize: "14px", fontWeight: "700", color: cocoa, margin: "4px 0 0" })] : []),
    ]);

  const creamCard = (title: string, text: string, bg: string, tilt: string): Tree =>
    box("Cream card", { flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "8px", padding: "24px 26px", backgroundColor: bg, border: `2px solid ${cocoa}`, borderRadius: "22px", transform: `rotate(${tilt})` }, [
      h(title, "h3", { fontFamily: SERIF, fontSize: "28px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0" }),
      p(text, { fontFamily: SANS, fontSize: "17px", lineHeight: "1.55", color: cocoa, margin: "0" }),
    ]);

  const step = (n: string, title: string, text: string): Tree =>
    box("Step", { flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "8px" }, [
      p(n, { fontFamily: SERIF, fontSize: "72px", fontStyle: "italic", lineHeight: "1", color: pandan, margin: "0" }),
      h(title, "h3", { fontFamily: SERIF, fontSize: "26px", fontWeight: "700", color: cocoa, margin: "0" }),
      p(text, { fontFamily: SANS, fontSize: "17px", lineHeight: "1.6", color: cocoa, margin: "0" }),
    ]);

  const who = (text: string, bg: string, tilt: string): Tree =>
    p(text, { fontFamily: SANS, fontSize: "18px", fontWeight: "700", color: cocoa, margin: "0", padding: "12px 22px", backgroundColor: bg, border: `2px solid ${cocoa}`, borderRadius: "999px", transform: `rotate(${tilt})` });

  return [
    box("Bar", { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", padding: "18px 48px", backgroundColor: cream, borderBottom: `2px dashed ${cocoa}` }, [
      h("VyVy", "h2", { fontFamily: SERIF, fontSize: "38px", fontStyle: "italic", fontWeight: "700", color: forest, margin: "0", letterSpacing: "-0.02em" }),
      box("Nav", { display: "flex", flexWrap: "wrap", gap: "26px", alignItems: "center" }, [
        a("Bánh kem", "#banh-kem", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cocoa }),
        a("Bánh ăn vặt", "#banh-an-vat", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cocoa }),
        a("Cách đặt", "#cach-dat", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cocoa }),
        a("Liên hệ", "#lien-he", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cocoa }),
      ], { tag: "nav" }),
    ], { tag: "header" }),

    box("Hero", { padding: "72px 48px 88px", backgroundColor: cream, display: "flex", flexWrap: "wrap", gap: "56px", alignItems: "center", overflow: "hidden" }, [
      box("Hero text", { flex: "1 1 440px", display: "flex", flexDirection: "column", gap: "24px" }, [
        badge("Tiệm bánh · 112 Thanh Niên, Quy Nhơn", { fontFamily: MONO, color: forest, border: `2px solid ${forest}`, width: "fit-content" }),
        h("Kem tươi tự đánh, sốt nấu từ trái cây thật.", "h1", { fontFamily: SERIF, fontSize: "64px", fontStyle: "italic", fontWeight: "400", lineHeight: "1.05", letterSpacing: "-0.02em", color: cocoa, margin: "0" }),
        p("VyVy làm bánh kem cho ngày sinh nhật và bánh ăn vặt cho buổi chiều. Chọn bánh bên dưới, rồi nhắn hoặc gọi cho tiệm để đặt.", { fontFamily: SANS, fontSize: "20px", lineHeight: "1.6", color: cocoa, margin: "0", maxWidth: "520px" }),
        box("Hero actions", { display: "flex", flexWrap: "wrap", gap: "14px" }, [
          a(`Gọi ${PHONE}`, TEL, { fontFamily: SANS, fontSize: "18px", fontWeight: "800", padding: "16px 28px", backgroundColor: forest, color: cream, borderRadius: "999px", border: `2px solid ${forest}`, boxShadow: `5px 5px 0 ${yolk}` }),
          a("Xem bánh kem", "#banh-kem", { fontFamily: SANS, fontSize: "18px", fontWeight: "800", padding: "16px 28px", color: cocoa, borderRadius: "999px", border: `2px solid ${cocoa}` }),
        ]),
      ]),
      box("Hero picture", { flex: "1 1 340px", maxWidth: "460px", position: "relative", transform: "rotate(2deg)" }, [
        img("Egg Tarts with Puff Pastry.jpg", "Đĩa tart trứng nướng vàng", { width: "100%", height: "480px", objectFit: "cover", border: `3px solid ${cocoa}`, borderRadius: "230px 230px 28px 28px", boxShadow: `9px 9px 0 ${cocoa}` }),
        box("Sticker", { position: "absolute", left: "-28px", bottom: "26px", width: "150px", height: "150px", borderRadius: "50%", backgroundColor: yolk, border: `3px dashed ${cocoa}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", transform: "rotate(-12deg)" }, [
          p("bán chạy nhất", { fontFamily: MONO, fontSize: "12px", color: cocoa, margin: "0" }),
          p("Tart trứng Hong Kong", { fontFamily: SERIF, fontSize: "16px", fontStyle: "italic", lineHeight: "1.15", color: cocoa, margin: "2px 12px" }),
          p("35k", { fontFamily: SERIF, fontSize: "32px", fontWeight: "700", lineHeight: "1", color: forest, margin: "0" }),
        ]),
      ]),
    ], { tag: "section" }),

    box("Band", { padding: "16px 48px", backgroundColor: forest }, [
      p("kem tươi tự đánh  ·  cream cheese  ·  mascarpone  ·  sốt nấu từ trái cây tươi", { fontFamily: MONO, fontSize: "15px", color: cream, margin: "0", textAlign: "center" }),
    ]),

    box("Cakes", { padding: "96px 48px", backgroundColor: white }, [
      box("Cakes layout", { display: "flex", flexWrap: "wrap", gap: "56px", alignItems: "flex-start" }, [
        box("Cakes picture", { flex: "1 1 300px", maxWidth: "380px", transform: "rotate(-2deg)" }, [
          img("ESEAP Conference 2024, day 3, Kota Kinabalu, Malaysia; May 2024 (15).jpg", "Bánh bông lan lá dứa trong hộp", { width: "100%", height: "420px", objectFit: "cover", border: `3px solid ${cocoa}`, borderRadius: "28px 28px 190px 190px", boxShadow: `9px 9px 0 ${pandan}` }),
        ]),
        box("Cakes menu", { flex: "2 1 460px", display: "flex", flexDirection: "column", gap: "10px" }, [
          h("Bánh kem", "h2", { fontFamily: SERIF, fontSize: "60px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0", letterSpacing: "-0.02em" }),
          p("Mỗi loại có vài mức giá theo cỡ bánh. Nhắn tiệm để chọn cỡ vừa với số người ăn.", { fontFamily: SANS, fontSize: "18px", lineHeight: "1.6", color: cocoa, margin: "0 0 14px", maxWidth: "560px" }),
          box("Menu", { display: "flex", flexDirection: "column", borderTop: `2px solid ${cocoa}` }, [
            cakeRow("Lá dứa dừa non", "250k · 300k · 350k", true),
            cakeRow("Trà bá tước", "250k · 300k · 350k"),
            cakeRow("Chocolate", "250k · 300k · 350k"),
            cakeRow("Bông lan trứng muối", "200k – 600k"),
            cakeRow("Tiramisu", "250k – 370k"),
            cakeRow("Burnt cheesecake", "250k · 300k"),
            cakeRow("Mousse xoài chanh dây", "250k · 300k"),
          ]),
        ]),
      ]),
      box("Creams", { display: "flex", flexWrap: "wrap", gap: "28px", marginTop: "64px" }, [
        creamCard("Kem tuyết", "Nhẹ, béo thanh, làm từ cream cheese.", blush, "-1deg"),
        creamCard("Kem muối mascarpone", "Béo đậm hơn kem tuyết, có vị mặn nhẹ.", "#e4efd2", "1deg"),
      ]),
      p("Mỗi loại bánh kem có hướng dẫn bảo quản riêng.", { fontFamily: MONO, fontSize: "14px", color: cocoa, margin: "28px 0 0" }),
    ], { tag: "section", id: "banh-kem" }),

    box("Snacks", { padding: "96px 48px", backgroundColor: blush, borderTop: `2px dashed ${cocoa}` }, [
      box("Snacks head", { display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "44px" }, [
        box("Snacks title", { flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "12px" }, [
          h("Bánh ăn vặt", "h2", { fontFamily: SERIF, fontSize: "60px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0", letterSpacing: "-0.02em" }),
          p("Mua vài cái ăn buổi chiều, hoặc lấy số lượng lớn. Croissant có giá sỉ từ 50 cái.", { fontFamily: SANS, fontSize: "18px", lineHeight: "1.6", color: cocoa, margin: "0", maxWidth: "520px" }),
        ]),
        box("Snack photos", { display: "flex", gap: "20px" }, [
          img("2018 01 Croissant IMG 0685.JPG", "Chiếc croissant trên đĩa", { width: "150px", height: "150px", objectFit: "cover", border: `3px solid ${cocoa}`, borderRadius: "50%", transform: "rotate(-5deg)" }),
          img("Basque-style cheesecake in Pepito, Tokyo.jpg", "Một miếng burnt cheesecake", { width: "150px", height: "150px", objectFit: "cover", border: `3px solid ${cocoa}`, borderRadius: "50%", transform: "rotate(4deg)" }),
        ]),
      ]),
      box("Snack tags", { display: "flex", flexWrap: "wrap", gap: "26px" }, [
        tag("Tart trứng Hong Kong", "35k", "bán chạy nhất", yolk, "-1.5deg"),
        tag("Tart trứng siêu dài", "139k", "", white, "1deg"),
        tag("Tart trái cây mini", "50k", "", white, "-0.8deg"),
        tag("Tart trái cây", "85k", "", white, "1.4deg"),
        tag("Croissant", "50k", "sỉ từ 50 cái", white, "-1deg"),
        tag("Croissant trứng muối lava", "50k", "", white, "0.8deg"),
        tag("Pain suisse", "35k", "", white, "-1.2deg"),
        tag("Tiramisu", "90k", "", white, "1.2deg"),
        tag("Burnt cheesecake", "45k", "", white, "-0.6deg"),
      ]),
    ], { tag: "section", id: "banh-an-vat" }),

    box("Who", { padding: "72px 48px", backgroundColor: cream, display: "flex", flexDirection: "column", gap: "24px" }, [
      h("Ai hay ghé VyVy", "h2", { fontFamily: SERIF, fontSize: "36px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0" }),
      box("Who chips", { display: "flex", flexWrap: "wrap", gap: "16px" }, [
        who("Mua bánh ăn vặt", yolk, "-1.5deg"),
        who("Đặt bánh sinh nhật", blush, "1deg"),
        who("Mua bánh làm quà", "#e4efd2", "-0.8deg"),
        who("Đặt bánh cho công ty", white, "1.4deg"),
      ]),
    ], { tag: "section" }),

    box("How", { padding: "96px 48px", backgroundColor: white, borderTop: `2px dashed ${cocoa}` }, [
      h("Cách đặt bánh", "h2", { fontFamily: SERIF, fontSize: "60px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0 0 44px", letterSpacing: "-0.02em" }),
      box("Steps", { display: "flex", flexWrap: "wrap", gap: "40px" }, [
        step("1", "Chọn bánh, nhắn cho tiệm", `Nhắn qua Facebook hoặc TikTok, hoặc gọi ${PHONE}. Cho tiệm biết loại bánh và ngày bạn cần.`),
        step("2", "Thanh toán", "Chuyển khoản trước, hoặc trả tiền cho shipper khi nhận bánh."),
        step("3", "Nhận bánh, bảo quản", "Nếu chưa ăn ngay, để bánh trong ngăn mát tủ lạnh. Mỗi loại có hướng dẫn bảo quản riêng."),
      ]),
      box("Promise", { marginTop: "64px", padding: "30px 34px", border: `2px dashed ${cocoa}`, borderRadius: "24px", backgroundColor: cream, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "820px" }, [
        h("Bánh có vấn đề thì sao?", "h3", { fontFamily: SERIF, fontSize: "28px", fontStyle: "italic", fontWeight: "400", color: cocoa, margin: "0" }),
        p("Nếu chất lượng bánh chưa đúng ý, bạn báo cho tiệm trong 24 giờ kể từ lúc nhận, kèm ảnh hoặc video. Khi tiệm xác nhận lỗi là của tiệm, VyVy hoàn 100% tiền hoặc đổi bánh cho bạn.", { fontFamily: SANS, fontSize: "18px", lineHeight: "1.65", color: cocoa, margin: "0" }),
      ]),
    ], { tag: "section", id: "cach-dat" }),

    box("Contact", { padding: "96px 48px", backgroundColor: forest, display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center", justifyContent: "space-between" }, [
      box("Contact text", { flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "14px" }, [
        h("Ghé tiệm hoặc nhắn cho VyVy", "h2", { fontFamily: SERIF, fontSize: "52px", fontStyle: "italic", fontWeight: "400", lineHeight: "1.1", color: cream, margin: "0" }),
        p("112 Thanh Niên, Quy Nhơn", { fontFamily: SANS, fontSize: "20px", color: cream, margin: "0" }),
        p("Facebook và TikTok của tiệm: Tiệm bánh VyVy", { fontFamily: SANS, fontSize: "18px", color: "#cfe0bd", margin: "0" }),
      ]),
      a(PHONE, TEL, { fontFamily: SERIF, fontSize: "44px", fontWeight: "700", fontStyle: "italic", padding: "18px 38px", backgroundColor: yolk, color: forest, borderRadius: "999px", border: `3px solid ${cream}`, boxShadow: `7px 7px 0 ${pandan}`, transform: "rotate(-2deg)" }),
    ], { tag: "section", id: "lien-he" }),

    box("Foot", { padding: "22px 48px", backgroundColor: "#142a1d" }, [
      p("© 2026 Tiệm bánh VyVy · 112 Thanh Niên, Quy Nhơn", { fontFamily: MONO, fontSize: "13px", color: "#cfe0bd", margin: "0" }),
    ], { tag: "footer" }),
  ];
}
