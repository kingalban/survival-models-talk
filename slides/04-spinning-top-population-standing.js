// --- SCRIPT ANNOTATION [slide:spinning-top-population-standing] ---
// The spinning top resets, shrinks, and many more identical spinning tops
// start next to it in a column. Some of them fall over at a random time
// within the observation window; the rest stay standing (still spinning)
// at the end of it. No graph yet — just the population.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";

const N = 10;
const SURVIVOR_COUNT = 7; // exactly 7 of the 10 never fall
const TOP_SIZE = 96;
const OBSERVATION_WINDOW_MS = 9000;
// A fall (wobble + settle, see artefacts/spinning-top.js defaults) takes
// ~4.75s from trigger to rest. Falls must trigger early enough to finish
// before the timer hits zero, with some margin.
const FALL_ANIMATION_MS = 4750;
const FALL_TRIGGER_WINDOW_MS = OBSERVATION_WINDOW_MS - FALL_ANIMATION_MS - 500;

export default {
  id: "spinning-top-population-standing",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        Now imagine spinning many at once
      </h2>
      <div class="viz-panel">
        <div style="width: 100%;">
          <div id="row" style="display:grid; grid-template-columns: repeat(5, ${TOP_SIZE}px); justify-content:center; align-items:flex-end; gap: 0.5rem; row-gap: 1.5rem;"></div>
          <p id="equation" class="accent-yellow" style="text-align:center; font-family: var(--font-mono); font-size: 1.6rem; margin: 1.5rem 0 0; opacity: 0; transition: opacity 800ms ease;">
            P(survival) = ${SURVIVOR_COUNT}/${N}
          </p>
          <div style="display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; margin-top:2rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">
            <span></span>
            <button id="restartBtn">Restart</button>
            <span id="timer" style="justify-self:end; font-size: 1.1rem;">9.0s</span>
          </div>
        </div>
      </div>
    `;

    const row = stage.querySelector("#row");
    const restartBtn = stage.querySelector("#restartBtn");
    const timerEl = stage.querySelector("#timer");
    const equationEl = stage.querySelector("#equation");

    let rows = [];
    let timeouts = [];
    let timerRaf = null;
    let windowStart = 0;

    function teardown() {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      if (timerRaf) cancelAnimationFrame(timerRaf);
      rows.forEach((r) => r.top.destroy());
      rows = [];
      row.innerHTML = "";
    }

    function highlightSurvivors() {
      rows.forEach((r) => {
        if (!r.survives) return;
        r.wrapper.style.transform = "translateY(-2.2rem) scale(1.4)";
        r.wrapper.style.zIndex = "1";
      });
      equationEl.style.opacity = "1";
    }

    function tickTimer() {
      const remaining = Math.max(0, OBSERVATION_WINDOW_MS - (performance.now() - windowStart));
      timerEl.textContent = `${(remaining / 1000).toFixed(1)}s`;
      if (remaining > 0) timerRaf = requestAnimationFrame(tickTimer);
    }

    function setup() {
      teardown();
      equationEl.style.opacity = "0";

      // Exactly N - SURVIVOR_COUNT fall, chosen at random positions —
      // not an independent per-top coin flip, so the count is exact.
      const fallIndices = new Set();
      while (fallIndices.size < N - SURVIVOR_COUNT) {
        fallIndices.add(Math.floor(Math.random() * N));
      }

      rows = Array.from({ length: N }, (_, i) => {
        const wrapper = document.createElement("div");
        wrapper.style.width = `${TOP_SIZE}px`;
        wrapper.style.transition = "transform 700ms ease";
        row.appendChild(wrapper);

        const top = createSpinningTop({ size: TOP_SIZE, table: false, seed: Math.random() });
        wrapper.appendChild(top.el);

        const survives = !fallIndices.has(i);
        if (!survives) {
          const fallAt = Math.random() * FALL_TRIGGER_WINDOW_MS;
          timeouts.push(setTimeout(() => top.fall(), fallAt));
        }
        return { top, wrapper, survives };
      });

      windowStart = performance.now();
      timerRaf = requestAnimationFrame(tickTimer);
      timeouts.push(setTimeout(highlightSurvivors, OBSERVATION_WINDOW_MS));
    }

    setup();
    restartBtn.addEventListener("click", setup);

    return teardown;
  },
};
