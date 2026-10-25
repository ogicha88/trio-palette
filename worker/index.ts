import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { PALETTE_MAP } from "../src/data/palettes";
import { normalizeHex } from "../src/lib/color";
import { ai } from "./ai";
import { auth, getUser } from "./auth";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  c.set("user", user);
  await next();
});

// Reject cross-site state-changing requests (cookies are SameSite=Lax, this is a second guard).
app.use("/api/*", async (c, next) => {
  if (c.req.method !== "GET") {
    const origin = c.req.header("origin");
    if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden" }, 403);
  }
  await next();
});

app.route("/auth", auth);

app.get("/api/me", async (c) => {
  const user = await getUser(c);
  return c.json({ user, googleEnabled: Boolean(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET) });
});

app.use("/api/favorites/*", requireUser);
app.use("/api/favorites", requireUser);
app.use("/api/ai/*", requireUser);

app.get("/api/favorites", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, colors, label, palette_id, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
  )
    .bind(c.var.user.id)
    .all<{ id: number; colors: string; label: string; palette_id: string | null; created_at: number }>();
  return c.json({ favorites: results.map((r) => ({ ...r, colors: JSON.parse(r.colors) })) });
});

app.post("/api/favorites", async (c) => {
  const body = await c.req.json<{ colors?: unknown; label?: string; paletteId?: string }>().catch(() => ({}) as Record<string, never>);
  const colors = Array.isArray(body.colors) ? body.colors.map((x) => (typeof x === "string" ? normalizeHex(x) : null)) : [];
  if (colors.length !== 3 || colors.some((x) => !x)) return c.json({ error: "invalid_colors" }, 400);
  const paletteId = body.paletteId && PALETTE_MAP[body.paletteId] ? body.paletteId : null;
  const label = String(body.label ?? "").trim().slice(0, 30) || "マイ配色";
  const row = await c.env.DB.prepare(
    `INSERT INTO favorites (user_id, colors, label, palette_id, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, colors) DO UPDATE SET label = excluded.label RETURNING id, created_at`,
  )
    .bind(c.var.user.id, JSON.stringify(colors), label, paletteId, Date.now())
    .first<{ id: number; created_at: number }>();
  return c.json({ favorite: { id: row!.id, colors, label, palette_id: paletteId, created_at: row!.created_at } });
});

app.delete("/api/favorites/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM favorites WHERE id = ? AND user_id = ?").bind(Number(c.req.param("id")), c.var.user.id).run();
  return c.json({ ok: true });
});

app.route("/api/ai", ai);

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));

export default app;
