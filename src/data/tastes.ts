export type TasteId =
  | "casual"
  | "cute"
  | "modern"
  | "pop"
  | "elegant"
  | "natural"
  | "retro"
  | "cool"
  | "minimal"
  | "japanese"
  | "street"
  | "tech"
  | "luxury"
  | "fresh";

export type Deco =
  | "tape"
  | "stars"
  | "blocks"
  | "burst"
  | "frame"
  | "leaves"
  | "sun"
  | "lines"
  | "none"
  | "wave"
  | "halftone"
  | "grid"
  | "arch"
  | "bubbles";

export type Layout = "stack" | "center" | "split";

export type Taste = {
  id: TasteId;
  label: string;
  en: string;
  /** English subject used for AI image prompts. */
  subject: string;
  /** Display font for mockup headlines. */
  display: string;
  /** Japanese sub font. */
  jp: string;
  weight: number;
  italic?: boolean;
  upper?: boolean;
  tracking: number;
  radius: number;
  deco: Deco;
  layout: Layout;
  sample: {
    kicker: string;
    title: string;
    jp: string;
    date: string;
    cta: string;
    nav: string[];
  };
};

const F = {
  script: "'Yellowtail', cursive",
  heavy: "'Dela Gothic One', sans-serif",
  grotesk: "'Space Grotesk', sans-serif",
  serif: "'Playfair Display', serif",
  bebas: "'Bebas Neue', sans-serif",
  retro: "'DM Serif Display', serif",
  round: "'Zen Maru Gothic', sans-serif",
  mincho: "'Shippori Mincho B1', serif",
  sans: "'Noto Sans JP', sans-serif",
};

