// The simulated SaaS customer base the deck opens and closes on.
//
// The opening slide uses it to show how badly the naive curve is biased;
// the closing slide reuses the very same sample to show Kaplan-Meier
// landing on the truth. Keeping the sampling here means the two slides
// cannot quietly drift apart.
import { kaplanMeierSteps } from "./kaplan-meier.js";

export const MAX_YEARS = 5;

function sampleExponential(rate) {
  return -Math.log(1 - Math.random()) / rate;
}

// Base censoring time ~ linearly decreasing density on [0, MAX_YEARS]:
// pdf(t) = (2 / MAX_YEARS) * (1 - t / MAX_YEARS). Sampled by rejection.
function sampleLinearCensoring() {
  const peak = 2 / MAX_YEARS;
  while (true) {
    const t = Math.random() * MAX_YEARS;
    const u = Math.random() * peak;
    if (u <= peak * (1 - t / MAX_YEARS)) return t;
  }
}

// Mixes in an extra cluster of censoring times under 1 year: a recent
// signup surge means a lot more users have only been observed briefly, so
// they show up censored (still subscribed, but not for long) rather than
// as a churn event.
function sampleCensoring(bumpWeight) {
  if (Math.random() < bumpWeight) return Math.random() * 1;
  return sampleLinearCensoring();
}

export function buildDataset(n, rate, bumpWeight) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const trueLifetime = sampleExponential(rate);
    const censorTime = sampleCensoring(bumpWeight);
    const observed = Math.min(trueLifetime, censorTime);
    rows.push({ trueLifetime, time: observed, event: trueLifetime <= censorTime });
  }
  return rows;
}

// Naive: pretend every observation (event or censored) is an actual churn
// at its observed time — the bias the opening slide is illustrating.
export function naiveSurvivalSteps(rows, n) {
  const times = [...rows.map((r) => r.time)].sort((a, b) => a - b);
  const steps = [[0, 1]];
  times.forEach((t, i) => steps.push([t, 1 - (i + 1) / n]));
  return steps;
}

// Ground truth: we generated the data, so we know each user's actual
// lifetime outright — no estimator needed.
//
// Lifetimes past the right-hand edge are dropped rather than clamped to
// it: clamping piled every long-lived customer onto year 5 and dived the
// curve to zero there, which would read as the truth disagreeing with
// Kaplan-Meier exactly where the closing slide compares them.
export function trueLifetimeSteps(rows, n) {
  const times = [...rows.map((r) => r.trueLifetime)].sort((a, b) => a - b);
  const steps = [[0, 1]];
  times.forEach((t, i) => {
    if (t <= MAX_YEARS) steps.push([t, 1 - (i + 1) / n]);
  });
  return steps;
}

// The estimate you could actually compute from this data: the same
// product-limit walk as the spinning tops, over hundreds of customers
// instead of ten. A still-subscribed customer leaves the risk set at their
// observed time without ever counting as a churn.
export function kaplanMeierSurvivalSteps(rows) {
  const ordered = [...rows]
    .sort((a, b) => a.time - b.time)
    .map((r) => ({ time: r.time, censored: !r.event }));
  const steps = kaplanMeierSteps(ordered);
  const final = steps.length ? steps[steps.length - 1].after : 1;
  return [[0, 1], ...steps.map((s) => [s.time, s.after]), [MAX_YEARS, final]];
}

// Lets the closing slide redraw the exact sample the opening slide left on
// screen, the same trick the spinning-top slides use between the pair.
let lastRun = null;
export function setSaasRun(run) {
  lastRun = run;
}
export function getSaasRun() {
  return lastRun;
}

// The same generator with the recent-signup bump switched off, reused for
// the employee-tenure example on the closing slide: tenures are still
// exponential and still censored by a linearly decreasing observation
// window, but a company's headcount is not surging the way the customer
// base is.
export function buildTenureDataset(n, rate) {
  return buildDataset(n, rate, 0);
}

// The median you would get by treating everyone still employed as if they
// had left today — the naive answer the closing slide contrasts against.
export function naiveMedianTime(rows) {
  const times = rows.map((r) => r.time).sort((a, b) => a - b);
  const mid = times.length >> 1;
  return times.length % 2 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
}
