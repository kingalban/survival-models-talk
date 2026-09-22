// --- SCRIPT ANNOTATION [slide:saas-kaplan-meier-payoff] ---
// The closing slide, back on the SaaS customer base the talk opened with
// — literally the same sample the opening slide left on screen, drawn on
// the same axes: the biased naive curve in red and, since the audience
// has already seen it, the ground-truth curve in green dashed. A button
// overlays the Kaplan-Meier estimate in blue, drawn left to right so it
// visibly tracks the green truth the naive curve misses entirely — the
// estimate you could actually have computed, since unlike the ground
// truth it never peeks at a customer's real lifetime. A Reset button
// takes the blue curve away again so the reveal can be replayed.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
  MAX_YEARS,
  buildDataset,
  naiveSurvivalSteps,
  trueLifetimeSteps,
  kaplanMeierSurvivalSteps,
  getSaasRun,
} from "../js/saas-dataset.js";

const WIDTH = 760;
const HEIGHT = 420;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 46 };
const DRAW_MS = 1100;

// Matches the opening slide's slider defaults, so a standalone view of
// this slide shows the same shape of customer base it opened on.
const FALLBACK = { n: 400, rate: 0.2, bumpWeight: 0.65 };

export default {
  id: "saas-kaplan-meier-payoff",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        Back to your customers
      </h2>
      <div class="viz-panel">
        <div>
          <svg id="chart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; justify-content:center; gap:1.2rem; margin-top:1.4rem;">
            <button id="kmBtn" class="btn-primary">Overlay Kaplan-Meier</button>
            <button id="resetBtn" class="btn-subtle">Reset</button>
          </div>
        </div>
      </div>
    `;

    const svg = d3.select(stage.querySelector("#chart"));
    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear().domain([0, MAX_YEARS]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}y`));
    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    const step = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveStepAfter);

    // The same customer base the opening slide left on screen, so the two
    // graphs are literally the same picture — resampled only if this slide
    // is reached without that one having run.
    const run = getSaasRun() || {
      rows: buildDataset(FALLBACK.n, FALLBACK.rate, FALLBACK.bumpWeight),
      n: FALLBACK.n,
    };
    const { rows, n } = run;

    // Both curves from the opening slide are already here: the audience saw
    // the naive one, then the ground truth that made its bias obvious. The
    // only thing left to add is the estimate they could actually compute.
    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-red)")
      .attr("stroke-width", 3)
      .datum(naiveSurvivalSteps(rows, n))
      .attr("d", step);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-green)")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "2 4")
      .datum(trueLifetimeSteps(rows, n))
      .attr("d", step);

    const kmPath = g
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-blue)")
      .attr("stroke-width", 3)
      .datum(kaplanMeierSurvivalSteps(rows))
      .attr("d", step)
      .attr("opacity", 0);

    function legend(text, color, row) {
      return g
        .append("text")
        .attr("x", innerW - 10)
        .attr("y", 16 + row * 18)
        .attr("text-anchor", "end")
        .attr("fill", color)
        .attr("font-family", "var(--font-mono)")
        .attr("font-size", 12)
        .text(text);
    }

    legend("naive (biased)", "var(--accent-red)", 0);
    legend("actual (ground truth)", "var(--accent-green)", 1);
    const kmLegend = legend("Kaplan-Meier (estimated)", "var(--accent-blue)", 2).attr("opacity", 0);

    // Drawn left to right on the click, so the blue curve visibly tracks
    // the green one across the whole window rather than just appearing on
    // top of it.
    const kmLength = kmPath.node().getTotalLength();
    let drawRaf = null;

    function drawKm() {
      kmPath.attr("opacity", 1).attr("stroke-dasharray", `0 ${kmLength}`);
      kmLegend.attr("opacity", 1);
      const start = performance.now();
      if (drawRaf) cancelAnimationFrame(drawRaf);
      function tick(now) {
        const p = Math.min(1, (now - start) / DRAW_MS);
        kmPath.attr("stroke-dasharray", `${p * kmLength} ${kmLength}`);
        if (p < 1) drawRaf = requestAnimationFrame(tick);
        else {
          kmPath.attr("stroke-dasharray", null);
          drawRaf = null;
        }
      }
      drawRaf = requestAnimationFrame(tick);
    }

    function reset() {
      if (drawRaf) cancelAnimationFrame(drawRaf);
      drawRaf = null;
      kmPath.attr("opacity", 0).attr("stroke-dasharray", null);
      kmLegend.attr("opacity", 0);
    }

    stage.querySelector("#kmBtn").addEventListener("click", drawKm);
    stage.querySelector("#resetBtn").addEventListener("click", reset);

    return () => {
      if (drawRaf) cancelAnimationFrame(drawRaf);
    };
  },
};
