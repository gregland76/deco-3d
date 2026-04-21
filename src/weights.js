export function rebalanceWeights(weights, changedKey, nextValue) {
  const keys = Object.keys(weights);
  const w = { ...weights };

  const v = Math.max(0, Math.min(100, Number(nextValue)));
  w[changedKey] = v;

  const otherKeys = keys.filter((k) => k !== changedKey);
  const remaining = 100 - v;

  const otherSum = otherKeys.reduce((s, k) => s + (Number(w[k]) || 0), 0);

  if (otherSum <= 0.00001) {
    const each = remaining / otherKeys.length;
    for (const k of otherKeys) w[k] = each;
  } else {
    for (const k of otherKeys) w[k] = (w[k] / otherSum) * remaining;
  }

  for (const k of keys) w[k] = Math.round(w[k] * 10) / 10;

  const sum = keys.reduce((s, k) => s + w[k], 0);
  const delta = Math.round((100 - sum) * 10) / 10;
  w[changedKey] = Math.round((w[changedKey] + delta) * 10) / 10;

  return w;
}