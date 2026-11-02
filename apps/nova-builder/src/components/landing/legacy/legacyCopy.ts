// The copy of the landing page before task 028, kept as it was (English and Vietnamese). It lives
// here, not in the dictionaries, so the landing can be swapped without touching them.

export type LegacyCopy = {
  nav: { tryDemo: string; pricing: string; projects: string; login: string; signup: string };
  landing: {
    badge: string; titleLead: string; titleAccent: string; subtitle: string;
    promptSrLabel: string; promptPlaceholder: string; pressEnter: string; startBuildingFree: string; building: string; tryLabel: string;
    examples: { icon: string; label: string; prompt: string }[];
    trustBadges: string[];
    features: { icon: string; title: string; body: string }[];
    ctaSubtitle: string; getStartedFree: string; tryDemo: string;
    simplifyDesignLead: string; simplifyDesignAccent: string;
    buildEverythingLead: string; buildEverythingAccent: string; buildEverythingDesc: string;
    deployAnythingLead: string; deployAnythingAccent: string; deployAnythingDesc: string;
    growProductTitle: string; growProductDesc: string;
    testimonialsTitle: string; testimonials: { name: string; quote: string }[];
    newsEyebrow: string; newsTitle: string;
  };
  site: {
    footerRights: string; footerPricing: string; footerTerms: string; footerPrivacy: string; footerSupport: string;
    navHome: string; navMenu: string; typingPhrases: string[];
    connectLead: string; connectRest: string; connectBody: string; exploreIntegrations: string; starsAlt: string;
  };
};

const en: LegacyCopy = {
  nav: { tryDemo: "Try Demo", pricing: "Pricing", projects: "Projects", login: "Log in", signup: "Sign up free" },
  landing: {
      badge: "✦ AI-powered website builder",
      titleLead: "Build any website",
      titleAccent: "with AI.",
      subtitle: "Describe what you need. Nova generates a fully editable site in seconds — no code, no setup.",
      promptSrLabel: "Describe the website you want to build",
      promptPlaceholder: 'e.g. "A landing page for a SaaS startup with pricing, features, and FAQ"',
      pressEnter: "Press Enter to start",
      startBuildingFree: "Start building free →",
      building: "Building…",
      tryLabel: "Try:",
      examples: [
        { icon: "☕", label: "Coffee shop", prompt: "A landing page for a cozy coffee shop — hero photo, menu highlights, hours, and a map" },
        { icon: "🎨", label: "Portfolio", prompt: "A clean designer portfolio with a project gallery, short bio, and contact section" },
        { icon: "🚀", label: "SaaS pricing", prompt: "A SaaS pricing page with three tiers, feature comparison table, and an FAQ" },
        { icon: "📚", label: "Online course", prompt: "A course landing page with curriculum overview, instructor bio, testimonials, and enroll CTA" },
      ],
      trustBadges: ["No credit card required", "Free to start", "Publish in one click"],
      features: [
        { icon: "⚡", title: "Instant generation", body: "Describe your site and AI builds it in seconds." },
        { icon: "✏️", title: "Visual editing", body: "Click any element to change text, colors, and layout." },
        { icon: "🚀", title: "One-click publish", body: "Share a preview link or export clean React code." },
        { icon: "🔒", title: "Your data, your code", body: "Export to GitHub. Own everything, forever." },
      ],
      ctaTitle: "Ready to build your website?",
      ctaSubtitle: "Free forever. No credit card required.",
      getStartedFree: "Get started free",
      tryDemo: "Try the demo",
      simplifyDesignLead: "Simplify",
      simplifyDesignAccent: "your design",
      buildEverythingLead: "Build",
      buildEverythingAccent: "everything",
      buildEverythingDesc: "Sync your ideas with raw HTML & React code. Nova is your personal AI Web Designer, making building websites easy to write, easy to own.",
      deployAnythingLead: "Deploy",
      deployAnythingAccent: "anything",
      deployAnythingDesc: "Nova AI turns your prompt requests into live, functional websites in seconds—grounded in clean code and optimized layout.",
      growProductTitle: "Grow your product",
      growProductDesc: "Design with intention. Preview your website in real-time and customize every single element with your AI design assistant.",
      testimonialsTitle: "Read what people say",
      testimonials: [
        { name: "SONIA H.", quote: "Nova makes website building so easy and simple. It's so nice to see my site live in seconds." },
        { name: "ALEX C.", quote: "All my customizations can connect. I love being able to export React code in one click." },
        { name: "SARAH W.", quote: "Nova is a one-stop shop for everything design in your life." }
      ],
      newsEyebrow: "Free forever — limited time",
      newsTitle: "Launch your website",
  } as LegacyCopy["landing"],
  site: {
    footerRights: "© {year} Nova. All rights reserved.",
    footerPricing: "Pricing",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerSupport: "Support",
    navHome: "home",
    navMenu: "Menu",
    connectLead: "Connect",
    connectRest: "your apps",
    connectBody: "Integrate with your favorite tools. Nova connects with Figma, GitHub, Vercel, and hundreds more.",
    exploreIntegrations: "EXPLORE INTEGRATIONS",
    starsAlt: "5 stars",
    typingPhrases: [
      "Build me a SaaS landing page...",
      "Create an e-commerce store...",
      "Design a portfolio website...",
      "Make a dashboard for my startup...",
    ],
  },
};

