import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { IconDice, IconSpark } from "../components/icons";
import { AiImage, MockupStage, RoleBar, SimilarRow, StyleStrip } from "../components/PaletteView";
import { Sk } from "../components/Skeleton";
import { HeartButton, Section, softSpring, spring, textOn } from "../components/ui";
import { PALETTES } from "../data/palettes";
import { TASTE_MAP, type MediaId, type TasteId } from "../data/tastes";
import { api, errorMessage, type Analysis } from "../lib/api";
import { normalizeHex, parseTrioKey, randomTrio, trioKey, type Trio } from "../lib/color";
import { nameFor, tasteScores } from "../lib/match";
import { useApp } from "../state";

const DEFAULT = PALETTES[0].colors;

function ColorSlot({ value, index, onChange }: { value: string; index: number; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const label = ["カラー1", "カラー2", "カラー3"][index];
  return (
    <motion.div className="slot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: index * 0.06 }}>
      <motion.label className="slot-swatch glass" whileTap={{ scale: 0.95 }} animate={{ backgroundColor: value }} transition={{ duration: 0.45 }} style={{ color: textOn(value) }}>
        <input type="color" value={value.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={`${label}を選択`} data-testid={`color-picker-${index}`} />
        <span className="slot-name">{nameFor(value)}</span>
      </motion.label>
      <input
        className="slot-hex glass"
        value={draft}
        aria-label={`${label}のHEX`}
        data-testid={`hex-${index}`}
        spellCheck={false}
        maxLength={7}
        onChange={(e) => {
          setDraft(e.target.value);
          const hex = normalizeHex(e.target.value);
          if (hex && e.target.value.replace("#", "").length === 6) onChange(hex);
        }}
        onBlur={() => setDraft(value)}
      />
    </motion.div>
  );
}

export default function Colors() {
  const [params, setParams] = useSearchParams();
  const trio = useMemo(() => parseTrioKey(params.get("c")) ?? DEFAULT, [params]);
  const media = (params.get("media") as MediaId) || "poster";
  const { setAmbient, user, setLoginSheet, showToast } = useApp();
  const [shift, setShift] = useState(0);
  const [spin, setSpin] = useState(0);
  const scores = useMemo(() => tasteScores(trio), [trio]);
  const top = scores.slice(0, 4);
  const [picked, setPicked] = useState<TasteId | null>(null);
  const taste = picked ?? top[0].id;
  const [analysis, setAnalysis] = useState<{ status: "idle" | "loading" | "done"; data?: Analysis; key?: string }>({ status: "idle" });

  useEffect(() => setAmbient(trio), [trio, setAmbient]);

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    setParams(next, { replace: true });
  };
  const setTrio = (t: Trio) => {
    setPicked(null);
    set({ c: trioKey(t) });
  };

  const analyze = async () => {
    if (!user) return setLoginSheet(true);
    const key = trioKey(trio);
    setAnalysis({ status: "loading", key });
    try {
      const data = await api.analyze(trio);
      setAnalysis({ status: "done", data, key });
    } catch (e) {
      showToast(errorMessage(e));
      setAnalysis({ status: "idle" });
    }
  };
  const stale = analysis.key && analysis.key !== trioKey(trio);

  return (
    <div className="page">
      <div className="slots">
        {trio.map((c, i) => (
          <ColorSlot
            key={i}
            index={i}
            value={c}
            onChange={(hex) => {
              const next = [...trio] as Trio;
              next[i] = hex;
              setTrio(next);
            }}
          />
        ))}
      </div>

      <div className="tool-row">
        <motion.button
          className="glass glass-btn"
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setSpin((s) => s + 1);
            setTrio(randomTrio());
          }}
          data-testid="random"
        >
          <motion.span animate={{ rotate: spin * 360 }} transition={spring} style={{ display: "inline-flex" }}>
            <IconDice />
          </motion.span>
          ランダム
        </motion.button>
        <HeartButton trio={trio} label={`${nameFor(trio[0])}×${nameFor(trio[1])}`} />
      </div>

      <RoleBar trio={trio} shift={shift} onShift={() => setShift((s) => s + 1)} />

      <Section title="相性のいいスタイル">
        <div className="fit-list">
          {top.map((s, i) => (
            <motion.button
              key={s.id}
              className={`fit glass ${s.id === taste ? "on" : ""}`}
              onClick={() => setPicked(s.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...softSpring, delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
            >
              <span>{TASTE_MAP[s.id].label}</span>
              <span className="fit-bar">
                <motion.i initial={{ width: 0 }} animate={{ width: `${Math.round(s.score * 100)}%` }} transition={{ ...softSpring, delay: 0.1 + i * 0.05 }} />
              </span>
            </motion.button>
          ))}
        </div>
      </Section>

      <MockupStage trio={trio} taste={taste} media={media} shift={shift} onMedia={(m) => set({ media: m === "poster" ? null : m })} />

      <Section title="スタイルで見比べる">
        <StyleStrip trio={trio} media={media} taste={taste} shift={shift} onPick={setPicked} order={scores.map((s) => s.id)} />
      </Section>

      <Section title="AI分析">
        <div className="glass panel ai-panel">
          <motion.button className="glass-btn primary wide" whileTap={{ scale: 0.97 }} onClick={analyze} disabled={analysis.status === "loading"} data-testid="ai-analyze">
            <IconSpark />
            {analysis.status === "done" && !stale ? "もう一度分析" : "この配色を分析"}
          </motion.button>
          <AnimatePresence mode="wait">
            {analysis.status === "loading" && (
              <motion.div key="sk" className="ai-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="ai-skeleton">
                <Sk style={{ width: "90%", height: 16 }} />
                <div className="chips static">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Sk key={i} className="sk-chip" />
                  ))}
                </div>
                <Sk style={{ width: "70%", height: 12 }} />
                <Sk style={{ width: "80%", height: 12 }} />
                <Sk style={{ width: "60%", height: 12 }} />
              </motion.div>
            )}
            {analysis.status === "done" && analysis.data && (
              <motion.div
                key={analysis.key}
                className={`ai-result ${stale ? "stale" : ""}`}
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                data-testid="ai-analysis"
              >
                <motion.p variants={item} className="ai-summary">
                  {analysis.data.summary}
                </motion.p>
                <motion.div variants={item} className="chips static">
                  {analysis.data.impression.map((w) => (
                    <span key={w} className="chip glass">
                      {w}
                    </span>
                  ))}
                </motion.div>
                {analysis.data.tastes.length > 0 && (
                  <motion.div variants={item} className="ai-row">
                    <h4>スタイル</h4>
                    <div className="chips static">
                      {analysis.data.tastes.map((t) => (
                        <button key={t} className="chip glass on" onClick={() => setPicked(t)}>
                          {TASTE_MAP[t].label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <motion.div variants={item} className="ai-row">
                  <h4>用途</h4>
                  <ul>
                    {analysis.data.uses.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </motion.div>
                <motion.div variants={item} className="ai-row">
                  <h4>コツ</h4>
                  <ul>
                    {analysis.data.tips.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      <div className="actions">
        <AiImage trio={trio} taste={taste} media={media} />
      </div>

      <Section title="近い配色">
        <SimilarRow trio={trio} />
      </Section>
    </div>
  );
}

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: softSpring } };
