import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IconBack, IconEdit } from "../components/icons";
import { AiImage, BigSwatches, MockupStage, RoleBar, SimilarRow, StyleStrip } from "../components/PaletteView";
import { HeartButton, Section, softSpring } from "../components/ui";
import { PALETTE_MAP } from "../data/palettes";
import { TASTE_MAP, type MediaId, type TasteId } from "../data/tastes";
import { trioKey } from "../lib/color";
import { useApp } from "../state";

export default function Detail() {
  const { id = "" } = useParams();
  const p = PALETTE_MAP[id];
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAmbient } = useApp();
  const [shift, setShift] = useState(0);

  const taste = (params.get("taste") as TasteId) in TASTE_MAP ? (params.get("taste") as TasteId) : p?.tastes[0];
  const media = (["poster", "banner", "web", "sns"].includes(params.get("media") ?? "") ? params.get("media") : "poster") as MediaId;

  useEffect(() => {
    if (p) setAmbient(p.colors);
    setShift(0);
    window.scrollTo({ top: 0 });
  }, [p, setAmbient]);

  if (!p) return <Navigate to="/" replace />;

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    setParams(next, { replace: true });
  };

  return (
    <div className="page detail">
      <div className="detail-head">
        <motion.button className="glass glass-btn icon-btn" whileTap={{ scale: 0.88 }} onClick={() => (history.length > 1 ? navigate(-1) : navigate("/"))} aria-label="戻る">
          <IconBack />
        </motion.button>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
          {p.title}
        </motion.h1>
        <HeartButton trio={p.colors} label={p.title} paletteId={p.id} />
      </div>

      <BigSwatches trio={p.colors} names={p.names} />
      <RoleBar trio={p.colors} shift={shift} onShift={() => setShift((s) => s + 1)} />

      <MockupStage trio={p.colors} taste={taste} media={media} shift={shift} onMedia={(m) => set({ media: m })} layoutKey={`mock-${p.id}`} />

      <Section title="スタイルで見比べる">
        <StyleStrip trio={p.colors} media={media} taste={taste} shift={shift} onPick={(t) => set({ taste: t })} order={p.tastes} />
      </Section>

      <div className="tags">
        {p.keywords.map((k) => (
          <Link key={k} to={`/?q=${encodeURIComponent(k)}`} className="tag glass">
            #{k}
          </Link>
        ))}
      </div>

      <div className="actions">
        <Link to={`/colors?c=${trioKey(p.colors)}`} className="glass glass-btn wide" data-testid="edit-palette">
          <IconEdit />
          この配色を調整
        </Link>
        <AiImage trio={p.colors} taste={taste} media={media} />
      </div>

      <Section title="近い配色">
        <SimilarRow trio={p.colors} exclude={p.id} />
      </Section>
    </div>
  );
}
