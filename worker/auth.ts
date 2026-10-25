import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv, User } from "./types";

const SESSION_COOKIE = "trio_sid";
const SESSION_DAYS = 30;

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(n = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(n)));
}

async function sha256(text: string) {
  return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))));
}

function isSecure(c: Context) {
  return new URL(c.req.url).protocol === "https:";
}

function cookieOpts(c: Context, maxAge: number) {
  return { path: "/", httpOnly: true, secure: isSecure(c), sameSite: "Lax" as const, maxAge };
}

export async function getUser(c: Context<AppEnv>): Promise<User | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.picture FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(await sha256(token), Date.now())
    .first<User>();
  return row ?? null;
}

async function startSession(c: Context<AppEnv>, user: User) {
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture`,
  )
    .bind(user.id, user.email, user.name, user.picture, Date.now())
    .run();
  const token = randomToken();
  const maxAge = SESSION_DAYS * 86400;
  await c.env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), user.id, Date.now() + maxAge * 1000)
    .run();
  setCookie(c, SESSION_COOKIE, token, cookieOpts(c, maxAge));
}

function safeReturnTo(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export const auth = new Hono<AppEnv>();

auth.get("/google", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.redirect("/?auth_error=not_configured");
  }
  const origin = new URL(c.req.url).origin;
  const state = randomToken(16);
  const verifier = randomToken(48);
  const challenge = await sha256(verifier);
  const opts = cookieOpts(c, 600);
  setCookie(c, "trio_oauth_state", state, opts);
  setCookie(c, "trio_oauth_verifier", verifier, opts);
  setCookie(c, "trio_return_to", safeReturnTo(c.req.query("return_to")), opts);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return c.redirect(url.toString());
});

auth.get("/google/callback", async (c) => {
  const state = c.req.query("state");
  const code = c.req.query("code");
  const expected = getCookie(c, "trio_oauth_state");
  const verifier = getCookie(c, "trio_oauth_verifier");
  const returnTo = safeReturnTo(getCookie(c, "trio_return_to"));
  for (const name of ["trio_oauth_state", "trio_oauth_verifier", "trio_return_to"]) deleteCookie(c, name, { path: "/" });

  if (!code || !state || !expected || state !== expected || !verifier) {
    return c.redirect("/?auth_error=state");
  }

  const origin = new URL(c.req.url).origin;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/auth/google/callback`,
    }),
  });
  if (!tokenRes.ok) return c.redirect("/?auth_error=token");
  const { id_token } = await tokenRes.json<{ id_token?: string }>();
  if (!id_token) return c.redirect("/?auth_error=token");

  // The ID token comes straight from Google's token endpoint over TLS, so its claims can be trusted
  // after checking audience / issuer (OpenID Connect Core 3.1.3.7).
  const payload = JSON.parse(atob(id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  const validIss = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  if (payload.aud !== c.env.GOOGLE_CLIENT_ID || !validIss || payload.exp * 1000 < Date.now() || !payload.email_verified) {
    return c.redirect("/?auth_error=claims");
  }

  await startSession(c, {
    id: `google:${payload.sub}`,
    email: payload.email,
    name: payload.name ?? payload.email,
    picture: payload.picture ?? null,
  });
  return c.redirect(returnTo);
});

// Local-only sign-in used by the browser test suite. Enabled only when DEV_LOGIN=1 is set in .dev.vars.
auth.get("/dev-login", async (c) => {
  const host = new URL(c.req.url).hostname;
  if (c.env.DEV_LOGIN !== "1" || (host !== "localhost" && host !== "127.0.0.1")) return c.notFound();
  await startSession(c, { id: "dev:tester", email: "tester@example.test", name: "テストユーザー", picture: null });
  return c.redirect(safeReturnTo(c.req.query("return_to")));
});

auth.post("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256(token)).run();
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});