export const TASTES: Taste[] = [
  {
    id: "casual",
    label: "カジュアル",
    en: "casual",
    subject: "students enjoying a school festival",
    display: F.script,
    jp: F.round,
    weight: 400,
    tracking: 0,
    radius: 14,
    deco: "tape",
    layout: "stack",
    sample: { kicker: "SCHOOL", title: "Festival", jp: "文化祭", date: "10.25 SAT", cta: "詳しく見る", nav: ["About", "Event", "Access"] },
  },
  {
    id: "cute",
    label: "かわいい",
    en: "cute, kawaii",
    subject: "a girl in a cozy zakka gift shop with ribbons and sweets",
    display: F.script,
    jp: F.round,
    weight: 400,
    tracking: 0,
    radius: 28,
    deco: "stars",
    layout: "center",
    sample: { kicker: "ZAKKA SHOP", title: "Pinky Store", jp: "毎日を少し特別に", date: "10.18 NEW OPEN", cta: "Shop", nav: ["Item", "Gift", "Shop"] },
  },
  {
    id: "modern",
    label: "モダン",
    en: "modern geometric",
    subject: "a woman sipping coffee in a stylish cafe, bauhaus shapes",
    display: F.grotesk,
    jp: F.sans,
    weight: 700,
    upper: true,
    tracking: -0.04,
    radius: 0,
    deco: "blocks",
    layout: "split",
    sample: { kicker: "GOOD COFFEE", title: "CAFE", jp: "グランドオープン", date: "11.1 SAT", cta: "Menu", nav: ["Menu", "Story", "Map"] },
  },
  {
    id: "pop",
    label: "ポップ",
    en: "pop, playful",
    subject: "a hand holding a scoop of ice cream at a shop opening",
    display: F.heavy,
    jp: F.heavy,
    weight: 400,
    upper: true,
    tracking: -0.02,
    radius: 999,
    deco: "burst",
    layout: "stack",
    sample: { kicker: "ICE CREAM", title: "GRAND OPEN", jp: "アイスで、毎日を。", date: "7.8 TUE", cta: "GO!", nav: ["Flavor", "Shop", "News"] },
  },
  {
    id: "elegant",
    label: "エレガント",
    en: "elegant",
    subject: "a flower atelier with bouquets",
    display: F.serif,
    jp: F.mincho,
    weight: 400,
    italic: true,
    tracking: 0.01,
    radius: 2,
    deco: "frame",
    layout: "center",
    sample: { kicker: "FLOWER ATELIER", title: "Bloom", jp: "花と暮らす", date: "SPRING 2026", cta: "Reserve", nav: ["Atelier", "Lesson", "Contact"] },
  },
  {
    id: "natural",
    label: "ナチュラル",
    en: "natural, organic",
    subject: "an organic farmers market with vegetables and plants",
    display: F.retro,
    jp: F.round,
    weight: 400,
    tracking: 0,
    radius: 22,
    deco: "leaves",
    layout: "split",
    sample: { kicker: "ORGANIC MARKET", title: "Green Days", jp: "やさしい朝市", date: "SUN 8:00-", cta: "Visit", nav: ["Market", "Farm", "Map"] },
  },
  {
    id: "retro",
    label: "レトロ",
    en: "retro vintage",
    subject: "a vintage japanese kissaten coffee shop with cream soda",
    display: F.retro,
    jp: F.mincho,
    weight: 400,
    tracking: 0,
    radius: 6,
    deco: "sun",
    layout: "center",
    sample: { kicker: "SINCE 1975", title: "Kissa", jp: "純喫茶", date: "OPEN 9:00", cta: "Menu", nav: ["Menu", "Story", "Visit"] },
  },
  {
    id: "cool",
    label: "クール",
    en: "cool, sharp",
    subject: "a band performing at a night concert",
    display: F.bebas,
    jp: F.sans,
    weight: 400,
    upper: true,
    tracking: 0.04,
    radius: 0,
    deco: "lines",
    layout: "split",
    sample: { kicker: "LIVE TOUR", title: "NIGHT SHIFT", jp: "一夜限り", date: "12.20 FRI", cta: "TICKET", nav: ["Live", "Ticket", "Shop"] },
  },
  {
    id: "minimal",
    label: "ミニマル",
    en: "minimal",
    subject: "a modern art exhibition with sculptures",
    display: F.grotesk,
    jp: F.sans,
    weight: 400,
    tracking: -0.02,
    radius: 0,
    deco: "none",
    layout: "stack",
    sample: { kicker: "EXHIBITION", title: "Form", jp: "かたちの展示", date: "2026.3.1—3.31", cta: "Info", nav: ["Works", "About", "Info"] },
  },
  {
    id: "japanese",
    label: "和モダン",
    en: "modern japanese wa",
    subject: "a traditional japanese tea house with matcha",
    display: F.mincho,
    jp: F.mincho,
    weight: 700,
    tracking: 0.1,
    radius: 0,
    deco: "wave",
    layout: "center",
    sample: { kicker: "TEA HOUSE", title: "茶寮", jp: "季節の一服", date: "令和八年 春", cta: "予約", nav: ["お品書き", "茶室", "案内"] },
  },
  {
    id: "street",
    label: "ストリート",
    en: "street, urban",
    subject: "a skateboarder in an urban skate park",
    display: F.heavy,
    jp: F.heavy,
    weight: 400,
    upper: true,
    tracking: -0.04,
    radius: 0,
    deco: "halftone",
    layout: "split",
    sample: { kicker: "SKATE PARK", title: "PUSH", jp: "滑ろう", date: "8.12 SAT", cta: "JOIN", nav: ["Park", "Shop", "Crew"] },
  },
  {
    id: "tech",
    label: "テック",
    en: "tech, digital",
    subject: "a young person with a laptop at a technology conference",
    display: F.grotesk,
    jp: F.sans,
    weight: 700,
    upper: true,
    tracking: -0.05,
    radius: 10,
    deco: "grid",
    layout: "stack",
    sample: { kicker: "TECH CONFERENCE", title: "IT FES", jp: "テクノロジーで、未来を。", date: "11.15 SAT", cta: "Entry", nav: ["Talk", "Expo", "Entry"] },
  },
  {
    id: "luxury",
    label: "ラグジュアリー",
    en: "luxury, premium",
    subject: "fine jewelry displayed in a boutique",
    display: F.serif,
    jp: F.mincho,
    weight: 400,
    upper: true,
    tracking: 0.18,
    radius: 0,
    deco: "arch",
    layout: "center",
    sample: { kicker: "FINE JEWELRY", title: "LUMIÈRE", jp: "永遠のきらめき", date: "COLLECTION 2026", cta: "Discover", nav: ["Collection", "Boutique", "Care"] },
  },
  {
    id: "fresh",
    label: "フレッシュ",
    en: "fresh, summery",
    subject: "a summer juice stand with citrus fruits",
    display: F.round,
    jp: F.round,
    weight: 900,
    tracking: -0.02,
    radius: 24,
    deco: "bubbles",
    layout: "split",
    sample: { kicker: "JUICE STAND", title: "Squeeze!", jp: "しぼりたて", date: "SUMMER 7.1-", cta: "Order", nav: ["Juice", "Bowl", "Shop"] },
  },
];

export const TASTE_MAP = Object.fromEntries(TASTES.map((t) => [t.id, t])) as Record<TasteId, Taste>;

export type MediaId = "poster" | "banner" | "web" | "sns";

export const MEDIA: { id: MediaId; label: string; en: string }[] = [
  { id: "poster", label: "ポスター", en: "poster" },
  { id: "banner", label: "バナー", en: "web banner" },
  { id: "web", label: "Webサイト", en: "website hero" },
  { id: "sns", label: "SNS", en: "social media post" },
];

