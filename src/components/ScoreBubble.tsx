import { SvgXml } from "react-native-svg";
import { buildCupSvg, BubbleTier } from "../lib/cupIcon";

export type { BubbleTier };

export function ScoreBubble({
  tier,
  score,
  selected = false,
}: {
  tier: BubbleTier;
  score: number | null;
  selected?: boolean;
}) {
  const { xml, size } = buildCupSvg(tier, score, selected);
  return <SvgXml xml={xml} width={size} height={size} />;
}

/** Same cup artwork as <ScoreBubble>, as an SVG data URI for a Google Maps Marker icon (web map). */
export function scoreBubbleSvgIcon(
  tier: BubbleTier,
  score: number | null,
  selected = false
): { url: string; size: number } {
  const { xml, size } = buildCupSvg(tier, score, selected);
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(xml)}`, size };
}
