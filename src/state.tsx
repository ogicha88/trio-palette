import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, errorMessage, type Favorite, type User } from "./lib/api";
import { trioKey, type Trio } from "./lib/color";

type Toast = { id: number; text: string };

type AppState = {
  ready: boolean;
  user: User | null;
  googleEnabled: boolean;
  favorites: Favorite[];
  favoritesLoaded: boolean;
  isFavorite: (trio: Trio) => boolean;
  toggleFavorite: (trio: Trio, label: string, paletteId?: string) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  logout: () => Promise<void>;
  toast: Toast | null;
  showToast: (text: string) => void;
  ambient: Trio;
  setAmbient: (trio: Trio) => void;
  loginSheet: boolean;
  setLoginSheet: (open: boolean) => void;
};

const Ctx = createContext<AppState | null>(null);

const DEFAULT_AMBIENT: Trio = ["#A2D2FF", "#CDB4DB", "#FFD6E0"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [ambient, setAmbient] = useState<Trio>(DEFAULT_AMBIENT);
  const [loginSheet, setLoginSheet] = useState(false);
  const toastTimer = useRef<number>(undefined);

  const showToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const fontsReady = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
    const minDelay = new Promise((r) => setTimeout(r, 450));
    const me = api
      .me()
      .then(async (r) => {
        setUser(r.user);
        setGoogleEnabled(r.googleEnabled);
        if (r.user) {
          const f = await api.favorites();
          setFavorites(f.favorites);
        }
      })
      .catch(() => undefined)
      .finally(() => setFavoritesLoaded(true));
    Promise.all([me, fontsReady, minDelay]).then(() => setReady(true));

    const params = new URLSearchParams(location.search);
    if (params.get("auth_error")) {
      showToast(params.get("auth_error") === "not_configured" ? "Googleログインは現在準備中です" : "ログインできませんでした");
      params.delete("auth_error");
      history.replaceState(null, "", location.pathname + (params.size ? `?${params}` : ""));
    }
  }, [showToast]);

  const isFavorite = useCallback(
    (trio: Trio) => favorites.some((f) => trioKey(f.colors) === trioKey(trio)),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (trio: Trio, label: string, paletteId?: string) => {
      if (!user) {
        setLoginSheet(true);
        return;
      }
      const existing = favorites.find((f) => trioKey(f.colors) === trioKey(trio));
      try {
        if (existing) {
          setFavorites((fs) => fs.filter((f) => f.id !== existing.id));
          await api.removeFavorite(existing.id);
          showToast("保存を解除しました");
        } else {
          const { favorite } = await api.addFavorite(trio, label, paletteId);
          setFavorites((fs) => [favorite, ...fs.filter((f) => f.id !== favorite.id)]);
          showToast("保存しました");
        }
      } catch (e) {
        showToast(errorMessage(e));
        api.favorites().then((f) => setFavorites(f.favorites)).catch(() => undefined);
      }
    },
    [favorites, user, showToast],
  );

  const removeFavorite = useCallback(
    async (id: number) => {
      setFavorites((fs) => fs.filter((f) => f.id !== id));
      await api.removeFavorite(id).catch((e) => showToast(errorMessage(e)));
    },
    [showToast],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setFavorites([]);
    showToast("ログアウトしました");
  }, [showToast]);

  const value = useMemo(
    () => ({
      ready,
      user,
      googleEnabled,
      favorites,
      favoritesLoaded,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      logout,
      toast,
      showToast,
      ambient,
      setAmbient,
      loginSheet,
      setLoginSheet,
    }),
    [ready, user, googleEnabled, favorites, favoritesLoaded, isFavorite, toggleFavorite, removeFavorite, logout, toast, showToast, ambient, loginSheet],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}
