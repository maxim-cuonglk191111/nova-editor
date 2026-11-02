import { box, h, p, a, btn, badge, avatar, MONO, SANS, type Tree } from "../builders";

// ═══ 5. A podcast: Nói Nhảm Lúc 2 Giờ Sáng ═══════════════════════════════════
export function noiNham(): Tree[] {
  const indigo = "#1b1464", pink = "#ff4d8d", cream = "#fff3e0", sun = "#ffd23f";
  const episode = (n: string, title: string, text: string, length: string, bg: string, tilt: string): Tree =>
    box("Episode", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px", padding: "26px 30px", backgroundColor: bg, border: `3px solid ${indigo}`, borderRadius: "28px", boxShadow: `7px 7px 0 ${indigo}`, transform: `rotate(${tilt})`, marginBottom: "26px" }, [
      p(n, { fontFamily: SANS, fontSize: "64px", fontWeight: "900", lineHeight: "1", color: indigo, margin: "0", flex: "0 0 auto" }),
      box("Episode text", { flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "6px" }, [
        h(title, "h3", { fontFamily: SANS, fontSize: "26px", fontWeight: "800", color: indigo, margin: "0" }),
        p(text, { fontFamily: SANS, fontSize: "17px", lineHeight: "1.5", color: indigo, margin: "0" }),
        p(length, { fontFamily: MONO, fontSize: "14px", color: indigo, margin: "0" }),
      ]),
      btn("nghe", { fontFamily: SANS, fontSize: "18px", fontWeight: "800", padding: "14px 28px", backgroundColor: indigo, color: cream, border: `3px solid ${indigo}`, borderRadius: "999px" }),
    ]);
  return [
    box("Bar", { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 44px", backgroundColor: indigo, flexWrap: "wrap", gap: "12px" }, [
      h("nói nhảm.", "h2", { fontFamily: SANS, fontSize: "28px", fontWeight: "900", color: pink, margin: "0", letterSpacing: "-0.03em" }),
      box("Nav", { display: "flex", gap: "26px" }, [
        a("tập mới", "#tap", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cream }),
        a("hai đứa mình", "#hai-dua", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cream }),
        a("gửi chuyện", "#gui-chuyen", { fontFamily: SANS, fontSize: "16px", fontWeight: "700", color: cream }),
      ], { tag: "nav" }),
    ], { tag: "header" }),
    box("Hero", { padding: "80px 44px 96px", backgroundColor: indigo, display: "flex", flexWrap: "wrap", gap: "48px", alignItems: "center", overflow: "hidden" }, [
      box("Hero text", { flex: "1 1 460px", display: "flex", flexDirection: "column", gap: "26px" }, [
        badge("podcast · mỗi thứ Năm · 2:00 sáng", { fontFamily: MONO, color: sun, border: `2px solid ${sun}`, width: "fit-content" }),
        h("Nói nhảm lúc 2 giờ sáng", "h1", { fontFamily: SANS, fontSize: "96px", fontWeight: "900", lineHeight: "0.95", letterSpacing: "-0.05em", color: cream, margin: "0" }),
        p("Hai người bạn thân thu âm khi cả hai đều buồn ngủ và không còn biết xấu hổ. Chuyện tình yêu, chuyện tiền, chuyện ma, và vì sao mì gói luôn ngon hơn lúc nửa đêm.", { fontFamily: SANS, fontSize: "20px", lineHeight: "1.6", color: cream, margin: "0", maxWidth: "560px" }),
        btn("nghe tập mới nhất", { fontFamily: SANS, fontSize: "19px", fontWeight: "800", padding: "18px 34px", backgroundColor: pink, color: indigo, border: `3px solid ${cream}`, borderRadius: "999px", boxShadow: `6px 6px 0 ${sun}`, width: "fit-content" }),
      ]),
      box("Blob", { flex: "1 1 320px", maxWidth: "420px", height: "420px", backgroundColor: pink, borderRadius: "46% 54% 38% 62% / 54% 44% 56% 46%", display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${cream}`, transform: "rotate(-6deg)" }, [
        h("2:07", "h2", { fontFamily: MONO, fontSize: "112px", fontWeight: "900", color: indigo, margin: "0", letterSpacing: "-0.06em" }),
      ]),
    ], { tag: "section" }),
    box("Episodes", { padding: "88px 44px", backgroundColor: cream }, [
      h("Mấy tập gần đây", "h2", { fontFamily: SANS, fontSize: "52px", fontWeight: "900", color: indigo, margin: "0 0 40px", letterSpacing: "-0.04em" }),
      episode("23", "Mình đã khóc vì một cái quảng cáo bảo hiểm", "Và 40 phút tranh luận xem có nên xấu hổ không. Kết luận: không.", "52 phút", pink, "-0.8deg"),
      episode("22", "Chuyện ma ở căn trọ cũ", "Có thật. Có điều phần đáng sợ nhất là tiền thuê trọ.", "47 phút", sun, "0.7deg"),
      episode("21", "Cách bỏ một người bạn mà không thành người xấu", "Câu hỏi của thính giả ẩn danh. Hai đứa mình trả lời mỗi đứa một kiểu.", "61 phút", "#bff0d4", "-0.5deg"),
    ], { tag: "section", id: "tap" }),
    box("Hosts", { padding: "88px 44px", backgroundColor: sun, display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center", borderTop: `4px solid ${indigo}` }, [
      box("Avatars", { display: "flex", gap: "0" }, [
        avatar("Ao dai (cropped).jpg", "Vy", { width: "120px", height: "120px" }),
        avatar("BiBi.jpeg", "Nam", { width: "120px", height: "120px" }),
      ]),
      box("Hosts text", { flex: "1 1 420px", display: "flex", flexDirection: "column", gap: "14px" }, [
        h("Hai đứa mình", "h2", { fontFamily: SANS, fontSize: "46px", fontWeight: "900", color: indigo, margin: "0", letterSpacing: "-0.04em" }),
        p("Vy làm thiết kế, Nam làm kế toán. Quen nhau từ năm lớp 10, cãi nhau từ năm lớp 10. Podcast này là cách để cãi nhau có ghi âm lại.", { fontFamily: SANS, fontSize: "19px", lineHeight: "1.6", color: indigo, margin: "0", maxWidth: "600px" }),
      ]),
    ], { tag: "section", id: "hai-dua" }),
    box("Send", { padding: "88px 44px", backgroundColor: indigo, display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }, [
      h("Gửi chuyện cho tụi mình", "h2", { fontFamily: SANS, fontSize: "56px", fontWeight: "900", color: pink, margin: "0", letterSpacing: "-0.04em" }),
      p("Câu hỏi, chuyện xấu hổ, chuyện không ai tin. Ẩn danh cũng được. Chọn được thì tụi mình đọc to, và cười trước bạn.", { fontFamily: SANS, fontSize: "20px", lineHeight: "1.6", color: cream, margin: "0", maxWidth: "560px" }),
      btn("nghe@noinham.example", { fontFamily: MONO, fontSize: "18px", padding: "16px 30px", backgroundColor: "transparent", color: cream, border: `3px solid ${cream}`, borderRadius: "999px" }),
    ], { tag: "section", id: "gui-chuyen" }),
    box("Foot", { padding: "22px 44px", backgroundColor: "#12094a" }, [
      p("nói nhảm · thu âm trong tủ quần áo vì nó cách âm tốt nhất · 2026", { fontFamily: MONO, fontSize: "13px", color: cream, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
