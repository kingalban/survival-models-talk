// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph-censored] ---
// The same population-graph setup as before — spinning tops falling over
// and drawing bars underneath them — but now, while a top is still
// spinning, a random selection of them get stolen by a dog before they
// fall: the top disappears and is replaced by a simple dog icon frozen at
// that spot, its bar stopping there too. The rest still fall as before.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";
import { setSpinningTopRun } from "../js/spinning-top-run.js";

const N = 10;
const STOLEN_COUNT = 3; // exactly 3 of the 10 get stolen by the dog before falling
const TOP_SIZE = 80;
const ROW_HEIGHT = 80;
const TRACK_LEFT = TOP_SIZE / 2 + 10;
const TRACK_WIDTH = 620;
const TRACK_TOTAL_WIDTH = TRACK_LEFT + TRACK_WIDTH + TOP_SIZE / 2;
const AXIS_HEIGHT = 36;
const DURATION_MS = 9000;
const MIN_TRIGGER_FRAC = 0.05;
const MAX_TRIGGER_FRAC = 0.95;

function sampleTriggerFrac() {
  return MIN_TRIGGER_FRAC + Math.random() * (MAX_TRIGGER_FRAC - MIN_TRIGGER_FRAC);
}

// A simple flat side-on dog silhouette — deliberately basic, to match the
// spinning top's clean-vector look rather than trying to be photoreal.
function dogSvgMarkup(size, color) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 60 Q6 50 14 38" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" />
      <ellipse cx="50" cy="65" rx="30" ry="20" fill="${color}" />
      <circle cx="78" cy="45" r="16" fill="${color}" />
      <polygon points="68,32 74,14 80,34" fill="${color}" />
      <polygon points="86,32 92,16 96,36" fill="${color}" />
      <ellipse cx="93" cy="50" rx="8" ry="6" fill="${color}" />
      <rect x="34" y="78" width="8" height="16" rx="3" fill="${color}" />
      <rect x="60" y="80" width="8" height="16" rx="3" fill="${color}" />
    </svg>`;
}

export default {
  id: "spinning-top-population-graph-censored",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;
    const axisLineEnd = TRACK_TOTAL_WIDTH - 60;

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        But what if a dog steals one?
      </h2>
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div id="track" style="position: relative; width: ${TRACK_TOTAL_WIDTH}px; max-width: 100%; height: ${rowsHeight + AXIS_HEIGHT}px;">
          <svg width="${TRACK_TOTAL_WIDTH}" height="${AXIS_HEIGHT}"
               style="position: absolute; left: 0; top: ${rowsHeight}px;">
            <line x1="0" y1="10" x2="${axisLineEnd}" y2="10" stroke="white" stroke-width="2" />
            <polygon points="${axisLineEnd},3 ${axisLineEnd + 14},10 ${axisLineEnd},17" fill="white" />
            <text x="${axisLineEnd + 20}" y="15" fill="white" font-family="var(--font-mono)" font-size="14">time</text>
          </svg>
        </div>
        <button id="restartBtn" style="margin-top:1.5rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">Restart</button>
      </div>
    `;

    const track = stage.querySelector("#track");
    const restartBtn = stage.querySelector("#restartBtn");

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();
    const purple = styles.getPropertyValue("--accent-purple").trim();

    let rows = [];
    let start = performance.now();
    let rafId;

    function teardownRows() {
      rows.forEach((row) => {
        if (row.top) row.top.destroy();
        row.wrapper.remove();
        row.bar.remove();
      });
      rows = [];
    }

    function setup() {
      teardownRows();

      const stolenIndices = new Set();
      while (stolenIndices.size < STOLEN_COUNT) {
        stolenIndices.add(Math.floor(Math.random() * N));
      }

      rows = Array.from({ length: N }, (_, i) => {
        const rowTop = i * ROW_HEIGHT;
        const censored = stolenIndices.has(i);

        const bar = document.createElement("div");
        bar.style.position = "absolute";
        bar.style.top = `${rowTop + TOP_SIZE - 6}px`;
        bar.style.left = `${TRACK_LEFT}px`;
        bar.style.height = "6px";
        bar.style.width = "0px";
        bar.style.opacity = "0.35";
        bar.style.background = blue;
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
          censored,
          triggerFrac: sampleTriggerFrac(),
          triggered: false,
        };
      });

      setSpinningTopRun(
        "population-graph-censored",
        rows.map((r) => ({ value: r.triggerFrac, censored: r.censored }))
      );
      start = performance.now();
    }

    function render(t) {
      const p = Math.min(1, (t - start) / DURATION_MS);

      rows.forEach((row) => {
        if (row.triggered) return;
        const frac = Math.min(p, row.triggerFrac);
        const x = TRACK_LEFT + frac * TRACK_WIDTH;

        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;

        if (frac >= row.triggerFrac) {
          row.triggered = true;
          if (row.censored) {
            row.bar.style.background = purple;
            row.top.destroy();
            row.top = null;
            row.wrapper.innerHTML = dogSvgMarkup(TOP_SIZE, purple);
          } else {
            row.bar.style.background = red;
            row.top.fall();
          }
        }
      });

      rafId = requestAnimationFrame(render);
    }

    setup();
    rafId = requestAnimationFrame(render);

    restartBtn.addEventListener("click", setup);

    return () => {
      cancelAnimationFrame(rafId);
      teardownRows();
    };
  },
};
