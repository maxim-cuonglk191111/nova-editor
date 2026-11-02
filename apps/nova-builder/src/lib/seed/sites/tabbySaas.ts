import { box, h, p, a, btn, badge, avatar, MONO, SANS, type Tree } from "../builders";

// ═══ 2. A one-person SaaS: Tabby, the to-do list that nags kindly ═══════════
export function tabbySaas(): Tree[] {
  const black = "#0b0b0c", lime = "#d4ff3a", grey = "#9a9a9f";
  const feature = (n: string, title: string, text: string): Tree =>
    box("Feature", { flex: "1 1 260px", padding: "28px", border: `2px solid ${lime}`, display: "flex", flexDirection: "column", gap: "12px" }, [
      p(n, { fontFamily: MONO, fontSize: "14px", color: lime, margin: "0" }),
      h(title, "h3", { fontFamily: MONO, fontSize: "24px", fontWeight: "700", color: "#ffffff", margin: "0" }),
      p(text, { fontFamily: SANS, fontSize: "16px", lineHeight: "1.55", color: grey, margin: "0" }),
    ]);
  const plan = (name: string, price: string, perks: string[], hot: boolean): Tree =>
    box("Plan", { flex: "1 1 280px", padding: "32px", border: `2px solid ${lime}`, backgroundColor: hot ? lime : black, display: "flex", flexDirection: "column", gap: "14px" }, [
      p(name, { fontFamily: MONO, fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.1em", color: hot ? black : lime, margin: "0" }),
      h(price, "h3", { fontFamily: MONO, fontSize: "52px", fontWeight: "700", color: hot ? black : "#ffffff", margin: "0" }),
      ...perks.map((x) => p(`+ ${x}`, { fontFamily: MONO, fontSize: "15px", color: hot ? black : grey, margin: "0" })),
      btn(hot ? "get pro" : "start free", { fontFamily: MONO, fontSize: "16px", padding: "14px 20px", marginTop: "10px", backgroundColor: hot ? black : lime, color: hot ? lime : black, border: `2px solid ${black}`, borderRadius: "0", fontWeight: "700" }),
    ]);
  return [
    box("Bar", { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", backgroundColor: black, borderBottom: `2px solid ${lime}` }, [
      h("tabby.", "h2", { fontFamily: MONO, fontSize: "26px", fontWeight: "700", color: lime, margin: "0" }),
      box("Nav", { display: "flex", gap: "28px" }, [
        a("how it nags", "#how", { fontFamily: MONO, fontSize: "15px", color: "#ffffff" }),
        a("pricing", "#pricing", { fontFamily: MONO, fontSize: "15px", color: "#ffffff" }),
        a("who made this", "#maker", { fontFamily: MONO, fontSize: "15px", color: "#ffffff" }),
      ], { tag: "nav" }),
    ], { tag: "header" }),
    box("Hero", { padding: "96px 48px 72px", backgroundColor: black, display: "flex", flexDirection: "column", gap: "28px" }, [
      badge("v2 · now texts you", { fontFamily: MONO, color: lime, border: `1px solid ${lime}`, width: "fit-content" }),
      h("Your to-do list, but it actually texts you.", "h1", { fontFamily: MONO, fontSize: "88px", fontWeight: "700", lineHeight: "1", letterSpacing: "-0.04em", color: "#ffffff", margin: "0", maxWidth: "1000px", textTransform: "lowercase" }),
      p("Tabby remembers what you said you would do, and asks about it. Politely. Then less politely. Then it stops, because it respects you.", { fontFamily: SANS, fontSize: "21px", lineHeight: "1.6", color: grey, margin: "0", maxWidth: "620px" }),
      box("Cta row", { display: "flex", gap: "16px", flexWrap: "wrap" }, [
        btn("start nagging (free)", { fontFamily: MONO, fontSize: "18px", padding: "18px 30px", backgroundColor: lime, color: black, border: `2px solid ${lime}`, borderRadius: "0", fontWeight: "700", boxShadow: "6px 6px 0 #ffffff" }),
        btn("see it work", { fontFamily: MONO, fontSize: "18px", padding: "18px 30px", backgroundColor: "transparent", color: "#ffffff", border: "2px solid #ffffff", borderRadius: "0" }),
      ]),
    ], { tag: "section" }),
    box("Terminal wrap", { padding: "0 48px", backgroundColor: black }, [
    box("Terminal", { padding: "26px 30px", backgroundColor: "#141416", border: `2px solid ${lime}`, display: "flex", flexDirection: "column", gap: "6px" }, [
      p("$ tabby add \"email the landlord\" --by friday", { fontFamily: MONO, fontSize: "17px", color: lime, margin: "0" }),
      p("ok. i'll ask on thursday.", { fontFamily: MONO, fontSize: "17px", color: grey, margin: "0" }),
      p("thursday 18:02 > did you email the landlord?", { fontFamily: MONO, fontSize: "17px", color: "#ffffff", margin: "0" }),
      p("you > ...tomorrow", { fontFamily: MONO, fontSize: "17px", color: grey, margin: "0" }),
      p("thursday 18:03 > that's what you said last week. want me to make it smaller?", { fontFamily: MONO, fontSize: "17px", color: "#ffffff", margin: "0" }),
    ]),
    ]),
    box("How", { padding: "96px 48px", backgroundColor: black, display: "flex", flexDirection: "column", gap: "36px" }, [
      h("three rules. no dashboards.", "h2", { fontFamily: MONO, fontSize: "44px", fontWeight: "700", color: "#ffffff", margin: "0", textTransform: "lowercase" }),
      box("Features", { display: "flex", flexWrap: "wrap", gap: "24px" }, [
        feature("01", "it asks, you answer", "One text a day, at the hour you pick. Reply done, later, or smaller."),
        feature("02", "tasks shrink", "Skipped twice? Tabby offers a ten-minute version of the same task."),
        feature("03", "it shuts up", "Three ignored nudges and it goes quiet until you wake it. No guilt streaks."),
      ]),
    ], { tag: "section", id: "how" }),
    box("Pricing", { padding: "96px 48px", backgroundColor: "#141416", display: "flex", flexDirection: "column", gap: "36px", borderTop: `2px solid ${lime}` }, [
      h("pricing", "h2", { fontFamily: MONO, fontSize: "44px", fontWeight: "700", color: "#ffffff", margin: "0" }),
      box("Plans", { display: "flex", flexWrap: "wrap", gap: "24px" }, [
        plan("free", "$0", ["20 tasks", "daily text", "forever"], false),
        plan("pro", "$6/mo", ["unlimited tasks", "task shrinking", "calendar sync", "cancel in two clicks"], true),
      ]),
    ], { tag: "section", id: "pricing" }),
    box("Maker", { padding: "88px 48px", backgroundColor: lime, display: "flex", flexWrap: "wrap", gap: "40px", alignItems: "center" }, [
      avatar("Geedziĝa festo en vilaĝo apud Hue 08.jpg", "Khoa", { width: "96px", height: "96px" }),
      box("Maker text", { flex: "1 1 420px", display: "flex", flexDirection: "column", gap: "12px" }, [
        h("made by one person. his name is Khoa.", "h2", { fontFamily: MONO, fontSize: "36px", fontWeight: "700", color: black, margin: "0" }),
        p("I built Tabby because I kept lying to my own to-do list. It's me, a laptop, and a very patient cat. Questions go straight to my inbox: khoa@tabby.example.", { fontFamily: SANS, fontSize: "18px", lineHeight: "1.6", color: black, margin: "0", maxWidth: "620px" }),
      ]),
    ], { tag: "section", id: "maker" }),
    box("Foot", { padding: "24px 48px", backgroundColor: black }, [
      p("tabby.example · made in a tiny apartment in Hanoi · 2026", { fontFamily: MONO, fontSize: "14px", color: grey, margin: "0" }),
    ], { tag: "footer" }),
  ];
}
