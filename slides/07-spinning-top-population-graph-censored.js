// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph-censored] ---
// The same population-graph setup as before — spinning tops falling over
// and drawing bars underneath them — but now, while a top is still
// spinning, a random selection of them get stolen by a dog before they
// fall: the top disappears and a paw print (the shared paw-print
// artefact) stamps down frozen at that spot, its bar stopping there too,
// in a distinct color from an actual fall. The rest still fall as
// before. Once they've all been resolved, "Order" reorders the bars by
// observed time (regardless of type) and cross-fades into a real D3
// chart with a percentage axis, same as the previous pair — small paw
// markers stay next to the censored bars. The step line here is a proper
// Kaplan-Meier curve rather than the naive one-drop-per-row staircase:
// it stays flat across a censored observation and takes a
// correspondingly bigger step at the next real fall, because a stolen
// top leaves the risk set without ever counting as a failure.
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";
import { createPawPrint } from "../artefacts/paw-print.js";
import { setSpinningTopRun } from "../js/spinning-top-run.js";
import { kaplanMeierCurve } from "../js/kaplan-meier.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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
const FADE_MS = 600;
const REORDER_MS = 900;
const GRAPH_CROSSFADE_MS = 500;
const BAR_HEIGHT = 24;
const MARKER_SIZE = 32; // small persistent paw marker on the real chart

function sampleTriggerFrac() {
  return MIN_TRIGGER_FRAC + Math.random() * (MAX_TRIGGER_FRAC - MIN_TRIGGER_FRAC);
}

export default {
  id: "spinning-top-population-graph-censored",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;
    const axisLineEnd = TRACK_TOTAL_WIDTH - 60;

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        But what if a dog steals a spinning top?
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
    const purple = styles.getPropertyValue("--accent-purple").trim();

    let rows = [];
    let pawMarkers = [];
    let start = performance.now();
    let rafId = null;
    let timeouts = [];

    function teardown() {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      rows.forEach((row) => {
        if (row.visual) row.visual.destroy();
        row.wrapper.remove();
        row.bar.remove();
      });
      rows = [];
      pawMarkers.forEach((paw) => paw.destroy());
      pawMarkers = [];
    }

    function resolveRow(row) {
      row.triggered = true;
      if (row.censored) {
        row.bar.style.background = purple;
        row.visual.destroy();
        const paw = createPawPrint({ size: TOP_SIZE, disc: false });
        row.wrapper.appendChild(paw.el);
        paw.press();
        row.visual = paw;
      } else {
        row.bar.style.background = red;
        row.visual.fall();
      }
    }

    function setup() {
      teardown();
      orderBtn.disabled = true;
      track.style.transition = "none";
      track.style.opacity = "1";
      realChart.style("opacity", 0);
      realChart.selectAll("*").remove();
      void track.offsetHeight;
      track.style.transition = `opacity ${GRAPH_CROSSFADE_MS}ms ease`;

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
          visual: top,
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
      rafId = requestAnimationFrame(render);
    }

    function render(t) {
      const p = Math.min(1, (t - start) / DURATION_MS);

      rows.forEach((row) => {
        if (row.triggered) return;
        const frac = Math.min(p, row.triggerFrac);
        const x = TRACK_LEFT + frac * TRACK_WIDTH;

        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;

        if (frac >= row.triggerFrac) resolveRow(row);
      });

      if (p < 1) {
        rafId = requestAnimationFrame(render);
      } else {
        rafId = null;
        orderBtn.disabled = false;
      }
    }

    // Jumps straight to every row's already-resolved position, for pacing
    // a live talk without waiting out the full animation.
    function skipToEnd() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      rows.forEach((row) => {
        if (row.triggered) return;
        const x = TRACK_LEFT + row.triggerFrac * TRACK_WIDTH;
        row.wrapper.style.left = `${x - TOP_SIZE / 2}px`;
        row.bar.style.width = `${x - TRACK_LEFT}px`;
        resolveRow(row);
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
            row.visual.destroy();
            row.visual = null;
            row.wrapper.remove();
          });
          reorderBars();
        }, FADE_MS)
      );
    }

    function reorderBars() {
      const sorted = [...rows].sort((a, b) => a.triggerFrac - b.triggerFrac);
      sorted.forEach((row, i) => {
        row.bar.style.transition = `top ${REORDER_MS}ms ease`;
        row.bar.style.top = `${i * ROW_HEIGHT + TOP_SIZE - 6}px`;
      });
      timeouts.push(
        setTimeout(
          () => swapToRealGraph(sorted.map((row) => ({ value: row.triggerFrac, censored: row.censored }))),
          REORDER_MS + 300
        )
      );
    }

    // Same data, same order, same left-to-right footprint as the hand-built
    // bars — now drawn as an actual D3 chart with a real axis, cross-faded
    // in over the div-based version rather than replacing it abruptly.
    function swapToRealGraph(sortedRows) {
      const seconds = sortedRows.map((r) => r.value * (DURATION_MS / 1000));
      const x = d3
        .scaleLinear()
        .domain([0, DURATION_MS / 1000])
        .range([TRACK_LEFT, TRACK_LEFT + TRACK_WIDTH]);

      realChart
        .selectAll("rect")
        .data(sortedRows)
        .join("rect")
        .attr("x", TRACK_LEFT)
        .attr("y", (_, i) => i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT)
        .attr("width", (d) => x(d.value * (DURATION_MS / 1000)) - TRACK_LEFT)
        .attr("height", BAR_HEIGHT)
        .attr("rx", 4)
        .attr("fill", (d) => (d.censored ? purple : red));

      realChart
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${rowsHeight})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}s`));

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

      // Kaplan-Meier, not a row-per-observation staircase: a dog-stolen top
      // leaves the risk set without dropping the curve, so the line is flat
      // across a paw print and takes a bigger step at the next real fall.
      const survivalSteps = kaplanMeierCurve(
        sortedRows.map((r, i) => ({ time: seconds[i], censored: r.censored })),
        DURATION_MS / 1000
      );
      const survivalLine = d3
        .line()
        .x((d) => x(d[0]))
        .y((d) => yPercent(d[1]))
        .curve(d3.curveStepAfter);

      realChart
        .append("path")
        .datum(survivalSteps)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "3 6")
        .attr("d", survivalLine);

      // Small persistent paw markers next to each censored bar's end — a
      // censored point stays visibly marked even after everything else
      // (the spinning tops, the dog stamp animation) is gone.
      const chartHost = realChart.node().parentElement;
      sortedRows.forEach((r, i) => {
        if (!r.censored) return;
        const paw = createPawPrint({ size: MARKER_SIZE, disc: false });
        paw.el.style.position = "absolute";
        paw.el.style.left = `${x(r.value * (DURATION_MS / 1000)) + 6}px`;
        paw.el.style.top = `${i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT / 2 - MARKER_SIZE / 2}px`;
        chartHost.appendChild(paw.el);
        pawMarkers.push(paw);
      });

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
