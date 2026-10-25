import { Hono } from "hono";
import { MEDIA, TASTES, TASTE_MAP, type TasteId } from "../src/data/tastes";
import { describeEn, normalizeHex, type Hex } from "../src/lib/color";
import { nameFor } from "../src/lib/match";
import type { AppEnv, Env } from "./types";

const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const DAILY_LIMIT = { text: 40, image: 15 } as const;

const TASTE_IDS = TASTES.map((t) => t.id);
const TASTE_LIST = TASTES.map((t) => `${t.id}=${t.label}`).join(", ");

async function consume(env: Env, userId: string, kind: keyof typeof DAILY_LIMIT) {
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare(
    `INSERT INTO ai_usage (user_id, day, kind, count) VALUES (?, ?, ?, 1)
     ON CONFLICT(user_id, day, kind) DO UPDATE SET count = count + 1 RETURNING count`,
  )
    .bind(userId, day, kind)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= DAILY_LIMIT[kind];
}

async function runJson<T>(env: Env, system: string, user: string, schema: object): Promise<T> {
  const out = (await env.AI.run(TEXT_MODEL as keyof AiModels, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    max_tokens: 1400,
    temperature: 0.7,
  } as never)) as { response?: unknown };
  const r = out.response;
  if (r && typeof r === "object") return r as T;
  const text = String(r ?? "");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI returned no JSON");
  return JSON.parse(m[0]) as T;
}

function pickTastes(v: unknown): TasteId[] {
  return Array.isArray(v) ? (v.filter((x) => TASTE_IDS.includes(x)) as TasteId[]).slice(0, 3) : [];
}

function strings(v: unknown, max: number, len = 40): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, max).map((x) => x.trim().slice(0, len)) : [];
}

function readTrio(v: unknown): [Hex, Hex, Hex] | null {
  if (!Array.isArray(v) || v.length !== 3) return null;
  const t = v.map((x) => (typeof x === "string" ? normalizeHex(x) : null));
  return t.every(Boolean) ? (t as [Hex, Hex, Hex]) : null;
}

export const ai = new Hono<AppEnv>();

ai.post("/analyze", async (c) => {
  const body = await c.req.json<{ colors?: unknown }>().catch(() => ({}) as { colors?: unknown });
  const trio = readTrio(body.colors);
  if (!trio) return c.json({ error: "invalid_colors" }, 400);
  if (!(await consume(c.env, c.var.user.id, "text"))) return c.json({ error: "limit" }, 429);

  const described = trio.map((h) => `${h}（${nameFor(h)}）`).join("、");
  const schema = {
    type: "object",
    properties: {
      summary: { type: "string" },
      impression: { type: "array", items: { type: "string" } },
      tastes: { type: "array", items: { type: "string", enum: TASTE_IDS } },
      uses: { type: "array", items: { type: "string" } },
      base: { type: "string" },
      main: { type: "string" },
      accent: { type: "string" },
      tips: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "impression", "tastes", "uses", "base", "main", "accent", "tips"],
  };
  try {
    const r = await runJson<Record<string, unknown>>(
      c.env,
      `あなたは日本のグラフィックデザイナーです。3色の配色を分析し、必ずJSONだけを日本語で返します。
summary: 配色の印象と特徴を40〜70文字で具体的に。
impression: 印象を表す短い言葉を5〜6個（性別や年齢のステレオタイプは使わない）。
tastes: 合うスタイルのIDを最大3つ（${TASTE_LIST}）。
uses: この配色が映える具体的なデザイン用途を3〜4個（例「古着屋のセール告知バナー」）。
base/main/accent: 入力したHEXの中から、ベース色・メイン色・アクセント色をそれぞれ1つずつ（重複なし）。
tips: 面積比・文字色・余白など、この3色ならではの使いこなしのコツを2〜3個、各30〜50文字。`,
      `配色: ${described}`,
      schema,
    );
    const pick = (k: string, fallback: Hex) => {
      const h = typeof r[k] === "string" ? normalizeHex(r[k] as string) : null;
      return h && trio.includes(h) ? h : fallback;
    };
    let roles = [pick("base", trio[0]), pick("main", trio[1]), pick("accent", trio[2])];
    if (new Set(roles).size !== 3) roles = [...trio];
    return c.json({
      summary: String(r.summary ?? "").slice(0, 80),
      impression: strings(r.impression, 6, 16).filter((w) => !/女性|男性|女の子|男の子/.test(w)),
      tastes: pickTastes(r.tastes),
      uses: strings(r.uses, 4),
      roles: { base: roles[0], main: roles[1], accent: roles[2] },
      tips: strings(r.tips, 3, 60),
    });
  } catch (e) {
    console.error("analyze failed", e);
    return c.json({ error: "ai_failed" }, 502);
  }
});

