// The storyboard: the single source of truth for slide order.
// Rearranging the talk = reordering this array. Adding a slide = adding
// one import + one line here. Each entry's module lives in ../slides/.

import title from "../slides/00-title.js";
import meepleChurnProblem from "../slides/01-meeple-churn-problem.js";
import naiveSurvivalGraph from "../slides/02-naive-survival-graph.js";
import spinningTopPopulation from "../slides/03-spinning-top-population.js";
import staircaseBuildupPlaceholder from "../slides/04-staircase-buildup-placeholder.js";
import censoringAndWrapupPlaceholder from "../slides/05-censoring-and-wrapup-placeholder.js";

export const storyboard = [
  title,
  meepleChurnProblem,
  naiveSurvivalGraph,
  spinningTopPopulation,
  staircaseBuildupPlaceholder,
  censoringAndWrapupPlaceholder,
];
