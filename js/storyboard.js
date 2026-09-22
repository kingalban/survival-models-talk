// The storyboard: the single source of truth for slide order.
// Rearranging the talk = reordering this array. Adding a slide = adding
// one import + one line here. Each entry's module lives in ../slides/.

import title from "../slides/00-title.js";
import meepleChurnProblem from "../slides/01-meeple-churn-problem.js";
import naiveSurvivalGraph from "../slides/02-naive-survival-graph.js";
import spinningTopSingle from "../slides/03-spinning-top-single.js";
import spinningTopPopulationStanding from "../slides/04-spinning-top-population-standing.js";
import spinningTopPopulationGraph from "../slides/05-spinning-top-population-graph.js";
import staircaseBuildupPlaceholder from "../slides/06-staircase-buildup-placeholder.js";
import censoringAndWrapupPlaceholder from "../slides/07-censoring-and-wrapup-placeholder.js";

export const storyboard = [
  title,
  meepleChurnProblem,
  naiveSurvivalGraph,
  spinningTopSingle,
  spinningTopPopulationStanding,
  spinningTopPopulationGraph,
  staircaseBuildupPlaceholder,
  censoringAndWrapupPlaceholder,
];
