// Demo accounts for seeding, each a different kind of person with a different goal and a
// site that does not look like the others: a personal blog, a one-person SaaS, a street-food
// stall, a photographer's portfolio, a podcast, a bakery and a café. Each is written in the same compact tree the
// AI composer returns, converted by the app's own validateCompositionWS and merged into a
// project document exactly as applyWSComposition does, so a seeded project has the same shape
// as one a user generated and the preview page reads it through the normal path.
//
// Photos are Vietnamese places and dishes from Wikimedia Commons. Fonts are system stacks
// so the preview, an export and a published site all draw the same.
import { validateCompositionWS } from "@studio/ai";
import { emptyProjectSchema } from "../emptyProject";

type Tree = Record<string, unknown>;
type Styles = Record<string, string>;

// Photos are real places, dishes and people in Vietnam from Wikimedia Commons. Width 1280 is one
// of Commons' standard thumbnail sizes, so the file is served from cache. Every photo is used
// once, on one site.
const commons = (file: string) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1280`;

// ── tiny builders ─────────────────────────────────────────────────────────────
const box = (label: string, styles: Styles, children: Tree[] = [], props: Record<string, unknown> = {}): Tree => ({ component: "Box", label, props, styles, children });
const h = (text: string, tag: string, styles: Styles = {}): Tree => ({ component: "Heading", label: "Heading", props: { tag }, text, styles });
const p = (text: string, styles: Styles = {}): Tree => ({ component: "Paragraph", label: "Paragraph", text, styles });
const a = (text: string, href: string, styles: Styles = {}): Tree => ({ component: "Link", label: "Link", props: { href }, text, styles });
const btn = (text: string, styles: Styles): Tree => ({ component: "Button", label: "Button", props: { type: "button" }, text, styles });
const img = (file: string, alt: string, styles: Styles = {}): Tree => ({ component: "Image", label: "Image", props: { src: commons(file), alt }, styles });
const badge = (text: string, styles: Styles = {}): Tree => ({ component: "Badge", label: "Badge", props: { variant: "outline" }, text, styles });
// Avatars use portraits of ordinary people in Vietnam; the name stays as the fallback initials.
const avatar = (file: string, name: string, styles: Styles = {}): Tree => ({ component: "Avatar", label: "Avatar", props: { src: commons(file), name }, styles });

export type DemoSite = {
  slug: string;
  /** Project name shown in the dashboard. */
  name: string;
  email: string;
  displayName: string;
  /** Who this person is and what the site is for (shown by the seed script). */
  purpose: string;
  tree: (ctx: SeedContext) => Tree[];
  /** Files in scripts/seed-assets/<slug>/ that the seed uploads to the "assets" bucket as seed/<slug>/<file>. */
  assets?: string[];
  /** Set when this person bought a plan (written by `seed-demo.mjs --sales`, provider "demo"). */
  purchase?: { plan: "pro" };
  /** Taken out of the demo set: skipped by the seed, removed from the database by `--retire`. */
  retired?: boolean;
};

export type SeedContext = {
  /** Public base of the assets bucket's seed/ folder, no trailing slash. */
  assetBase: string;
};

/** Stand-in used by tests; the seed script passes the real Supabase project's URL. */
export const PLACEHOLDER_CONTEXT: SeedContext = { assetBase: "https://example.supabase.co/storage/v1/object/public/assets/seed" };

// Georgia has no Vietnamese glyphs (ế, ắ, ố come out as a letter plus a stray accent), so the
// serif stack starts with faces that do: Palatino Linotype on Windows, Palatino on macOS.
const SERIF = "'Palatino Linotype', Palatino, 'Book Antiqua', 'Times New Roman', serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";
const POSTER = "Impact, 'Arial Narrow Bold', 'Haettenschweiler', sans-serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ═══ 1. A personal blog: Mai writes slowly about small things ═══════════════
function maiBlog(): Tree[] {
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

// ═══ 2. A one-person SaaS: Tabby, the to-do list that nags kindly ═══════════
function tabbySaas(): Tree[] {
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

// ═══ 3. A street-food stall: Bếp Bà Tư ═══════════════════════════════════════
function bepBaTu(): Tree[] {
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

// ═══ 4. A photographer's portfolio: Hùng Lê ═══════════════════════════════════
function hungPhoto(): Tree[] {
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

// ═══ 5. A podcast: Nói Nhảm Lúc 2 Giờ Sáng ═══════════════════════════════════
function noiNham(): Tree[] {
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

// ═══ 6. A bakery: Tiệm bánh VyVy ═════════════════════════════════════════════
// Facts come from the owner's brand profile and nothing is added to them: no flavours described,
// no sizes named, no delivery area promised. The photos are stand-ins for the shop's own.
function vyvyBakery(): Tree[] {
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

// ═══ 7. A café: Ovemo, "Over The Moon" ═══════════════════════════════════════
// Prices, hours, phones, address and the slogan are the owner's. The photos and the logo are
// the shop's own, uploaded to the same Supabase "assets" bucket the editor uses for uploads.
// The menu marks some drinks with a small black cat; the profile does not say what the mark
// means, so it is not reproduced.
function ovemoCafe(ctx: SeedContext): Tree[] {
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

export const DEMO_SITES: DemoSite[] = [
  { slug: "mai-viet", name: "Mai viết — blog cá nhân", email: "demo.mai-viet@nova-demo.test", displayName: "Mai", purpose: "Personal blog: a nurse in Huế writing slowly about small things", tree: maiBlog },
  { slug: "tabby", name: "Tabby — to-do list that nags kindly", email: "demo.tabby@nova-demo.test", displayName: "Khoa", purpose: "One-person SaaS: product page with pricing", tree: tabbySaas, purchase: { plan: "pro" } },
  { slug: "bep-ba-tu", name: "Bếp Bà Tư — bún riêu", email: "demo.bep-ba-tu@nova-demo.test", displayName: "Bà Tư", purpose: "Small local business: a street-food stall that never had a website", tree: bepBaTu, purchase: { plan: "pro" } },
  { slug: "hung-le", name: "Hùng Lê — nhiếp ảnh", email: "demo.hung-le@nova-demo.test", displayName: "Hùng Lê", purpose: "Freelancer: a photographer's portfolio and booking page", tree: hungPhoto, retired: true },
  { slug: "noi-nham", name: "Nói nhảm lúc 2 giờ sáng — podcast", email: "demo.noi-nham@nova-demo.test", displayName: "Vy & Nam", purpose: "Creator: an indie podcast with episodes and a listener inbox", tree: noiNham, retired: true },
  { slug: "vyvy", name: "Tiệm bánh VyVy — landing page", email: "demo.vyvy@nova-demo.test", displayName: "VyVy", purpose: "Local bakery in Quy Nhơn: cakes and snacks with prices, how to order, refund policy", tree: vyvyBakery, purchase: { plan: "pro" } },
  { slug: "ovemo", name: "Ovemo — Over The Moon", email: "demo.ovemo@nova-demo.test", displayName: "Ovemo", purpose: "Coffee and tea shop in Quy Nhơn Nam: full menu with M/L prices, toppings, hours and phones", tree: ovemoCafe, assets: ["ovemo-tra-sua.jpg", "ovemo-matcha.jpg", "ovemo-cacao.jpg", "ovemo-logo.png"], purchase: { plan: "pro" } },
];

// ── tree → project document ───────────────────────────────────────────────────

type Entries = [string, unknown][];

/** The `schema_json` stored for a project: an empty 5.0 document with the composed page merged in. */
export function buildProjectSchema(site: DemoSite, now: string, ctx: SeedContext = PLACEHOLDER_CONTEXT): Record<string, unknown> {
  const doc = emptyProjectSchema(site.name, now) as { data: Record<string, unknown> } & Record<string, unknown>;
  const data = doc.data;
  const composed = validateCompositionWS({ tree: site.tree(ctx) });

  const breakpoints = data.breakpoints as [string, { id: string; maxWidth?: number }][];
  const baseBp = breakpoints[0]![0];
  const mobileBp = breakpoints.map(([, bp]) => bp).filter((bp) => bp.maxWidth !== undefined && bp.maxWidth <= 767).sort((x, y) => (y.maxWidth ?? 0) - (x.maxWidth ?? 0))[0]?.id;

  const instances = data.instances as Entries;
  const body = instances[0]![1] as { id: string; children: unknown[] };
  body.children = composed.rootIds.map((id) => ({ type: "id", value: id }));
  for (const inst of composed.instances) instances.push([inst.id, inst]);
  for (const prop of composed.props) (data.props as Entries).push([prop.id, prop]);
  for (const src of composed.styleSources) (data.styleSources as Entries).push([src.id, src]);
  for (const sel of composed.styleSourceSelections) (data.styleSourceSelections as Entries).push([sel.instanceId, sel]);
  for (const decl of composed.styles) {
    const raw = decl.breakpointId as string;
    if (raw === "mobile" && !mobileBp) continue;
    const bp = raw === "base" ? baseBp : raw === "mobile" ? mobileBp! : raw;
    (data.styles as Entries).push([`${decl.styleSourceId}:${bp}::${decl.property}`, { ...decl, breakpointId: bp }]);
  }
  return doc;
}
