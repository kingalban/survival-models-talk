// The storyboard: the single source of truth for slide order.
// Rearranging the talk = reordering this array. Adding a slide = adding
// one import + one line here. Each entry's module lives in ../slides/.

import titleSlide from "../slides/00-title.js";
import distributionDemo from "../slides/01-distribution-demo.js";

export const storyboard = [titleSlide, distributionDemo];
