// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph] ---
// The same group of spinning tops as the previous slide, but now as they
// spin they progress to the right, drawing a bar along underneath them,
// which becomes a graph. Every spinning top falls at some point before
// reaching the right-hand side — its falling time is drawn from a
// distribution bounded between the start and the end of the observation
// window, so none of them are left still spinning at the edge.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";

const N = 10;
const TOP_SIZE = 80;
const ROW_HEIGHT = 80;
const TRACK_LEFT = TOP_SIZE / 2 + 10;
const TRACK_WIDTH = 620;
const TRACK_TOTAL_WIDTH = TRACK_LEFT + TRACK_WIDTH + TOP_SIZE / 2;
const AXIS_HEIGHT = 36;
const DURATION_MS = 9000;
// A falling top's x position freezes the moment it triggers — the wobble
// and settle animation then plays out in place, so it never travels
// further right regardless of how long that takes. The only real
// constraint is that the trigger itself lands strictly inside the track,
// not right at either edge.
const MIN_FALL_FRAC = 0.05;
const MAX_FALL_FRAC = 0.95;

function sampleBoundedFallFrac() {
  return MIN_FALL_FRAC + Math.random() * (MAX_FALL_FRAC - MIN_FALL_FRAC);
}

export default {
  id: "spinning-top-population-graph",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;
    const axisLineEnd = TRACK_TOTAL_WIDTH - 60;

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        Let's make a simple graph
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

      rows = Array.from({ length: N }, (_, i) => {
        const rowTop = i * ROW_HEIGHT;

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
          fallFrac: sampleBoundedFallFrac(),
          fallen: false,
        };
      });
      start = performance.now();
    }

    function render(t) {
      const p = Math.min(1, (t - start) / DURATION_MS);

      rows.forEach((row) => {
        if (row.fallen) return;
        const frac = Math.min(p, row.fallFrac);
        const x = TRACK_LEFT + frac * TRACK_WIDTH;

        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;

        if (frac >= row.fallFrac) {
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

    return () => {
      cancelAnimationFrame(rafId);
      teardownRows();
    };
  },
};