const vi: LegacyCopy = {
  nav: { tryDemo: "Dùng thử", pricing: "Bảng giá", projects: "Dự án", login: "Đăng nhập", signup: "Đăng ký miễn phí" },
  landing: {
      badge: "✦ Trình tạo website bằng AI",
      titleLead: "Tạo mọi website",
      titleAccent: "bằng AI.",
      subtitle: "Mô tả điều bạn cần. Nova tạo ra một trang web có thể chỉnh sửa hoàn toàn trong vài giây — không cần code, không cần cài đặt.",
      promptSrLabel: "Mô tả website bạn muốn tạo",
      promptPlaceholder: 'ví dụ: "Trang giới thiệu cho một startup SaaS với bảng giá, tính năng và câu hỏi thường gặp"',
      pressEnter: "Nhấn Enter để bắt đầu",
      startBuildingFree: "Bắt đầu miễn phí →",
      building: "Đang tạo…",
      tryLabel: "Thử:",
      examples: [
        { icon: "☕", label: "Quán cà phê", prompt: "Trang giới thiệu cho một quán cà phê ấm cúng — ảnh hero, món nổi bật, giờ mở cửa và bản đồ" },
        { icon: "🎨", label: "Portfolio", prompt: "Một portfolio nhà thiết kế gọn gàng với thư viện dự án, tiểu sử ngắn và phần liên hệ" },
        { icon: "🚀", label: "Bảng giá SaaS", prompt: "Một trang bảng giá SaaS với ba gói, bảng so sánh tính năng và phần câu hỏi thường gặp" },
        { icon: "📚", label: "Khóa học online", prompt: "Trang giới thiệu khóa học với tổng quan chương trình, tiểu sử giảng viên, đánh giá và nút đăng ký" },
      ],
      trustBadges: ["Không cần thẻ tín dụng", "Miễn phí để bắt đầu", "Xuất bản chỉ với một cú nhấp"],
      features: [
        { icon: "⚡", title: "Tạo tức thì", body: "Mô tả trang của bạn và AI tạo ra trong vài giây." },
        { icon: "✏️", title: "Chỉnh sửa trực quan", body: "Nhấp vào bất kỳ phần tử nào để đổi văn bản, màu sắc và bố cục." },
        { icon: "🚀", title: "Xuất bản một cú nhấp", body: "Chia sẻ liên kết xem trước hoặc xuất mã React sạch." },
        { icon: "🔒", title: "Dữ liệu của bạn, mã của bạn", body: "Xuất sang GitHub. Sở hữu mọi thứ, mãi mãi." },
      ],
      ctaTitle: "Sẵn sàng tạo website của bạn?",
      ctaSubtitle: "Miễn phí trọn đời. Không cần thẻ tín dụng.",
      getStartedFree: "Bắt đầu miễn phí",
      tryDemo: "Dùng thử bản demo",
      simplifyDesignLead: "Đơn giản hóa",
      simplifyDesignAccent: "thiết kế của bạn",
      buildEverythingLead: "Xây dựng",
      buildEverythingAccent: "mọi thứ",
      buildEverythingDesc: "Đồng bộ hóa ý tưởng của bạn với mã nguồn HTML & React thuần túy. Nova là Nhà thiết kế Web AI cá nhân của bạn, giúp việc tạo trang web trở nên dễ dàng viết, dễ dàng sở hữu.",
      deployAnythingLead: "Triển khai",
      deployAnythingAccent: "mọi thứ",
      deployAnythingDesc: "Nova AI biến các yêu cầu prompt của bạn thành các trang web hoạt động trực tiếp trong vài giây — dựa trên mã nguồn sạch và bố cục tối ưu.",
      growProductTitle: "Phát triển sản phẩm của bạn",
      growProductDesc: "Thiết kế có chủ đích. Xem trước trang web của bạn trong thời gian thực và tùy chỉnh từng phần tử với trợ lý thiết kế AI.",
      testimonialsTitle: "Đọc đánh giá từ người dùng",
      testimonials: [
        { name: "SONIA H.", quote: "Nova giúp việc tạo trang web trở nên thật dễ dàng và đơn giản. Thật tuyệt vời khi thấy trang web của mình hoạt động chỉ trong vài giây." },
        { name: "ALEX C.", quote: "Tất cả các tùy chỉnh của tôi đều có thể kết nối. Tôi thích việc có thể xuất mã React chỉ bằng một cú nhấp chuột." },
        { name: "SARAH W.", quote: "Nova là một điểm dừng duy nhất cho mọi thứ về thiết kế trong cuộc sống của bạn." }
      ],
      newsEyebrow: "Miễn phí mãi mãi — thời gian có hạn",
      newsTitle: "Khởi chạy trang web của bạn",
  } as LegacyCopy["landing"],
  site: {
    footerRights: "© {year} Nova. Bảo lưu mọi quyền.",
    footerPricing: "Bảng giá",
    footerTerms: "Điều khoản",
    footerPrivacy: "Quyền riêng tư",
    footerSupport: "Hỗ trợ",
    navHome: "trang chủ",
    navMenu: "Menu",
    connectLead: "Kết nối",
    connectRest: "các ứng dụng của bạn",
    connectBody: "Tích hợp với các công cụ yêu thích của bạn. Nova kết nối với Figma, GitHub, Vercel và hàng trăm công cụ khác.",
    exploreIntegrations: "KHÁM PHÁ TÍCH HỢP",
    starsAlt: "5 sao",
    typingPhrases: [
      "Tạo cho tôi một trang giới thiệu SaaS...",
      "Tạo một cửa hàng thương mại điện tử...",
      "Thiết kế một website portfolio...",
      "Làm bảng điều khiển cho startup của tôi...",
    ],
  },
};

export const LEGACY_COPY: Record<"en" | "vi", LegacyCopy> = { en, vi };
