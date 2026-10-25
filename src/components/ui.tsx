import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useApp } from "../state";
import { contrast, type Trio } from "../lib/color";
import { IconHeart } from "./icons";

export const spring = { type: "spring", stiffness: 420, damping: 32, mass: 0.8 } as const;
export const softSpring = { type: "spring", stiffness: 220, damping: 26 } as const;

export function GlassButton({ className = "", children, ...rest }: HTMLMotionProps<"button"> & { children: ReactNode }) {
  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ y: -1 }} transition={spring} className={`glass glass-btn ${className}`} {...rest}>
      {children}
    </motion.button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="glass segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={o.id === value} className="seg-item" onClick={() => onChange(o.id)}>
          {o.id === value && <motion.span layoutId={`seg-${id}`} className="seg-thumb" transition={spring} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  options,
  selected,
  onToggle,
  label,
}: {
  options: { id: T; label: string; dot?: boolean }[];
  selected: T[];
  onToggle: (id: T) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(".chip.on");
    const box = ref.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [selected.join()]);
  return (
    <div className="chips" role="group" aria-label={label} ref={ref}>
      {options.map((o, i) => {
        const on = selected.includes(o.id);
        return (
          <motion.button
            key={o.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.025, ...softSpring } }}
            whileTap={{ scale: 0.92 }}
            className={`chip glass ${on ? "on" : ""}`}
            aria-pressed={on}
            onClick={() => onToggle(o.id)}
          >
            {o.dot && <i className="chip-dot" />}
            {o.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export function SwatchStrip({ trio, size = "sm" }: { trio: Trio; size?: "sm" | "md" }) {
  return (
    <div className={`strip strip-${size}`}>
      {trio.map((c, i) => (
        <motion.span key={i} className="strip-c" animate={{ backgroundColor: c }} transition={{ duration: 0.5 }} />
      ))}
    </div>
  );
}

export function HeartButton({ trio, label, paletteId, className = "" }: { trio: Trio; label: string; paletteId?: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useApp();
  const on = isFavorite(trio);
  return (
    <motion.button
      className={`glass glass-btn icon-btn heart ${on ? "on" : ""} ${className}`}
      whileTap={{ scale: 0.8 }}
      transition={spring}
      aria-label={on ? "保存を解除" : "保存"}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(trio, label, paletteId);
      }}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.3 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 12 }}>
        <IconHeart filled={on} />
      </motion.span>
      <AnimatePresence>
        {on && (
          <motion.span className="heart-burst" initial={{ scale: 0.4, opacity: 0.9 }} animate={{ scale: 2.2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function textOn(hex: string) {
  return contrast(hex, "#141414") >= contrast(hex, "#FFFFFF") ? "#141414" : "#FFFFFF";
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

export const rise = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: softSpring },
};
