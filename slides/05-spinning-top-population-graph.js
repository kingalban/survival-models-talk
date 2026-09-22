// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph] ---
// The same group of spinning tops as the previous slide, but now as they
// spin they progress to the right, drawing a bar along underneath them,
// which becomes a graph. Spinning tops that do not fall within the time
// frame reach the right-hand side of the graph area and simply continue
// spinning there. (parameterised and resettable via UI buttons)
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";

const TOP_SIZE = 54;
const ROW_HEIGHT = 62;
const TRACK_LEFT = TOP_SIZE / 2 + 10;
const TRACK_WIDTH = 660;
const DURATION_MS = 9000;
const SURVIVE_FRACTION = 0.3; // fraction that reach the edge still spinning

export default {
  id: "spinning-top-population-graph",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        Watching them draw their own graph
      </h2>
      <div class="viz-panel">
        <div>
          <div id="track" style="position: relative; width: ${TRACK_LEFT + TRACK_WIDTH + TOP_SIZE / 2}px; max-width: 100%;">
            <div id="edgeLine" style="position: absolute; top: 0; bottom: 0; border-left: 2px dashed var(--fg-dim); opacity: 0.6;"></div>
          </div>
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-top:0.6rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">
            <label>N <input id="nSlider" type="range" min="5" max="16" step="1" value="8" /></label>
            <button id="restartBtn">Restart</button>
          </div>
        </div>
      </div>
    `;

    const track = stage.querySelector("#track");
    const edgeLine = stage.querySelector("#edgeLine");
    const nSlider = stage.querySelector("#nSlider");
    const restartBtn = stage.querySelector("#restartBtn");

    edgeLine.style.left = `${TRACK_LEFT + TRACK_WIDTH}px`;

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();
    const yellow = styles.getPropertyValue("--accent-yellow").trim();

    let rows = [];
    let start = performance.now();
    let rafId;

    function teardownRows() {
      rows.forEach((row) => {
        row.top.destroy();
        row.wrapper.remove();
        row.bar.remove();
      });
      rows = [];
    }

    function setup() {
      teardownRows();
      const n = Number(nSlider.value);
      track.style.height = `${n * ROW_HEIGHT + TOP_SIZE}px`;

      rows = Array.from({ length: n }, (_, i) => {
        const survives = Math.random() < SURVIVE_FRACTION;
        const rowTop = i * ROW_HEIGHT;

        const bar = document.createElement("div");
        bar.style.position = "absolute";
        bar.style.top = `${rowTop + TOP_SIZE - 6}px`;
        bar.style.left = `${TRACK_LEFT}px`;
        bar.style.height = "6px";
        bar.style.width = "0px";
        bar.style.opacity = "0.35";
        bar.style.borderRadius = "3px";
        track.appendChild(bar);

        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.top = `${rowTop}px`;
        wrapper.style.width = `${TOP_SIZE}px`;
        wrapper.style.left = `${TRACK_LEFT - TOP_SIZE / 2}px`;
        track.appendChild(wrapper);

        const top = createSpinningTop({ size: TOP_SIZE, table: false, seed: Math.random() });
        wrapper.appendChild(top.el);

        return {
          top,
          wrapper,
          bar,
          fallFrac: survives ? null : 0.15 + Math.random() * 0.8,
          fallen: false,
        };
      });
      start = performance.now();
    }

    function render(t) {
      const p = Math.min(1, (t - start) / DURATION_MS);

      rows.forEach((row) => {
        if (row.fallen) return;
        const targetFrac = row.fallFrac === null ? 1 : row.fallFrac;
        const frac = Math.min(p, targetFrac);
        const x = TRACK_LEFT + frac * TRACK_WIDTH;
        const color = row.fallFrac === null ? yellow : blue;

        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;
        row.bar.style.background = color;

        if (row.fallFrac !== null && frac >= targetFrac) {
          row.fallen = true;
          row.bar.style.background = red;
          row.top.fall();
        }
      });

      rafId = requestAnimationFrame(render);
    }

    setup();
    rafId = requestAnimationFrame(render);

    restartBtn.addEventListener("click", setup);
    nSlider.addEventListener("change", setup);

    return () => {
      cancelAnimationFrame(rafId);
      teardownRows();
    };
  },
};
