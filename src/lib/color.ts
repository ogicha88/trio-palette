export type Hex = string;
export type Trio = [Hex, Hex, Hex];

export const HEX_RE = /^#?([0-9a-f]{6})$/i;

export function normalizeHex(input: string): Hex | null {
  const s = input.trim();
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  const m = HEX_RE.exec(s);
  return m ? `#${m[1]}`.toUpperCase() : null;
}

export function hexToRgb(hex: Hex): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): Hex {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function hexToHsl(hex: Hex): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): Hex {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

function srgbToLinear(v: number) {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: Hex, b: Hex): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function hexToLab(hex: Hex): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function deltaE(a: Hex, b: Hex): number {
  const [l1, a1, b1] = hexToLab(a);
  const [l2, a2, b2] = hexToLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const PERMS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

/** Order-independent distance between two trios. */
export function trioDistance(a: Trio, b: Trio): number {
  let best = Infinity;
  for (const p of PERMS) {
    const d = deltaE(a[0], b[p[0]]) + deltaE(a[1], b[p[1]]) + deltaE(a[2], b[p[2]]);
    if (d < best) best = d;
  }
  return best / 3;
}

export function mix(a: Hex, b: Hex, t: number): Hex {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function alpha(hex: Hex, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export type Roles = {
  base: Hex;
  main: Hex;
  accent: Hex;
  /** Readable text color on base. */
  ink: Hex;
  /** Readable text color on main. */
  onMain: Hex;
  /** Readable text color on accent. */
  onAccent: Hex;
};

function readableOn(bg: Hex, candidates: Hex[]): Hex {
  const pool = [...candidates, "#141414", "#FFFFFF"];
  const ok = pool.find((c) => contrast(c, bg) >= 4.5);
  if (ok) return ok;
  return contrast("#141414", bg) > contrast("#FFFFFF", bg) ? "#141414" : "#FFFFFF";
}

/**
 * Picks base / main / accent from a trio.
 * The lightest (or least saturated) color becomes the base, the one with the
 * strongest contrast against it becomes main, the rest is accent.
 * `shift` rotates the assignment so users can preview other role combinations.
 */
export function assignRoles(trio: Trio, shift = 0): Roles {
  const scored = trio.map((hex, i) => {
    const [, s, l] = hexToHsl(hex);
    return { hex, i, baseScore: l * 1.2 - s * 0.35 };
  });
  scored.sort((a, b) => b.baseScore - a.baseScore);
  const base0 = scored[0].hex;
  const rest = scored.slice(1).map((x) => x.hex);
  rest.sort((a, b) => contrast(b, base0) - contrast(a, base0));
  const ordered = [base0, rest[0], rest[1]];
  const k = ((shift % 3) + 3) % 3;
  const [base, main, accent] = [ordered[k], ordered[(k + 1) % 3], ordered[(k + 2) % 3]];
  return {
    base,
    main,
    accent,
    ink: readableOn(base, [main, accent].sort((a, b) => contrast(b, base) - contrast(a, base))),
    onMain: readableOn(main, [base, accent]),
    onAccent: readableOn(accent, [base, main]),
  };
}

const HUE_JA: [number, string][] = [
  [15, "レッド"],
  [40, "オレンジ"],
  [52, "イエローオレンジ"],
  [68, "イエロー"],
  [90, "ライム"],
  [150, "グリーン"],
  [175, "ミント"],
  [195, "シアン"],
  [215, "スカイブルー"],
  [245, "ブルー"],
  [270, "インディゴ"],
  [295, "パープル"],
  [330, "マゼンタ"],
  [350, "ピンク"],
  [361, "レッド"],
];

const HUE_EN: [number, string][] = [
  [15, "red"],
  [40, "orange"],
  [52, "amber"],
  [68, "yellow"],
  [90, "lime"],
  [150, "green"],
  [175, "mint"],
  [195, "cyan"],
  [215, "sky blue"],
  [245, "blue"],
  [270, "indigo"],
  [295, "purple"],
  [330, "magenta"],
  [350, "pink"],
  [361, "red"],
];

function hueName(h: number, table: [number, string][]) {
  return table.find(([max]) => h < max)![1];
}

export function describeEn(hex: Hex): string {
  const [h, s, l] = hexToHsl(hex);
  if (s < 10) {
    if (l > 93) return "off-white";
    if (l < 12) return "near black";
    return l > 60 ? "light gray" : "charcoal gray";
  }
  const hue = hueName(h, HUE_EN);
  const tone = l > 82 ? "pale" : l > 65 ? "light" : l < 25 ? "deep" : l < 40 ? "dark" : s > 70 ? "vivid" : "muted";
  return `${tone} ${hue}`;
}

export function describeJa(hex: Hex): string {
  const [h, s, l] = hexToHsl(hex);
  if (s < 10) {
    if (l > 93) return "オフホワイト";
    if (l < 12) return "ブラック";
    return l > 60 ? "ライトグレー" : "チャコールグレー";
  }
  const hue = hueName(h, HUE_JA);
  const tone = l > 82 ? "ペール" : l > 65 ? "ライト" : l < 25 ? "ディープ" : l < 40 ? "ダーク" : s > 70 ? "ビビッド" : "スモーキー";
  return `${tone}${hue}`;
}

export function randomTrio(): Trio {
  const h = Math.random() * 360;
  const scheme = Math.floor(Math.random() * 3);
  const base = hslToHex(h + 20, 30 + Math.random() * 30, 92 + Math.random() * 5);
  const main = hslToHex(h + (scheme === 0 ? 180 : scheme === 1 ? 150 : 210), 55 + Math.random() * 35, 30 + Math.random() * 20);
  const accent = hslToHex(h + (scheme === 2 ? 30 : 0), 70 + Math.random() * 30, 50 + Math.random() * 12);
  return [base, main, accent];
}

export function trioKey(trio: Trio): string {
  return trio.map((c) => c.replace("#", "")).join("-");
}

export function parseTrioKey(key: string | null): Trio | null {
  if (!key) return null;
  const parts = key.split("-").map((p) => normalizeHex(p));
  if (parts.length !== 3 || parts.some((p) => !p)) return null;
  return parts as Trio;
}
