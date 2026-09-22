// The storyboard: the single source of truth for slide order.
// Rearranging the talk = reordering this array. Adding a slide = adding
// one import + one line here. Each entry's module lives in ../slides/.

import title from "../slides/00-title.js";
import meepleChurnProblem from "../slides/01-meeple-churn-problem.js";
import naiveSurvivalGraph from "../slides/02-naive-survival-graph.js";
import spinningTopSingle from "../slides/03-spinning-top-single.js";
import spinningTopPopulationStanding from "../slides/04-spinning-top-population-standing.js";
import spinningTopPopulationGraph from "../slides/05-spinning-top-population-graph.js";
import sortedGraphConditionalProbability from "../slides/06-sorted-graph-conditional-probability.js";
import spinningTopPopulationGraphCensored from "../slides/07-spinning-top-population-graph-censored.js";
import sortedGraphConditionalProbabilityCensored from "../slides/08-sorted-graph-conditional-probability-censored.js";
import saasKaplanMeierPayoff from "../slides/09-saas-kaplan-meier-payoff.js";
import aboutAndHiring from "../slides/10-about-and-hiring.js";
import dropCensoredUsers from "../slides/11-drop-censored-users.js";

export const storyboard = [
  title,
  meepleChurnProblem,
  naiveSurvivalGraph,
  spinningTopSingle,
  spinningTopPopulationStanding,
  spinningTopPopulationGraph,
  sortedGraphConditionalProbability,
  spinningTopPopulationGraphCensored,
  sortedGraphConditionalProbabilityCensored,
  saasKaplanMeierPayoff,
  aboutAndHiring,
  dropCensoredUsers,
];
