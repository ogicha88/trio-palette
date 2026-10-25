import type { MediaId, TasteId } from "../data/tastes";
import type { Hex, Trio } from "./color";

export type User = { id: string; email: string; name: string; picture: string | null };
export type Favorite = { id: number; colors: Trio; label: string; palette_id: string | null; created_at: number };
export type Analysis = {
  summary: string;
  impression: string[];
  tastes: TasteId[];
  uses: string[];
  roles: { base: Hex; main: Hex; accent: Hex };
  tips: string[];
};
export type Suggestion = { title: string; colors: Trio; names: string[]; tastes: TasteId[]; reason: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    credentials: "same-origin",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: "network" }))) as { error?: string };
    throw new ApiError(res.status, body.error ?? "error");
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: User | null; googleEnabled: boolean }>("/api/me"),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  favorites: () => request<{ favorites: Favorite[] }>("/api/favorites"),
  addFavorite: (colors: Trio, label: string, paletteId?: string) =>
    request<{ favorite: Favorite }>("/api/favorites", { method: "POST", body: JSON.stringify({ colors, label, paletteId }) }),
  removeFavorite: (id: number) => request<{ ok: true }>(`/api/favorites/${id}`, { method: "DELETE" }),
  analyze: (colors: Trio) => request<Analysis>("/api/ai/analyze", { method: "POST", body: JSON.stringify({ colors }) }),
  suggest: (prompt: string, tastes: TasteId[], media: MediaId) =>
    request<{ palettes: Suggestion[] }>("/api/ai/suggest", { method: "POST", body: JSON.stringify({ prompt, tastes, media }) }),
  image: async (colors: Trio, taste: TasteId, media: MediaId) => {
    const res = await fetch("/api/ai/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ colors, taste, media }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: "network" }))) as { error?: string };
      throw new ApiError(res.status, body.error ?? "error");
    }
    return URL.createObjectURL(await res.blob());
  },
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "ログインが必要です";
    if (e.status === 429) return "本日のAI利用回数の上限に達しました";
    if (e.code === "ai_failed") return "AIの応答を取得できませんでした。もう一度お試しください";
  }
  return "通信エラーが発生しました";
}

export function loginUrl(returnTo = location.pathname + location.search) {
  return `/auth/google?return_to=${encodeURIComponent(returnTo)}`;
}
