import { Deck } from "./deck.js";
import { storyboard } from "./storyboard.js";

new Deck({
  stageEl: document.getElementById("stage"),
  slides: storyboard,
  hud: {
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    progress: document.getElementById("progress"),
    counter: document.getElementById("counter"),
  },
});
