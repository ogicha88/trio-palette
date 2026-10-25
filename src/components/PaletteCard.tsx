import { motion } from "motion/react";
import { Link } from "react-router-dom";
import type { MediaId, TasteId } from "../data/tastes";
import type { Trio } from "../lib/color";
import { Mockup } from "./mockups/Mockup";
import { HeartButton, rise, SwatchStrip } from "./ui";

type Props = {
  to: string;
  title: string;
  trio: Trio;
  taste: TasteId;
  media: MediaId;
  paletteId?: string;
  layoutKey?: string;
};

export function PaletteCard({ to, title, trio, taste, media, paletteId, layoutKey }: Props) {
  return (
    <motion.div variants={rise} layout="position" className="card-wrap">
      <Link to={to} className="glass card" data-testid="palette-card">
        <motion.div className="card-mock" layoutId={layoutKey} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
          <Mockup trio={trio} taste={taste} media={media} />
        </motion.div>
        <div className="card-meta">
          <span className="card-title">{title}</span>
          <SwatchStrip trio={trio} />
        </div>
        <HeartButton trio={trio} label={title} paletteId={paletteId} className="card-heart" />
      </Link>
    </motion.div>
  );
}
