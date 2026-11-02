import { box, h, p, a, btn, img, MONO, POSTER, SANS, type Tree } from "../builders";

// ═══ 3. A street-food stall: Bếp Bà Tư ═══════════════════════════════════════
export function bepBaTu(): Tree[] {
  const red = "#d62828", yellow = "#fcbf49", black = "#111111", cream = "#fff4d6";
  const row = (name: string, price: string): Tree =>
    box("Dish", { display: "flex", alignItems: "baseline", gap: "14px", padding: "12px 0", borderBottom: `3px dotted ${black}` }, [
      h(name, "h3", { fontFamily: POSTER, fontSize: "30px", fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.02em", color: black, margin: "0", flex: "1 1 auto" }),
      p(price, { fontFamily: POSTER, fontSize: "30px", color: red, margin: "0" }),
    ]);
  return [
    box("Strip", { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", backgroundColor: black, flexWrap: "wrap", gap: "12px" }, [
      h("BẾP BÀ TƯ", "h2", { fontFamily: POSTER, fontSize: "30px", fontWeight: "400", letterSpacing: "0.04em", color: yellow, margin: "0" }),
      box("Nav", { display: "flex", gap: "26px" }, [
        a("MÓN", "#mon", { fontFamily: POSTER, fontSize: "20px", color: "#ffffff", letterSpacing: "0.06em" }),
        a("GIỜ BÁN", "#gio-ban", { fontFamily: POSTER, fontSize: "20px", color: "#ffffff", letterSpacing: "0.06em" }),
        a("TÌM BÀ Ở ĐÂU", "#o-dau", { fontFamily: POSTER, fontSize: "20px", color: "#ffffff", letterSpacing: "0.06em" }),
      ], { tag: "nav" }),
    ], { tag: "header" }),
    box("Poster", { padding: "72px 40px 88px", backgroundColor: red, display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center", borderBottom: `8px solid ${black}` }, [
      box("Poster text", { flex: "1 1 460px", display: "flex", flexDirection: "column", gap: "20px" }, [
        h("BÚN RIÊU BÀ TƯ. HẾT LÀ HẾT.", "h1", { fontFamily: POSTER, fontSize: "104px", fontWeight: "400", lineHeight: "0.95", letterSpacing: "0.01em", color: yellow, margin: "0", textShadow: `6px 6px 0 ${black}` }),
        p("Nấu từ 4 giờ sáng bằng cua đồng thật. Ăn tại chỗ, ghế nhựa đỏ, quạt cây. Không giao hàng. Đói thì ghé.", { fontFamily: SANS, fontSize: "22px", fontWeight: "700", lineHeight: "1.45", color: cream, margin: "0", maxWidth: "560px" }),
      ]),
      img("Bun rieu with herbs.jpg", "Tô bún riêu với rau sống", { flex: "1 1 340px", maxWidth: "460px", height: "420px", objectFit: "cover", border: `8px solid ${black}`, transform: "rotate(3deg)", boxShadow: `12px 12px 0 ${yellow}` }),
    ], { tag: "section" }),
    box("Menu", { padding: "72px 40px", backgroundColor: yellow, borderBottom: `8px solid ${black}` }, [
      h("MÓN HÔM NAY", "h2", { fontFamily: POSTER, fontSize: "64px", fontWeight: "400", color: black, margin: "0 0 28px", letterSpacing: "0.02em" }),
      box("Menu board", { maxWidth: "760px", padding: "26px 34px", backgroundColor: cream, border: `4px solid ${black}`, boxShadow: `10px 10px 0 ${black}` }, [
        row("Bún riêu thường", "35K"),
        row("Bún riêu đặc biệt (thêm chả, giò)", "50K"),
        row("Bún riêu không bún", "35K"),
        row("Chè đậu xanh tặng khi bà vui", "0Đ"),
      ]),
      p("Tiền mặt hoặc chuyển khoản. Đừng hỏi giảm giá, bà nói không rồi.", { fontFamily: SANS, fontSize: "18px", fontWeight: "700", color: black, margin: "26px 0 0" }),
    ], { tag: "section", id: "mon" }),
    box("Hours", { padding: "72px 40px", backgroundColor: black, display: "flex", flexDirection: "column", gap: "16px" }, [
      h("GIỜ BÁN", "h2", { fontFamily: POSTER, fontSize: "64px", fontWeight: "400", color: yellow, margin: "0", letterSpacing: "0.02em" }),
      p("6:00 sáng cho tới khi hết nồi. Thường là 10:30. Thứ Hai bà nghỉ đi chợ hoa.", { fontFamily: SANS, fontSize: "24px", fontWeight: "700", lineHeight: "1.4", color: cream, margin: "0", maxWidth: "640px" }),
    ], { tag: "section", id: "gio-ban" }),
    box("Where", { padding: "72px 40px", backgroundColor: red, display: "flex", flexDirection: "column", gap: "18px" }, [
      h("TÌM BÀ Ở ĐÂU", "h2", { fontFamily: POSTER, fontSize: "64px", fontWeight: "400", color: yellow, margin: "0", textShadow: `5px 5px 0 ${black}` }),
      p("Hẻm 27 Phan Bội Châu, Huế. Thấy cây phượng với cái nồi to là đúng. Zalo bà 0900 000 000, nhưng bà chỉ nghe máy sau 10 giờ.", { fontFamily: SANS, fontSize: "22px", fontWeight: "700", lineHeight: "1.45", color: cream, margin: "0", maxWidth: "640px" }),
      btn("CHỈ ĐƯỜNG", { fontFamily: POSTER, fontSize: "24px", padding: "16px 34px", backgroundColor: yellow, color: black, border: `4px solid ${black}`, borderRadius: "0", boxShadow: `6px 6px 0 ${black}`, width: "fit-content", letterSpacing: "0.04em" }),
    ], { tag: "section", id: "o-dau" }),
    box("Foot", { padding: "22px 40px", backgroundColor: black }, [
      p("Bếp Bà Tư · bán từ 1987 · không có website cho tới tuần trước", { fontFamily: MONO, fontSize: "14px", color: yellow, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
