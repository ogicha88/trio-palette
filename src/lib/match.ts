import { PALETTES, type Palette } from "../data/palettes";
import { TASTES, type TasteId } from "../data/tastes";
import { deltaE, describeJa, trioDistance, type Hex, type Trio } from "./color";

const NAMED = PALETTES.flatMap((p) => p.colors.map((hex, i) => ({ hex, name: p.names[i] })));

/** Japanese color name: the closest curated name when it is close enough, else a tone + hue description. */
export function nameFor(hex: Hex): string {
  let best = { d: Infinity, name: "" };
  for (const n of NAMED) {
    const d = deltaE(hex, n.hex);
    if (d < best.d) best = { d, name: n.name };
  }
  return best.d < 6 ? best.name : describeJa(hex);
}

export function similarPalettes(trio: Trio, limit = 6): (Palette & { distance: number })[] {
  return PALETTES.map((p) => ({ ...p, distance: trioDistance(trio, p.colors) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/** Taste affinity of any trio, from the tags of its nearest curated palettes. */
export function tasteScores(trio: Trio): { id: TasteId; score: number }[] {
  const scores = new Map<TasteId, number>();
  for (const p of similarPalettes(trio, 10)) {
    const w = 1 / (1 + p.distance / 8);
    p.tastes.forEach((t, i) => scores.set(t, (scores.get(t) ?? 0) + w * (i === 0 ? 1.4 : 1)));
  }
  const max = Math.max(...scores.values(), 0.0001);
  return TASTES.map((t) => ({ id: t.id, score: (scores.get(t.id) ?? 0) / max }))
    .sort((a, b) => b.score - a.score);
}

/** Keyword + taste search over curated palettes, used for the guest version of image → palette. */
export function searchPalettes(text: string, tastes: TasteId[], limit = 8): Palette[] {
  const q = text.trim();
  const scored = PALETTES.map((p) => {
    let s = 0;
    for (const t of tastes) if (p.tastes.includes(t)) s += p.tastes[0] === t ? 3 : 2;
    for (const k of p.keywords) if (q && (q.includes(k) || k.includes(q))) s += 4;
    for (const t of TASTES) if (q.includes(t.label) && p.tastes.includes(t.id)) s += 3;
    if (q && (q.includes(p.title) || p.names.some((n) => q.includes(n)))) s += 3;
    return { p, s };
  });
  return scored
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}
