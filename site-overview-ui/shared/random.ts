/** A small seeded generator so seeded data and the live feed are the same on every run. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Picks an item with probability proportional to its weight. */
export function pickWeighted<T>(
  random: () => number,
  items: readonly T[],
  weights: readonly number[]
) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let target = random() * total;
  for (let index = 0; index < items.length; index++) {
    target -= weights[index]!;
    if (target < 0) return items[index]!;
  }
  return items[items.length - 1]!;
}
