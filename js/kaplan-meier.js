// The Kaplan-Meier estimator, for the censored half of the talk.
//
// The naive empirical survival curve drops by one row's worth at every
// observation, which quietly treats a censored observation as a failure.
// Kaplan-Meier instead walks the observations in time order and only
// recalculates at a genuine event: at each one the curve is multiplied by
// (atRisk - 1) / atRisk, the conditional probability of surviving that
// event given you reached it. A censored observation never multiplies
// anything — it just leaves the risk set, so it shrinks the denominator of
// every event that comes after it.
//
// Ties are not handled (one event per step): the slide data is drawn from
// a continuous distribution, so no two observations share a time.

// rows: [{ time, censored }] in ascending time order.
// Returns one step per row: the risk set it was drawn from, the curve
// before it, and the curve after it (unchanged for a censoring).
export function kaplanMeierSteps(rows) {
  let atRisk = rows.length;
  let survival = 1;
  return rows.map((row) => {
    const before = survival;
    if (!row.censored) survival *= (atRisk - 1) / atRisk;
    const step = { time: row.time, censored: row.censored, atRisk, before, after: survival };
    atRisk -= 1;
    return step;
  });
}
