import { box, h, p, a, btn, img, SERIF, MONO, SANS, type Tree, type Styles } from "../builders";

// ═══ 4. A photographer's portfolio: Hùng Lê ═══════════════════════════════════
export function hungPhoto(): Tree[] {
  const dark = "#101010", paper = "#ecebe6", dim = "#8d8c86";
  const shot = (id: string, alt: string, caption: string, styles: Styles): Tree =>
    box("Shot", { display: "flex", flexDirection: "column", gap: "10px", ...styles }, [
      img(id, alt, { width: "100%", height: "100%", minHeight: "260px", objectFit: "cover" }),
      p(caption, { fontFamily: MONO, fontSize: "13px", color: dim, margin: "0" }),
    ]);
  return [
    box("Top", { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "28px 48px", backgroundColor: dark }, [
      h("Hùng Lê", "h2", { fontFamily: SANS, fontSize: "20px", fontWeight: "500", letterSpacing: "0.02em", color: paper, margin: "0" }),
      box("Nav", { display: "flex", gap: "30px" }, [
        a("ảnh", "#anh", { fontFamily: MONO, fontSize: "14px", color: dim }),
        a("giới thiệu", "#gioi-thieu", { fontFamily: MONO, fontSize: "14px", color: dim }),
        a("thuê chụp", "#thue-chup", { fontFamily: MONO, fontSize: "14px", color: dim }),
      ], { tag: "nav" }),
    ], { tag: "header" }),
    box("Statement", { padding: "120px 48px 88px", backgroundColor: dark }, [
      h("Tôi chụp những lúc mọi người không để ý.", "h1", { fontFamily: SERIF, fontSize: "88px", fontWeight: "400", fontStyle: "italic", lineHeight: "1.02", letterSpacing: "-0.03em", color: paper, margin: "0", maxWidth: "1000px" }),
      p("Nhiếp ảnh gia độc lập, Đà Nẵng. Chụp phong cảnh, đường phố và đôi khi đám cưới của những người không thích chụp ảnh.", { fontFamily: SANS, fontSize: "19px", lineHeight: "1.6", color: dim, margin: "36px 0 0", maxWidth: "560px" }),
    ], { tag: "section" }),
    box("Grid", { padding: "0 48px 96px", backgroundColor: dark, display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }, [
      shot("Ray over terrace rice field in Sapa - Trung Chải..jpg", "Ruộng bậc thang Sa Pa", "Sa Pa, 6:12 sáng. Lúa chín, sương dày, sau đó là không có gì.", { flex: "2 1 520px" }),
      shot("Bờ đông cầu Rồng.jpg", "Cầu Rồng, Đà Nẵng", "Đà Nẵng, 19:30. Con rồng chưa kịp phun lửa.", { flex: "1 1 280px" }),
      shot("2024-12-20 Hoi An Old Town at night 2.jpg", "Phố cổ Hội An về đêm", "Hội An, 20:10. Đèn lồng nhiều hơn người.", { flex: "1 1 280px" }),
      shot("Ha Long Bay, Tower karsts.jpg", "Vịnh Hạ Long", "Hạ Long, 16:45. Núi đá đứng yên, mình đứng yên theo.", { flex: "2 1 520px" }),
    ], { tag: "section", id: "anh" }),
    box("About", { padding: "96px 48px", backgroundColor: paper, display: "flex", flexWrap: "wrap", gap: "56px" }, [
      h("Giới thiệu", "h2", { fontFamily: MONO, fontSize: "14px", fontWeight: "400", textTransform: "uppercase", letterSpacing: "0.14em", color: "#55544f", margin: "0", flex: "0 0 160px" }),
      box("About text", { flex: "1 1 420px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "640px" }, [
        p("Mình bắt đầu chụp năm 2014 bằng một cái máy film cũ của bố. Bây giờ vẫn dùng nó cho một nửa số ảnh.", { fontFamily: SERIF, fontSize: "26px", lineHeight: "1.45", color: dark, margin: "0" }),
        p("Triển lãm cá nhân đầu tiên: “Sáng sớm, ai cũng giống nhau”, Đà Nẵng, 2024.", { fontFamily: MONO, fontSize: "14px", color: "#55544f", margin: "0" }),
      ]),
    ], { tag: "section", id: "gioi-thieu" }),
    box("Hire", { padding: "96px 48px", backgroundColor: dark, display: "flex", flexDirection: "column", gap: "22px", alignItems: "flex-start" }, [
      h("Thuê chụp", "h2", { fontFamily: SERIF, fontStyle: "italic", fontSize: "64px", fontWeight: "400", color: paper, margin: "0" }),
      p("Nhận chụp cưới từ tháng 3 năm sau, tối đa tám đám cưới mỗi năm. Nhận chụp chân dung và sản phẩm quanh năm.", { fontFamily: SANS, fontSize: "19px", lineHeight: "1.6", color: dim, margin: "0", maxWidth: "560px" }),
      btn("hung@hungle.example", { fontFamily: MONO, fontSize: "17px", padding: "16px 28px", backgroundColor: "transparent", color: paper, border: `1px solid ${paper}`, borderRadius: "0" }),
    ], { tag: "section", id: "thue-chup" }),
    box("Foot", { padding: "24px 48px", backgroundColor: dark, borderTop: "1px solid #2a2a28" }, [
      p("© 2026 Hùng Lê · mọi bức ảnh trên trang này đều có thật", { fontFamily: MONO, fontSize: "13px", color: dim, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
