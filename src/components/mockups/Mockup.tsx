import { memo, type CSSProperties } from "react";
import { TASTE_MAP, type MediaId, type TasteId } from "../../data/tastes";
import { assignRoles, contrast, mix, type Trio } from "../../lib/color";
import { Deco } from "./Deco";

const RATIO: Record<MediaId, number> = { poster: 4 / 3, banner: 1 / 1.91, web: 1.6, sns: 1 };

type Props = {
  trio: Trio;
  taste: TasteId;
  media: MediaId;
  shift?: number;
  className?: string;
};

/** Renders a sample design (poster / banner / web / SNS) in the given palette and taste. */
export const Mockup = memo(function Mockup({ trio, taste, media, shift = 0, className = "" }: Props) {
  const t = TASTE_MAP[taste];
  const r = assignRoles(trio, shift);
  const title = contrast(r.main, r.base) >= 2.2 ? r.main : r.ink;
  const h = 100 * RATIO[media];
  const s = t.sample;

  const style = {
    "--base": r.base,
    "--main": r.main,
    "--accent": r.accent,
    "--ink": r.ink,
    "--on-main": r.onMain,
    "--on-accent": r.onAccent,
    "--title": title,
    "--soft": mix(r.main, r.base, 0.85),
    "--display": t.display,
    "--jp": t.jp,
    "--tw": t.weight,
    "--fs": t.italic ? "italic" : "normal",
    "--tt": t.upper ? "uppercase" : "none",
    "--ls": `${t.tracking}em`,
    "--rad": `${Math.min(t.radius, 40) / 10}cqw`,
    aspectRatio: `1 / ${RATIO[media]}`,
  } as CSSProperties;

  const cls = `mock mock-${media} lay-${t.layout} taste-${taste} ${className}`;

  if (media === "web") {
    return (
      <div className={cls} style={style} role="img" aria-label={`${t.label}のWebサイト例`}>
        <div className="w-bar">
          <span className="w-logo">{s.title}</span>
          <span className="w-nav">
            {s.nav.map((n) => (
              <i key={n}>{n}</i>
            ))}
          </span>
        </div>
        <div className="w-hero">
          <Deco type={t.deco} h={70} roles={r} />
          <div className="m-kicker">{s.kicker}</div>
          <div className="m-title">{s.title}</div>
          <div className="m-jp">{s.jp}</div>
          <span className="m-cta">{s.cta}</span>
        </div>
        <div className="w-cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-card c${i}`}>
              <b />
              <i />
              <i />
            </div>
          ))}
        </div>
        <div className="w-band">
          <span>{s.date}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cls} style={style} role="img" aria-label={`${t.label}の${media === "poster" ? "ポスター" : media === "banner" ? "バナー" : "SNS投稿"}例`}>
      {t.layout === "split" && <div className="m-split" />}
      <Deco type={t.deco} h={h} roles={r} dense={media === "poster"} />
      <div className="m-body">
        <div className="m-kicker">{s.kicker}</div>
        <div className="m-title">{s.title}</div>
        <div className="m-jp">{s.jp}</div>
        <div className="m-date">{s.date}</div>
        {media !== "poster" && <span className="m-cta">{s.cta}</span>}
        {media === "poster" && (
          <div className="m-lines">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
    </div>
  );
});
