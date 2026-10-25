import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { IconTrash } from "../components/icons";
import { Mockup } from "../components/mockups/Mockup";
import { GoogleButton } from "../components/Shell";
import { GridSkeleton } from "../components/Skeleton";
import { softSpring, SwatchStrip } from "../components/ui";
import { PALETTE_MAP } from "../data/palettes";
import { trioKey } from "../lib/color";
import { tasteScores } from "../lib/match";
import { useApp } from "../state";

export default function Saved() {
  const { user, favorites, favoritesLoaded, removeFavorite } = useApp();

  if (!user) {
    return (
      <div className="page">
        <motion.div className="glass panel login-card" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={softSpring}>
          <div className="login-orbs" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <h2>保存した配色</h2>
          <p className="muted small">ログインすると配色を保存できます</p>
          <GoogleButton returnTo="/saved" />
        </motion.div>
      </div>
    );
  }

  if (!favoritesLoaded) return <div className="page"><GridSkeleton count={4} /></div>;

  return (
    <div className="page">
      <h1 className="page-title">
        保存 <span className="count">{favorites.length}</span>
      </h1>
      {favorites.length === 0 && (
        <motion.p className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          まだ保存した配色はありません
        </motion.p>
      )}
      <motion.div className="grid grid-poster" layout>
        <AnimatePresence>
          {favorites.map((f, i) => {
            const p = f.palette_id ? PALETTE_MAP[f.palette_id] : null;
            const taste = p?.tastes[0] ?? tasteScores(f.colors)[0].id;
            const to = p ? `/p/${p.id}` : `/colors?c=${trioKey(f.colors)}`;
            return (
              <motion.div
                key={f.id}
                layout
                className="card-wrap"
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { ...softSpring, delay: Math.min(i, 10) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.8, filter: "blur(6px)", transition: { duration: 0.25 } }}
                data-testid="saved-card"
              >
                <Link to={to} className="glass card">
                  <div className="card-mock">
                    <Mockup trio={f.colors} taste={taste} media="poster" />
                  </div>
                  <div className="card-meta">
                    <span className="card-title">{f.label}</span>
                    <SwatchStrip trio={f.colors} />
                  </div>
                  <motion.button
                    className="glass glass-btn icon-btn card-heart"
                    whileTap={{ scale: 0.85 }}
                    aria-label={`${f.label}を削除`}
                    onClick={(e) => {
                      e.preventDefault();
                      removeFavorite(f.id);
                    }}
                  >
                    <IconTrash />
                  </motion.button>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
