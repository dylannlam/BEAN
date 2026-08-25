export function scoreColor(score: number): string {
  if (score >= 8) return "#3F8F5C";
  if (score >= 5) return "#D8A428";
  return "#C0503E";
}
