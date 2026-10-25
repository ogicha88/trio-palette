import { motion } from "motion/react";

export function Sk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`sk ${className}`} style={style} aria-hidden />;
}

export function CardSkeleton() {
  return (
    <div className="glass card sk-card" aria-hidden>
      <Sk className="sk-mock" />
      <div className="card-meta">
        <Sk style={{ width: "58%", height: 12 }} />
        <Sk style={{ width: 54, height: 10 }} />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Full-screen skeleton shown while the app boots and while lazy routes load. */
export function PageSkeleton({ withChrome = false }: { withChrome?: boolean }) {
  return (
    <motion.div
      className={`page-skeleton ${withChrome ? "with-chrome" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      role="status"
      aria-label="読み込み中"
      data-testid="page-skeleton"
    >
      {withChrome && (
        <div className="topbar glass sk-topbar">
          <Sk style={{ width: 72, height: 18 }} />
          <Sk style={{ width: 34, height: 34, borderRadius: 99 }} />
        </div>
      )}
      <div className="page">
        <Sk className="sk-search" />
        <Sk className="sk-seg" />
        <div className="chips">
          {Array.from({ length: 6 }).map((_, i) => (
            <Sk key={i} className="sk-chip" />
          ))}
        </div>
        <GridSkeleton count={6} />
      </div>
      {withChrome && (
        <div className="tabbar glass sk-tabbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <Sk key={i} style={{ width: 44, height: 34, borderRadius: 14 }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
