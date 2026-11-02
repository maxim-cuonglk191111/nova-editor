import { box, h, p, a, btn, img, SERIF, MONO, type Tree } from "../builders";

// ═══ 1. A personal blog: Mai writes slowly about small things ═══════════════
export function maiBlog(): Tree[] {
  const paper = "#f4ecd8", ink = "#2b2118", pencil = "#d6451f", faded = "#7a6a58";
  const post = (n: string, title: string, meta: string, tilt: string): Tree =>
    box("Post", { display: "flex", gap: "20px", alignItems: "baseline", padding: "22px 24px", backgroundColor: "#fffaf0", border: `1px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}`, transform: `rotate(${tilt})`, marginBottom: "22px" }, [
      p(n, { fontFamily: MONO, fontSize: "14px", color: pencil, margin: "0" }),
      box("Post text", { display: "flex", flexDirection: "column", gap: "6px" }, [
        h(title, "h3", { fontFamily: SERIF, fontSize: "24px", fontStyle: "italic", fontWeight: "400", color: ink, margin: "0" }),
        p(meta, { fontFamily: MONO, fontSize: "13px", color: faded, margin: "0" }),
      ]),
    ]);
  return [
    box("Top", { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "26px 56px", backgroundColor: paper, borderBottom: `1px dashed ${ink}` }, [
      h("Mai viết", "h2", { fontFamily: SERIF, fontStyle: "italic", fontSize: "26px", fontWeight: "400", color: ink, margin: "0" }),
      box("Nav", { display: "flex", gap: "26px" }, [
        a("bài viết", "#bai-viet", { fontFamily: MONO, fontSize: "15px", color: ink }),
        a("về mình", "#ve-minh", { fontFamily: MONO, fontSize: "15px", color: ink }),
        a("gửi thư", "#gui-thu", { fontFamily: MONO, fontSize: "15px", color: ink }),
      ], { tag: "nav" }),
    ], { tag: "header" }),
    box("Opening", { padding: "96px 56px 72px", backgroundColor: paper, display: "flex", flexDirection: "column", gap: "26px" }, [
      p("(blog cá nhân, cập nhật khi nào có chuyện để kể)", { fontFamily: MONO, fontSize: "14px", color: faded, margin: "0" }),
      h("Những thứ nhỏ, viết chậm.", "h1", { fontFamily: SERIF, fontSize: "96px", fontWeight: "400", lineHeight: "1", letterSpacing: "-0.03em", color: ink, margin: "0", maxWidth: "900px" }),
      p("Về cái ấm trà sứt quai, chuyến xe buýt số 14 và lý do mình thôi không xin lỗi vì trả lời tin nhắn muộn.", { fontFamily: SERIF, fontSize: "24px", lineHeight: "1.5", color: ink, margin: "0", maxWidth: "640px", textDecoration: `underline wavy ${pencil}`, textDecorationThickness: "1px" }),
    ], { tag: "section" }),
    box("Posts", { padding: "40px 56px 88px", backgroundColor: paper }, [
      h("Mới viết gần đây", "h2", { fontFamily: MONO, fontSize: "15px", fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.12em", color: faded, margin: "0 0 30px" }),
      post("01", "Cái ấm trà sứt quai", "12 thg 10 · 4 phút đọc", "-0.6deg"),
      post("02", "Xe buýt số 14 và người bán bắp", "28 thg 9 · 6 phút đọc", "0.5deg"),
      post("03", "Không xin lỗi vì trả lời muộn", "3 thg 9 · 3 phút đọc", "-0.4deg"),
    ], { tag: "section", id: "bai-viet" }),
    box("About", { display: "flex", flexWrap: "wrap", gap: "48px", padding: "80px 56px", backgroundColor: "#e9dcbc", borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}` }, [
      img("Sông Hương (Huế).JPG", "Sông Hương buổi sáng, Huế", { width: "320px", height: "320px", objectFit: "cover", border: `10px solid #fffaf0`, boxShadow: `6px 6px 0 ${ink}`, transform: "rotate(-3deg)" }),
      box("About text", { flex: "1 1 360px", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "560px" }, [
        h("Về mình", "h2", { fontFamily: SERIF, fontStyle: "italic", fontSize: "44px", fontWeight: "400", color: ink, margin: "0" }),
        p("Mình là Mai, 31 tuổi, làm điều dưỡng ở Huế. Trực đêm nhiều nên có thói quen viết vào lúc ai cũng ngủ. Blog này không bán gì, không dạy gì, chỉ ghi lại.", { fontFamily: SERIF, fontSize: "19px", lineHeight: "1.65", color: ink, margin: "0" }),
        p("Đang đọc: Tuyển tập truyện ngắn của Nguyễn Ngọc Tư. Đang nghe: tiếng mưa trên mái tôn.", { fontFamily: MONO, fontSize: "14px", color: faded, margin: "0" }),
      ]),
    ], { tag: "section", id: "ve-minh" }),
    box("Letter", { padding: "88px 56px", backgroundColor: paper, display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }, [
      h("Mỗi thứ Sáu, một lá thư", "h2", { fontFamily: SERIF, fontSize: "52px", fontWeight: "400", color: ink, margin: "0", maxWidth: "700px" }),
      p("Không quảng cáo, không bản tin. Chỉ là một đoạn mình viết tay, rồi gõ lại, gửi cho bạn.", { fontFamily: SERIF, fontSize: "20px", lineHeight: "1.6", color: faded, margin: "0", maxWidth: "560px" }),
      btn("Cho mình địa chỉ email của bạn", { fontFamily: MONO, fontSize: "16px", padding: "16px 26px", backgroundColor: pencil, color: "#fffaf0", border: `2px solid ${ink}`, boxShadow: `4px 4px 0 ${ink}`, borderRadius: "0" }),
    ], { tag: "section", id: "gui-thu" }),
    box("Foot", { padding: "26px 56px", backgroundColor: ink }, [
      p("viết bằng tay, đăng bằng máy · Huế, 2026", { fontFamily: MONO, fontSize: "14px", color: paper, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
