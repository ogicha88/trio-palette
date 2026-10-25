import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { IconClose, IconSearch } from "../components/icons";
import { PaletteCard } from "../components/PaletteCard";
import { Chips, Segmented, stagger } from "../components/ui";
import { PALETTES } from "../data/palettes";
import { MEDIA, TASTES, type MediaId, type TasteId } from "../data/tastes";
import { normalizeHex, deltaE } from "../lib/color";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const taste = (params.get("taste") as TasteId | null) ?? null;
  const media = (params.get("media") as MediaId | null) ?? "poster";
  const q = params.get("q") ?? "";

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const query = q.trim();
    const hex = normalizeHex(query);
    return PALETTES.filter((p) => !taste || p.tastes.includes(taste)).filter((p) => {
      if (!query) return true;
      if (hex) return p.colors.some((c) => deltaE(c, hex) < 18);
      const hay = [p.title, ...p.names, ...p.keywords, ...p.colors, ...p.tastes.map((t) => TASTES.find((x) => x.id === t)!.label)].join(" ").toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [taste, q]);

  return (
    <div className="page">
      <label className="glass search">
        <IconSearch />
        <input
          value={q}
          onChange={(e) => update({ q: e.target.value || null })}
          placeholder="キーワード・色名・#HEX"
          aria-label="配色を検索"
          enterKeyHint="search"
        />
        <AnimatePresence>
          {q && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="search-clear" onClick={() => update({ q: null })} aria-label="検索をクリア">
              <IconClose width={16} height={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </label>

      <Segmented label="媒体" value={media} options={MEDIA.map((m) => ({ id: m.id, label: m.label }))} onChange={(v) => update({ media: v === "poster" ? null : v })} />

      <Chips
        label="スタイル"
        options={[{ id: "all" as const, label: "すべて" }, ...TASTES.map((t) => ({ id: t.id, label: t.label }))]}
        selected={[taste ?? "all"]}
        onToggle={(id) => update({ taste: id === "all" || id === taste ? null : id })}
      />

      <motion.div key={`${taste}-${media}`} className={`grid grid-${media}`} variants={stagger} initial="hidden" animate="show">
        {list.map((p) => {
          const t = taste && p.tastes.includes(taste) ? taste : p.tastes[0];
          return (
            <PaletteCard
              key={p.id}
              to={`/p/${p.id}?taste=${t}&media=${media}`}
              title={p.title}
              trio={p.colors}
              taste={t}
              media={media}
              paletteId={p.id}
              layoutKey={`mock-${p.id}`}
            />
          );
        })}
      </motion.div>
      {list.length === 0 && (
        <motion.p className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          該当する配色がありません
        </motion.p>
      )}
    </div>
  );
}
