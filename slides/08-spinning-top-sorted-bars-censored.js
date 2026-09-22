// --- SCRIPT ANNOTATION [slide:spinning-top-sorted-bars-censored] ---
// The same population and numbers as the previous slide — no restarting or
// recalculating. As before, the tops (and dog icons) fade out and the bars
// reorder themselves shortest at the top to longest at the bottom, but the
// bars belonging to dog-stolen tops keep a small dog marker, since we
// don't know when they would eventually have fallen.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";
import { getSpinningTopRun } from "../js/spinning-top-run.js";

const N = 10;
const TOP_SIZE = 80;
const ROW_HEIGHT = 80;
const TRACK_LEFT = TOP_SIZE / 2 + 10;
const TRACK_WIDTH = 620;
const TRACK_TOTAL_WIDTH = TRACK_LEFT + TRACK_WIDTH + TOP_SIZE / 2;
const AXIS_HEIGHT = 36;

const TOPS_VISIBLE_MS = 900;
const FADE_MS = 600;
const REORDER_MS = 900;

// Fallback only for viewing this slide in isolation without having run the
// previous slide first.
function sampleFallback() {
  return { value: 0.05 + Math.random() * 0.9, censored: Math.random() < 0.3 };
}

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
  id: "spinning-top-sorted-bars-censored",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;
    const axisLineEnd = TRACK_TOTAL_WIDTH - 60;
    const data = getSpinningTopRun("population-graph-censored") || Array.from({ length: N }, sampleFallback);

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        Sorting them, dog and all
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
    const red = styles.getPropertyValue("--accent-red").trim();
    const purple = styles.getPropertyValue("--accent-purple").trim();

    let rows = [];
    let timeouts = [];

    function teardown() {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      rows.forEach((r) => {
        if (r.top) r.top.destroy();
        r.wrapper.remove();
        r.bar.remove();
      });
      rows = [];
    }

    function play() {
      teardown();

      rows = data.map(({ value, censored }, i) => {
        const rowTop = i * ROW_HEIGHT;
        const barWidth = value * TRACK_WIDTH;

        const bar = document.createElement("div");
        bar.style.position = "absolute";
        bar.style.top = `${rowTop + TOP_SIZE - 6}px`;
        bar.style.left = `${TRACK_LEFT}px`;
        bar.style.height = "6px";
        bar.style.width = `${barWidth}px`;
        bar.style.opacity = "0.35";
        bar.style.background = censored ? purple : red;
        bar.style.borderRadius = "3px";
        bar.style.transition = `top ${REORDER_MS}ms ease`;
        track.appendChild(bar);

        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.top = `${rowTop}px`;
        wrapper.style.width = `${TOP_SIZE}px`;
        wrapper.style.left = `${TRACK_LEFT + barWidth - TOP_SIZE / 2}px`;
        wrapper.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease, top ${REORDER_MS}ms ease`;
        track.appendChild(wrapper);

        let top = null;
        if (censored) {
          wrapper.innerHTML = dogSvgMarkup(TOP_SIZE, purple);
        } else {
          top = createSpinningTop({ size: TOP_SIZE, table: false, seed: Math.random() });
          top.fall();
          wrapper.appendChild(top.el);
        }

        return { value, censored, bar, wrapper, top };
      });

      timeouts.push(setTimeout(afterShow, TOPS_VISIBLE_MS));
    }

    function afterShow() {
      rows.forEach((r) => {
        if (r.censored) {
          // Shrink to a small marker rather than vanishing — a censored
          // observation still needs to be visible once sorted.
          r.wrapper.style.transform = "scale(0.55)";
        } else {
          r.wrapper.style.opacity = "0";
        }
      });
      timeouts.push(
        setTimeout(() => {
          rows.forEach((r) => {
            if (!r.censored) {
              r.top.destroy();
              r.wrapper.remove();
            }
          });
          reorder();
        }, FADE_MS)
      );
    }

    function reorder() {
      const sorted = [...rows].sort((a, b) => a.value - b.value);
      sorted.forEach((r, i) => {
        r.bar.style.top = `${i * ROW_HEIGHT + TOP_SIZE - 6}px`;
        if (r.censored) {
          r.wrapper.style.top = `${i * ROW_HEIGHT}px`;
        }
      });
    }

    play();
    restartBtn.addEventListener("click", play);

    return teardown;
  },
};
