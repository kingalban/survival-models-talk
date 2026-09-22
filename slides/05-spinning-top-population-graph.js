// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph] ---
// The same group of spinning tops as the previous slide, but now as they
// spin they progress to the right, drawing a bar along underneath them,
// which becomes a graph. Every spinning top falls at some point before
// reaching the right-hand side — its falling time is drawn from a
// distribution bounded between the start and the end of the observation
// window, so none of them are left still spinning at the edge. Once
// they've all fallen, an "Order" button appears; clicking it fades the
// tops out and, with no slide transition (this is still the same slide),
// reorders the bars via a smooth transition: shortest at the top, longest
// at the bottom, settling into a simple graph. Once the bars settle, they
// cross-fade into the same data, same order, drawn as an actual chart with
// our graphing library (D3) and a real axis, rather than the hand-built
// div bars. Overlaid on top of the real chart, a dotted line traces the
// empirical survival function — since the bars are already sorted with
// even spacing, each row boundary is exactly one more event's worth of
// drop. A percentage y-axis on the left (100% at the top, 0% at the
// bottom) makes that scale explicit.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";
import { setSpinningTopRun } from "../js/spinning-top-run.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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
const FADE_MS = 600;
const REORDER_MS = 900;
const GRAPH_CROSSFADE_MS = 500;
const BAR_HEIGHT = 24;

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
        <div style="position: relative; width: ${TRACK_TOTAL_WIDTH}px; max-width: 100%; height: ${rowsHeight + AXIS_HEIGHT}px;">
          <div id="track" style="position: absolute; inset: 0; transition: opacity ${GRAPH_CROSSFADE_MS}ms ease;">
            <svg width="${TRACK_TOTAL_WIDTH}" height="${AXIS_HEIGHT}"
                 style="position: absolute; left: 0; top: ${rowsHeight}px;">
              <line x1="0" y1="10" x2="${axisLineEnd}" y2="10" stroke="white" stroke-width="2" />
              <polygon points="${axisLineEnd},3 ${axisLineEnd + 14},10 ${axisLineEnd},17" fill="white" />
              <text x="${axisLineEnd + 20}" y="15" fill="white" font-family="var(--font-mono)" font-size="14">time</text>
            </svg>
          </div>
          <svg id="realChart" width="${TRACK_TOTAL_WIDTH}" height="${rowsHeight + AXIS_HEIGHT}"
               style="position: absolute; inset: 0; opacity: 0; transition: opacity ${GRAPH_CROSSFADE_MS}ms ease;"></svg>
        </div>
        <div style="display:flex; align-items:center; gap:1.2rem; margin-top:1.5rem;">
          <button id="restartBtn" class="btn-subtle">Restart</button>
          <button id="skipBtn" class="btn-subtle">Skip to the end</button>
          <button id="orderBtn" class="btn-subtle" disabled>Order</button>
        </div>
      </div>
    `;

    const track = stage.querySelector("#track");
    const realChart = d3.select(stage.querySelector("#realChart"));
    const restartBtn = stage.querySelector("#restartBtn");
    const skipBtn = stage.querySelector("#skipBtn");
    const orderBtn = stage.querySelector("#orderBtn");

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();

    let rows = [];
    let start = performance.now();
    let rafId = null;
    let timeouts = [];

    function teardown() {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      rows.forEach((row) => {
        if (row.top) row.top.destroy();
        row.wrapper.remove();
        row.bar.remove();
      });
      rows = [];
    }

    function setup() {
      teardown();
      orderBtn.disabled = true;
      track.style.transition = "none";
      track.style.opacity = "1";
      realChart.style("opacity", 0);
      realChart.selectAll("*").remove();
      void track.offsetHeight; // commit the transition:none before restoring it below
      track.style.transition = `opacity ${GRAPH_CROSSFADE_MS}ms ease`;

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
      setSpinningTopRun("population-graph", rows.map((row) => row.fallFrac));
      start = performance.now();
      rafId = requestAnimationFrame(render);
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

      if (p < 1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
        orderBtn.disabled = false;
      }
    }

    // Jumps straight to every top's already-fallen position, for pacing a
    // live talk without waiting out the full fall animation.
    function skipToEnd() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      rows.forEach((row) => {
        if (row.fallen) return;
        const x = TRACK_LEFT + row.fallFrac * TRACK_WIDTH;
        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;
        row.fallen = true;
        row.bar.style.background = red;
        row.top.fall();
      });
      orderBtn.disabled = false;
    }

    function fadeOutTops() {
      orderBtn.disabled = true;
      rows.forEach((row) => {
        row.wrapper.style.transition = `opacity ${FADE_MS}ms ease`;
        row.wrapper.style.opacity = "0";
      });
      timeouts.push(
        setTimeout(() => {
          rows.forEach((row) => {
            row.top.destroy();
            row.top = null;
            row.wrapper.remove();
          });
          reorderBars();
        }, FADE_MS)
      );
    }

    function reorderBars() {
      const sorted = [...rows].sort((a, b) => a.fallFrac - b.fallFrac);
      sorted.forEach((row, i) => {
        row.bar.style.transition = `top ${REORDER_MS}ms ease`;
        row.bar.style.top = `${i * ROW_HEIGHT + TOP_SIZE - 6}px`;
      });
      timeouts.push(
        setTimeout(
          () => swapToRealGraph(sorted.map((row) => row.fallFrac)),
          REORDER_MS + 300
        )
      );
    }

    // Same data, same order, same left-to-right footprint as the hand-built
    // bars — now drawn as an actual D3 chart with a real axis, cross-faded
    // in over the div-based version rather than replacing it abruptly.
    function swapToRealGraph(sortedFallFracs) {
      const seconds = sortedFallFracs.map((f) => f * (DURATION_MS / 1000));
      const x = d3
        .scaleLinear()
        .domain([0, DURATION_MS / 1000])
        .range([TRACK_LEFT, TRACK_LEFT + TRACK_WIDTH]);

      realChart
        .selectAll("rect")
        .data(seconds)
        .join("rect")
        .attr("x", TRACK_LEFT)
        .attr("y", (_, i) => i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT)
        .attr("width", (d) => x(d) - TRACK_LEFT)
        .attr("height", BAR_HEIGHT)
        .attr("rx", 4)
        .attr("fill", red);

      realChart
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${rowsHeight})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}s`));

      // Same row-boundary-to-fraction mapping the survival line below uses,
      // just surfaced as an axis: row 0's top is 100%, row N's bottom is 0%.
      const yPercent = d3.scaleLinear().domain([1, 0]).range([0, N * ROW_HEIGHT]);
      realChart
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${TRACK_LEFT},0)`)
        .call(
          d3
            .axisLeft(yPercent)
            .tickValues(d3.range(0, 1.001, 0.1))
            .tickFormat(d3.format(".0%"))
        );

      // The empirical survival function, drawn in the exact same pixel
      // space as the bars: the rows are evenly spaced, so each row
      // boundary already represents exactly one more event's worth (1/N)
      // of drop — no separate probability axis needed.
      const survivalSteps = [
        [0, 0],
        ...seconds.map((t, i) => [t, (i + 1) * ROW_HEIGHT]),
        [DURATION_MS / 1000, N * ROW_HEIGHT],
      ];
      const survivalLine = d3
        .line()
        .x((d) => x(d[0]))
        .y((d) => d[1])
        .curve(d3.curveStepAfter);

      realChart
        .append("path")
        .datum(survivalSteps)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "3 6")
        .attr("d", survivalLine);

      track.style.opacity = "0";
      realChart.style("opacity", 1);
    }

    setup();
    restartBtn.addEventListener("click", setup);
    skipBtn.addEventListener("click", skipToEnd);
    orderBtn.addEventListener("click", fadeOutTops);

    return teardown;
  },
};
