// Shares a spinning-top population's data between adjacent slides, keyed
// by name, so a later slide can reuse the exact same numbers instead of
// resampling. The producing slide calls set(key, ...) once its data is
// generated; a consuming slide calls get(key) and falls back to sampling
// its own if the producer hasn't run yet (e.g. the viewer jumped straight
// to it via the URL hash).
const runs = new Map();

export function setSpinningTopRun(key, data) {
  runs.set(key, data);
}

export function getSpinningTopRun(key) {
  return runs.get(key) ?? null;
}
