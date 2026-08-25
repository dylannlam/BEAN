import { scoreColor } from "./score";

export type BubbleTier = "mine" | "friends" | "other";

const RING_COLOR = "#E85D3D";
const INK = "#3D2B1F";
const SLEEVE_BROWN = "#8B5A2B";

const SIZE_BY_TIER: Record<BubbleTier, number> = {
  mine: 44,
  friends: 40,
  other: 28,
};

// Cup body tapers from the rim to the base — precomputed so the sleeve band
// and its ridge lines can follow the same taper instead of overshooting the
// cup's silhouette.
const RIM_Y = 20;
const BASE_Y = 60;
const RIM_LEFT_X = 10;
const RIM_RIGHT_X = 46;
const BASE_LEFT_X = 18;
const BASE_RIGHT_X = 38;

function leftEdgeX(y: number): number {
  const t = (y - RIM_Y) / (BASE_Y - RIM_Y);
  return RIM_LEFT_X + t * (BASE_LEFT_X - RIM_LEFT_X);
}

function rightEdgeX(y: number): number {
  const t = (y - RIM_Y) / (BASE_Y - RIM_Y);
  return RIM_RIGHT_X + t * (BASE_RIGHT_X - RIM_RIGHT_X);
}

/** Builds the to-go-cup marker as raw SVG markup — one source of truth
 * shared by the native <ScoreBubble> (via react-native-svg's SvgXml) and the
 * web Google Maps marker (as a data: URI). Artwork is drawn on a fixed
 * 56x68 canvas; `size` scales it uniformly via width/height against that
 * viewBox. */
export function buildCupSvg(
  tier: BubbleTier,
  score: number | null,
  selected = false
): { xml: string; size: number } {
  const baseSize = SIZE_BY_TIER[tier];
  const size = selected ? Math.round(baseSize * 1.2) : baseSize;

  const outline = selected ? RING_COLOR : INK;
  const outlineWidth = selected ? 3 : 2.5;
  const dashed = tier === "friends" ? ` stroke-dasharray="4,3"` : "";
  const lidColor = tier === "other" ? "#FFFFFF" : score !== null ? scoreColor(score) : INK;
  const lidStroke = tier === "other" ? `${INK}40` : outline;
  const textColor = tier === "other" ? "transparent" : "#FFFFFF";
  const label = tier !== "other" && score !== null ? score.toFixed(1) : "";

  const steam = [22, 34]
    .map(
      (x) =>
        `<path d="M${x},20 C${x - 3},16 ${x + 3},12 ${x},8 C${x - 3},4 ${x + 3},2 ${x},0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    )
    .join("");

  const sleeveTop = 34;
  const sleeveBottom = 48;
  const sleevePath = `M${leftEdgeX(sleeveTop)},${sleeveTop} L${leftEdgeX(sleeveBottom)},${sleeveBottom} L${rightEdgeX(sleeveBottom)},${sleeveBottom} L${rightEdgeX(sleeveTop)},${sleeveTop} Z`;

  const ridges = [0.28, 0.44, 0.6, 0.76]
    .map((frac) => {
      const xTop = leftEdgeX(sleeveTop) + frac * (rightEdgeX(sleeveTop) - leftEdgeX(sleeveTop));
      const xBottom = leftEdgeX(sleeveBottom) + frac * (rightEdgeX(sleeveBottom) - leftEdgeX(sleeveBottom));
      return `<line x1="${xTop}" y1="${sleeveTop}" x2="${xBottom}" y2="${sleeveBottom}" stroke="${INK}80" stroke-width="1"/>`;
    })
    .join("");

  const cupPath = `M${RIM_LEFT_X},${RIM_Y} L${BASE_LEFT_X},${BASE_Y - 2} Q${BASE_LEFT_X + 1},${BASE_Y} ${BASE_LEFT_X + 3},${BASE_Y} L${BASE_RIGHT_X - 3},${BASE_Y} Q${BASE_RIGHT_X - 1},${BASE_Y} ${BASE_RIGHT_X},${BASE_Y - 2} L${RIM_RIGHT_X},${RIM_Y} Z`;

  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 68" width="${size}" height="${size}">
    ${steam}
    <path d="${cupPath}" fill="#FFFFFF" stroke="${outline}" stroke-width="${outlineWidth}"${dashed}/>
    <path d="${sleevePath}" fill="${SLEEVE_BROWN}" stroke="${outline}" stroke-width="${outlineWidth * 0.7}"${dashed}/>
    ${ridges}
    <line x1="${RIM_LEFT_X + 2}" y1="${RIM_Y + 4}" x2="${RIM_RIGHT_X - 2}" y2="${RIM_Y + 4}" stroke="${outline}" stroke-width="1.5"/>
    <ellipse cx="28" cy="${RIM_Y - 2}" rx="18" ry="6" fill="${lidColor}" stroke="${lidStroke}" stroke-width="2"/>
    ${label ? `<text x="28" y="${(sleeveTop + sleeveBottom) / 2 + 4}" font-size="11" font-weight="700" text-anchor="middle" font-family="sans-serif" fill="${textColor}">${label}</text>` : ""}
  </svg>`;

  return { xml, size };
}
