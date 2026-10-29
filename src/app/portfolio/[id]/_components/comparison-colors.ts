// Distinct muted blues, violets, teals and warm neutrals; no red/green signals.
export const comparisonColors = [
  "#91b8d0",
  "#c1a3d3",
  "#d3b681",
  "#8dbec1",
  "#a5aad6",
  "#d0a9bd",
  "#92a9bd",
  "#baad8b",
  "#a4c4c8",
  "#b39fc1",
  "#d4c49c",
  "#87a9c8",
  "#c3b1da",
  "#b99b88",
  "#9ab5ce",
  "#b8c6d1",
  "#b59eb2",
  "#acb3c9",
  "#cabda9",
  "#9cbac0",
];
// Portfolio IDs provide a repeatable shuffled order without duplicate colors among 20 lines.
export function comparisonRank(id: string) {
  let hash = 2166136261;
  for (const character of id)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