ai.post("/suggest", async (c) => {
  const body = await c.req.json<{ prompt?: string; tastes?: unknown; media?: string }>().catch(() => ({}) as Record<string, never>);
  const prompt = String(body.prompt ?? "").trim().slice(0, 200);
  const tastes = pickTastes(body.tastes);
  const media = MEDIA.find((m) => m.id === body.media);
  if (!prompt && tastes.length === 0) return c.json({ error: "empty" }, 400);
  if (!(await consume(c.env, c.var.user.id, "text"))) return c.json({ error: "limit" }, 429);

  const schema = {
    type: "object",
    properties: {
      palettes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            colors: { type: "array", items: { type: "string" } },
            names: { type: "array", items: { type: "string" } },
            tastes: { type: "array", items: { type: "string", enum: TASTE_IDS } },
            reason: { type: "string" },
          },
          required: ["title", "colors", "names", "tastes", "reason"],
        },
      },
    },
    required: ["palettes"],
  };
  const want = [
    prompt && `作りたいイメージ: ${prompt}`,
    tastes.length && `スタイル: ${tastes.map((t) => TASTE_MAP[t].label).join("、")}`,
    media && `媒体: ${media.label}`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const r = await runJson<{ palettes?: unknown[] }>(
      c.env,
      `あなたは日本のグラフィックデザイナーです。依頼に合う3色配色を3案、JSONだけで返します。
各案: title（情景が浮かぶ配色名、10文字以内の日本語）、colors（#RRGGBB形式のHEXを3つ。1色はベースに使える明るい色か暗い色、1色はメイン、1色はアクセント。原色やマテリアルデザインの既定色は避け、トーンを調整した色にする）、
names（各色の具体的なカラー名。例「ラズベリーピンク」「コバルトブルー」「生成り」。「青」「黄」のような一文字の名前は禁止）、tastes（合うスタイルIDを1〜3個: ${TASTE_LIST}）、reason（どの色が何を表現してイメージに近づくかを40〜70文字で）。
3案はそれぞれ方向性を変えてください。`,
      want,
      schema,
    );
    const palettes = (Array.isArray(r.palettes) ? r.palettes : [])
      .map((p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        const colors = readTrio(o.colors);
        if (!colors) return null;
        const names = strings(o.names, 3, 16);
        return {
          title: String(o.title ?? "").slice(0, 16) || "AI配色",
          colors,
          names: colors.map((h, i) => names[i] || nameFor(h)),
          tastes: pickTastes(o.tastes).length ? pickTastes(o.tastes) : tastes.length ? tastes : (["modern"] as TasteId[]),
          reason: String(o.reason ?? "").slice(0, 90),
        };
      })
      .filter(Boolean)
      .slice(0, 3);
    if (palettes.length === 0) return c.json({ error: "ai_failed" }, 502);
    return c.json({ palettes });
  } catch (e) {
    console.error("suggest failed", e);
    return c.json({ error: "ai_failed" }, 502);
  }
});

ai.post("/image", async (c) => {
  const body = await c.req.json<{ colors?: unknown; taste?: string; media?: string }>().catch(() => ({}) as Record<string, never>);
  const trio = readTrio(body.colors);
  const taste = TASTE_MAP[body.taste as TasteId] ?? TASTE_MAP.modern;
  const media = MEDIA.find((m) => m.id === body.media) ?? MEDIA[0];
  if (!trio) return c.json({ error: "invalid_colors" }, 400);
  if (!(await consume(c.env, c.var.user.id, "image"))) return c.json({ error: "limit" }, 429);

  const palette = trio.map((h) => `${describeEn(h)} (${h})`).join(", ");
  const prompt = `A ${taste.en} ${media.en} design featuring ${taste.subject}, stylish editorial illustration with a clear focal point and generous layout, colored strictly with a three-color palette of ${palette}, harmonious, high quality, no text, no letters, no watermark`;
  try {
    const out = (await c.env.AI.run(IMAGE_MODEL as keyof AiModels, { prompt, steps: 8 } as never)) as { image?: string };
    if (!out.image) return c.json({ error: "ai_failed" }, 502);
    const bytes = Uint8Array.from(atob(out.image), (ch) => ch.charCodeAt(0));
    return new Response(bytes, { headers: { "content-type": "image/jpeg", "cache-control": "no-store" } });
  } catch (e) {
    console.error("image failed", e);
    return c.json({ error: "ai_failed" }, 502);
  }
});

