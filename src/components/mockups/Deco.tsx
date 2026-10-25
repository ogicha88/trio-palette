import type { Deco as DecoType } from "../../data/tastes";
import { alpha, mix, type Roles } from "../../lib/color";

type Props = { type: DecoType; h: number; roles: Roles; dense?: boolean };

function star(cx: number, cy: number, r: number) {
  const k = r * 0.22;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
}

function burst(cx: number, cy: number, r: number, n = 14) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n;
    const rr = i % 2 ? r * 0.78 : r;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return pts.join(" ");
}

function leaf(x: number, y: number, len: number, rot: number) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 Q${len * 0.5} ${-len * 0.32} ${len} 0 Q${len * 0.5} ${len * 0.32} 0 0Z`} />
    </g>
  );
}

/** Decorative layer drawn in the palette's colors; one motif per taste. */
export function Deco({ type, h, roles, dense }: Props) {
  const { main, accent, base } = roles;
  const soft = mix(main, base, 0.75);
  const w = 100;
  let body: React.ReactNode = null;

  switch (type) {
    case "tape":
      body = (
        <>
          <rect x={-6} y={h * 0.08} width={34} height={7} fill={alpha(accent, 0.85)} transform={`rotate(-14 10 ${h * 0.1})`} />
          <rect x={74} y={h - 16} width={36} height={7} fill={alpha(main, 0.75)} transform={`rotate(-10 90 ${h - 12})`} />
          <path d={`M${w - 30} ${h * 0.34} q6 -8 12 0 t12 0`} stroke={accent} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <circle cx={w - 12} cy={h * 0.5} r={6} fill="none" stroke={main} strokeWidth={1.2} strokeDasharray="2 2" />
          {dense && <circle cx={14} cy={h - 22} r={9} fill={alpha(accent, 0.35)} />}
        </>
      );
      break;
    case "stars":
      body = (
        <>
          <circle cx={w - 10} cy={h * 0.18} r={16} fill={alpha(accent, 0.18)} />
          <circle cx={8} cy={h * 0.82} r={18} fill={alpha(main, 0.12)} />
          <path d={star(16, h * 0.14, 5)} fill={accent} />
          <path d={star(86, h * 0.36, 3.5)} fill={main} />
          <path d={star(80, h * 0.86, 5.5)} fill={accent} />
          <path d={star(10, h * 0.55, 2.4)} fill={main} />
          <path d={`M${w - 22} ${h * 0.66} c-3 -4 -9 -1 -6 4 l6 6 6 -6 c3 -5 -3 -8 -6 -4z`} fill={alpha(main, 0.8)} />
        </>
      );
      break;
    case "blocks":
      body = (
        <g>
          <path d={`M${w} ${h} L${w - 34} ${h} A34 34 0 0 1 ${w} ${h - 34}Z`} fill={accent} />
          <rect x={w - 50} y={h - 34} width={16} height={34} fill={main} />
          <path d={`M${w - 50} ${h - 34} A16 16 0 0 1 ${w - 34} ${h - 50} L${w - 34} ${h - 34}Z`} fill={main} />
          <circle cx={w - 17} cy={h - 50} r={8} fill={main} />
          <rect x={w - 66} y={h - 16} width={16} height={16} fill={alpha(accent, 0.5)} />
        </g>
      );
      break;
    case "burst":
      body = (
        <>
          <polygon points={burst(w - 16, h * 0.62, 20)} fill={accent} />
          <circle cx={w - 16} cy={h * 0.62} r={11} fill={base} />
          <circle cx={w - 16} cy={h * 0.62} r={7} fill={main} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-4 + i * 6} y1={h + 4} x2={24 + i * 6} y2={h - 24} stroke={alpha(main, 0.5)} strokeWidth={2.2} />
          ))}
          <circle cx={12} cy={10} r={4} fill={main} />
        </>
      );
      break;
    case "frame":
      body = (
        <>
          <rect x={4} y={4} width={w - 8} height={h - 8} fill="none" stroke={main} strokeWidth={0.6} />
          <rect x={6} y={6} width={w - 12} height={h - 12} fill="none" stroke={accent} strokeWidth={0.3} />
          {[
            [6, 6],
            [w - 6, 6],
            [6, h - 6],
            [w - 6, h - 6],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.6} fill={accent} />
          ))}
          <path d={`M${w / 2 - 10} ${h - 12} Q${w / 2} ${h - 17} ${w / 2 + 10} ${h - 12}`} stroke={accent} strokeWidth={0.5} fill="none" />
        </>
      );
      break;
    case "leaves":
      body = (
        <>
          <ellipse cx={w - 4} cy={h - 6} rx={30} ry={24} fill={alpha(main, 0.16)} />
          <g fill={main}>
            {leaf(w - 30, h - 10, 18, -50)}
            {leaf(w - 24, h - 6, 16, -80)}
            {leaf(w - 20, h - 12, 14, -20)}
          </g>
          <g fill={accent}>
            {leaf(4, 14, 12, 20)}
            {leaf(6, 20, 10, 50)}
          </g>
          <circle cx={w - 40} cy={h - 26} r={2.2} fill={accent} />
        </>
      );
      break;
    case "sun":
      body = (
        <g>
          {[30, 24, 18, 12].map((r, i) => (
            <path
              key={r}
              d={`M${w / 2 - r} ${h} A${r} ${r} 0 0 1 ${w / 2 + r} ${h}Z`}
              fill={[main, accent, soft, mix(accent, base, 0.4)][i]}
            />
          ))}
          <circle cx={w / 2} cy={h} r={6} fill={base} />
        </g>
      );
      break;
    case "lines":
      body = (
        <>
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={w - 40 + i * 5} y1={0} x2={w - 70 + i * 5} y2={h} stroke={alpha(main, 0.12)} strokeWidth={0.5} />
          ))}
          <polygon points={`${w - 20},0 ${w - 8},0 ${w - 38},${h} ${w - 50},${h}`} fill={accent} />
        </>
      );
      break;
    case "none":
      body = (
        <>
          <line x1={8} y1={h - 10} x2={34} y2={h - 10} stroke={main} strokeWidth={0.5} />
          <rect x={w - 16} y={10} width={6} height={6} fill={accent} />
        </>
      );
      break;
    case "wave": {
      const arcs: React.ReactNode[] = [];
      for (let row = 0; row < 3; row++)
        for (let col = -1; col < 9; col++) {
          const cx = col * 12 + (row % 2) * 6;
          const cy = h - 2 - row * 5;
          [6, 4, 2].forEach((r, k) =>
            arcs.push(
              <path key={`${row}-${col}-${k}`} d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill={k === 0 ? base : "none"} stroke={alpha(main, 0.5)} strokeWidth={0.45} />,
            ),
          );
        }
      body = (
        <>
          <circle cx={w - 22} cy={h * 0.24} r={11} fill={accent} />
          {arcs}
        </>
      );
      break;
    }
    case "halftone":
      body = (
        <>
          {Array.from({ length: 10 }).flatMap((_, r) =>
            Array.from({ length: 10 }).map((__, c) => (
              <circle key={`${r}-${c}`} cx={w - 2 - c * 4} cy={h - 2 - r * 4} r={Math.max(0.1, 1.6 - (r + c) * 0.09)} fill={main} />
            )),
          )}
          <rect x={-10} y={h * 0.14} width={50} height={6} fill={accent} transform={`rotate(-8 10 ${h * 0.16})`} />
        </>
      );
      break;
    case "grid":
      body = (
        <>
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={h} stroke={alpha(main, 0.08)} strokeWidth={0.3} />
          ))}
          {Array.from({ length: Math.ceil(h / 10) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 10} x2={w} y2={i * 10} stroke={alpha(main, 0.08)} strokeWidth={0.3} />
          ))}
          <rect x={w - 34} y={h * 0.5} width={28} height={18} rx={1.5} fill={base} stroke={main} strokeWidth={0.6} />
          <rect x={w - 34} y={h * 0.5} width={28} height={3} fill={main} />
          <rect x={w - 30} y={h * 0.5 + 6} width={12} height={2} fill={accent} />
          <rect x={w - 30} y={h * 0.5 + 10} width={18} height={1.2} fill={alpha(main, 0.4)} />
          {[
            [w - 10, 8],
            [w - 14, 12],
            [w - 6, 14],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width={3.5} height={3.5} fill={i === 1 ? main : accent} />
          ))}
        </>
      );
      break;
    case "arch":
      body = (
        <>
          <path d={`M${w / 2 - 26} ${h} L${w / 2 - 26} ${h * 0.42} A26 26 0 0 1 ${w / 2 + 26} ${h * 0.42} L${w / 2 + 26} ${h}Z`} fill={alpha(main, 0.1)} />
          <path d={`M${w / 2 - 22} ${h} L${w / 2 - 22} ${h * 0.44} A22 22 0 0 1 ${w / 2 + 22} ${h * 0.44} L${w / 2 + 22} ${h}`} fill="none" stroke={accent} strokeWidth={0.5} />
          <path d={star(w / 2, h * 0.3, 2.6)} fill={accent} />
        </>
      );
      break;
    case "bubbles":
      body = (
        <>
          <path d={`M0 ${h - 14} Q25 ${h - 22} 50 ${h - 14} T100 ${h - 14} L100 ${h} L0 ${h}Z`} fill={alpha(main, 0.22)} />
          {[
            [w - 18, h * 0.3, 10, accent],
            [w - 34, h * 0.48, 5, main],
            [w - 10, h * 0.6, 4, main],
            [12, h * 0.72, 6, accent],
          ].map(([x, y, r, c], i) => (
            <g key={i}>
              <circle cx={x as number} cy={y as number} r={r as number} fill={c as string} />
              <circle cx={(x as number) - (r as number) * 0.35} cy={(y as number) - (r as number) * 0.35} r={(r as number) * 0.25} fill="rgba(255,255,255,.6)" />
            </g>
          ))}
        </>
      );
      break;
  }

  return (
    <svg className="mock-deco" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {body}
    </svg>
  );
}
