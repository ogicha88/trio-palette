import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MEDIA, TASTES, TASTE_MAP, type MediaId, type TasteId } from "../data/tastes";
import { api, errorMessage } from "../lib/api";
import { assignRoles, trioKey, type Trio } from "../lib/color";
import { similarPalettes } from "../lib/match";
import { useApp } from "../state";
import { IconImage, IconSwap } from "./icons";
import { Mockup } from "./mockups/Mockup";
import { Sk } from "./Skeleton";
import { Segmented, softSpring, spring, SwatchStrip, textOn } from "./ui";

export function BigSwatches({ trio, names }: { trio: Trio; names: string[] }) {
  const { showToast } = useApp();
  return (
    <div className="big-swatches">
      {trio.map((c, i) => (
        <motion.button
          key={i}
          className="big-swatch glass"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpring, delay: 0.06 * i }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigator.clipboard?.writeText(c).catch(() => undefined);
            showToast(`${c} をコピーしました`);
          }}
          aria-label={`${names[i]} ${c} をコピー`}
        >
          <motion.span
            className="big-swatch-fill"
            initial={{ clipPath: "inset(100% 0 0 0 round 18px)" }}
            animate={{ clipPath: "inset(0% 0 0 0 round 18px)", backgroundColor: c }}
            transition={{ clipPath: { duration: 0.7, delay: 0.1 + 0.08 * i, ease: [0.22, 1, 0.36, 1] }, backgroundColor: { duration: 0.5 } }}
          />
          <span className="big-swatch-label">
            <b>{names[i]}</b>
            <code>{c}</code>
          </span>
        </motion.button>
      ))}
    </div>
  );
}

const ROLE_LABEL = [
  ["base", "ベース", 70],
  ["main", "メイン", 25],
  ["accent", "アクセント", 5],
] as const;

export function RoleBar({ trio, shift, onShift }: { trio: Trio; shift: number; onShift: () => void }) {
  const roles = assignRoles(trio, shift);
  return (
    <div className="rolebar-wrap">
      <div className="rolebar glass">
        {ROLE_LABEL.map(([k, label, pct]) => (
          <motion.div key={k} className="role" style={{ flexGrow: pct }} animate={{ backgroundColor: roles[k], color: textOn(roles[k]) }} transition={{ duration: 0.55 }}>
            <span>{label}</span>
            {pct > 5 && <small>{pct}%</small>}
          </motion.div>
        ))}
      </div>
      <motion.button className="glass glass-btn icon-btn" whileTap={{ rotate: 180, scale: 0.9 }} transition={spring} onClick={onShift} aria-label="色の役割を入れ替え" data-testid="shift-roles">
        <IconSwap />
      </motion.button>
    </div>
  );
}

const MEDIA_IDS = MEDIA.map((m) => m.id);

export function MockupStage({
  trio,
  taste,
  media,
  shift,
  onMedia,
  layoutKey,
}: {
  trio: Trio;
  taste: TasteId;
  media: MediaId;
  shift: number;
  onMedia: (m: MediaId) => void;
  layoutKey?: string;
}) {
  const [dir, setDir] = useState(1);
  const go = (m: MediaId) => {
    setDir(MEDIA_IDS.indexOf(m) > MEDIA_IDS.indexOf(media) ? 1 : -1);
    onMedia(m);
  };
  return (
    <div className="stage-wrap">
      <Segmented label="媒体" value={media} options={MEDIA.map((m) => ({ id: m.id, label: m.label }))} onChange={go} />
      <motion.div className={`stage stage-${media}`} layoutId={layoutKey} transition={softSpring}>
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={`${media}-${taste}`}
            className="stage-inner"
            custom={dir}
            initial={{ opacity: 0, x: 40 * dir, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -40 * dir, scale: 0.96, filter: "blur(8px)" }}
            transition={softSpring}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(_, info) => {
              const i = MEDIA_IDS.indexOf(media);
              if (info.offset.x < -60 && i < MEDIA_IDS.length - 1) go(MEDIA_IDS[i + 1]);
              if (info.offset.x > 60 && i > 0) go(MEDIA_IDS[i - 1]);
            }}
          >
            <Mockup trio={trio} taste={taste} media={media} shift={shift} className="mock-shadow" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="dots" aria-hidden>
        {MEDIA_IDS.map((m) => (
          <motion.i key={m} animate={{ width: m === media ? 18 : 6, opacity: m === media ? 1 : 0.35 }} transition={spring} />
        ))}
      </div>
    </div>
  );
}

export function StyleStrip({
  trio,
  media,
  taste,
  shift,
  onPick,
  order,
}: {
  trio: Trio;
  media: MediaId;
  taste: TasteId;
  shift: number;
  onPick: (t: TasteId) => void;
  order?: TasteId[];
}) {
  const ids = order ? [...order, ...TASTES.map((t) => t.id).filter((id) => !order.includes(id))] : TASTES.map((t) => t.id);
  return (
    <div className="style-strip" role="listbox" aria-label="スタイル">
      {ids.map((id, i) => (
        <motion.button
          key={id}
          role="option"
          aria-selected={id === taste}
          className={`style-item ${id === taste ? "on" : ""}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...softSpring, delay: Math.min(i, 8) * 0.03 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onPick(id)}
        >
          <div className={`style-thumb glass thumb-${media}`}>
            <Mockup trio={trio} taste={id} media={media} shift={shift} />
          </div>
          <span>{TASTE_MAP[id].label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function AiImage({ trio, taste, media }: { trio: Trio; taste: TasteId; media: MediaId }) {
  const { user, setLoginSheet, showToast } = useApp();
  const [state, setState] = useState<{ status: "idle" | "loading" | "done"; url?: string }>({ status: "idle" });

  useEffect(() => setState({ status: "idle" }), [trioKey(trio)]);

  const run = async () => {
    if (!user) return setLoginSheet(true);
    setState({ status: "loading" });
    try {
      const url = await api.image(trio, taste, media);
      setState({ status: "done", url });
    } catch (e) {
      showToast(errorMessage(e));
      setState({ status: "idle" });
    }
  };

  return (
    <div className="ai-image">
      <motion.button className="glass glass-btn wide ai-btn" whileTap={{ scale: 0.97 }} onClick={run} disabled={state.status === "loading"} data-testid="ai-image">
        <IconImage />
        {state.status === "done" ? "もう一度生成" : "AIでイメージ生成"}
        <span className="badge">{TASTE_MAP[taste].label}</span>
      </motion.button>
      <AnimatePresence mode="wait">
        {state.status === "loading" && (
          <motion.div key="sk" className="ai-image-frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Sk className="sk-fill" />
            <div className="ai-image-swatch">
              <SwatchStrip trio={trio} size="md" />
            </div>
          </motion.div>
        )}
        {state.status === "done" && state.url && (
          <motion.div key={state.url} className="ai-image-frame" initial={{ opacity: 0, scale: 0.94, filter: "blur(14px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.7 }}>
            <img src={state.url} alt="AIが生成したデザインイメージ" data-testid="ai-image-result" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SimilarRow({ trio, exclude }: { trio: Trio; exclude?: string }) {
  const list = similarPalettes(trio, 7).filter((p) => p.id !== exclude).slice(0, 6);
  return (
    <div className="similar">
      {list.map((p, i) => (
        <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: i * 0.04 }}>
          <Link to={`/p/${p.id}`} className="similar-item glass">
            <SwatchStrip trio={p.colors} size="md" />
            <span>{p.title}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
