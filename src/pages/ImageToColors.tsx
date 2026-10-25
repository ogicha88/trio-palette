import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IconSpark } from "../components/icons";
import { Mockup } from "../components/mockups/Mockup";
import { PaletteCard } from "../components/PaletteCard";
import { GoogleButton } from "../components/Shell";
import { Sk } from "../components/Skeleton";
import { Chips, HeartButton, Section, Segmented, softSpring, stagger, SwatchStrip } from "../components/ui";
import { MEDIA, TASTES, TASTE_MAP, type MediaId, type TasteId } from "../data/tastes";
import { api, errorMessage, type Suggestion } from "../lib/api";
import { trioKey } from "../lib/color";
import { searchPalettes } from "../lib/match";
import { useApp } from "../state";

const EXAMPLES = ["夏祭りのポスター", "大人っぽいカフェのメニュー", "子ども向け英会話教室のバナー", "春のコスメ新作SNS", "テック系セミナーのLP"];

const STORE_KEY = "trio:image-query";

function loadDraft(): { prompt: string; tastes: TasteId[]; media: MediaId } {
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "");
    if (v && typeof v.prompt === "string") return v;
  } catch {
    // ignore
  }
  return { prompt: "", tastes: [], media: "poster" };
}

export default function ImageToColors() {
  const { user, showToast, setAmbient } = useApp();
  const [draft] = useState(loadDraft);
  const [prompt, setPrompt] = useState(draft.prompt);
  const [tastes, setTastes] = useState<TasteId[]>(draft.tastes);
  const [media, setMedia] = useState<MediaId>(draft.media);
  const [submitted, setSubmitted] = useState<{ prompt: string; tastes: TasteId[] } | null>(draft.prompt || draft.tastes.length ? { prompt: draft.prompt, tastes: draft.tastes } : null);
  const [ai, setAi] = useState<{ status: "idle" | "loading" | "done"; items: Suggestion[] }>({ status: "idle", items: [] });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ prompt, tastes, media }));
    } catch {
      // ignore
    }
  }, [prompt, tastes, media]);

  const library = useMemo(() => (submitted ? searchPalettes(submitted.prompt, submitted.tastes, 8) : []), [submitted]);

  const submit = async () => {
    const q = { prompt: prompt.trim(), tastes };
    if (!q.prompt && q.tastes.length === 0) return showToast("イメージかスタイルを入力してください");
    setSubmitted(q);
    (document.activeElement as HTMLElement | null)?.blur();
    if (!user) return;
    setAi({ status: "loading", items: [] });
    try {
      const { palettes } = await api.suggest(q.prompt, q.tastes, media);
      setAi({ status: "done", items: palettes });
      if (palettes[0]) setAmbient(palettes[0].colors);
    } catch (e) {
      showToast(errorMessage(e));
      setAi({ status: "idle", items: [] });
    }
  };

  return (
    <div className="page">
      <motion.div className="glass panel prompt-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={softSpring}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="作りたいデザインのイメージ"
          aria-label="作りたいデザインのイメージ"
          rows={3}
          maxLength={200}
          data-testid="image-prompt"
        />
        <div className="examples">
          {EXAMPLES.map((ex) => (
            <motion.button key={ex} className="example" whileTap={{ scale: 0.94 }} onClick={() => setPrompt(ex)}>
              {ex}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <Chips
        label="スタイル"
        options={TASTES.map((t) => ({ id: t.id, label: t.label }))}
        selected={tastes}
        onToggle={(id) => setTastes((ts) => (ts.includes(id) ? ts.filter((t) => t !== id) : [...ts, id].slice(-3)))}
      />
      <Segmented label="媒体" value={media} options={MEDIA.map((m) => ({ id: m.id, label: m.label }))} onChange={setMedia} />

      <motion.button className="glass-btn primary wide big" whileTap={{ scale: 0.97 }} onClick={submit} disabled={ai.status === "loading"} data-testid="suggest">
        <IconSpark />
        配色を提案
      </motion.button>

      <AnimatePresence mode="wait">
        {submitted && !user && (
          <motion.div key="login" className="glass panel login-inline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="small">ログインするとAIがオリジナル配色を提案します</p>
            <GoogleButton returnTo="/image" />
          </motion.div>
        )}
        {ai.status === "loading" && (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="suggest-skeleton">
            <Section title="AIの提案">
              <div className="suggest-list">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="glass suggest">
                    <Sk className={`sk-mock thumb-${media}`} />
                    <div className="suggest-body">
                      <Sk style={{ width: "50%", height: 16 }} />
                      <Sk style={{ width: "100%", height: 26, borderRadius: 10 }} />
                      <Sk style={{ width: "90%", height: 12 }} />
                      <Sk style={{ width: "70%", height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}
        {ai.status === "done" && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Section title="AIの提案">
              <motion.div className="suggest-list" variants={stagger} initial="hidden" animate="show" data-testid="suggest-results">
                {ai.items.map((s, i) => {
                  const taste = s.tastes[0] ?? tastes[0] ?? "modern";
                  return (
                    <motion.div key={i} className="glass suggest" variants={{ hidden: { opacity: 0, y: 24, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: softSpring } }}>
                      <Link to={`/colors?c=${trioKey(s.colors)}${media === "poster" ? "" : `&media=${media}`}`} className={`suggest-mock thumb-${media}`}>
                        <Mockup trio={s.colors} taste={taste} media={media} />
                      </Link>
                      <div className="suggest-body">
                        <div className="suggest-head">
                          <h3>{s.title}</h3>
                          <HeartButton trio={s.colors} label={s.title} />
                        </div>
                        <SwatchStrip trio={s.colors} size="md" />
                        <div className="suggest-names">
                          {s.colors.map((c, j) => (
                            <span key={c + j}>
                              <i style={{ background: c }} />
                              {s.names[j]}
                              <code>{c}</code>
                            </span>
                          ))}
                        </div>
                        <p className="small">{s.reason}</p>
                        <div className="chips static">
                          {s.tastes.map((t) => (
                            <span key={t} className="chip glass">
                              {TASTE_MAP[t].label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {submitted && (
        <Section title="ライブラリから">
          {library.length ? (
            <motion.div key={JSON.stringify(submitted)} className={`grid grid-${media}`} variants={stagger} initial="hidden" animate="show" data-testid="library-results">
              {library.map((p) => {
                const t = submitted.tastes.find((x) => p.tastes.includes(x)) ?? p.tastes[0];
                return <PaletteCard key={p.id} to={`/p/${p.id}?taste=${t}&media=${media}`} title={p.title} trio={p.colors} taste={t} media={media} paletteId={p.id} />;
              })}
            </motion.div>
          ) : (
            <p className="empty">近い配色が見つかりませんでした</p>
          )}
        </Section>
      )}
    </div>
  );
}
