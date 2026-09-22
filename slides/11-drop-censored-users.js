// --- SCRIPT ANNOTATION [slide:drop-censored-users] ---
// The same graph as the closing SaaS slide — same customer sample, same
// axes, with the naive curve in red, the ground truth in green dashed
// and Kaplan-Meier in blue all already drawn — plus one more line. A
// button draws, in orange, the curve you get from the other thing people
// reach for instead of Kaplan-Meier: throw the censored customers away
// entirely and estimate from only the ones whose churn you actually
// watched. It looks principled, since no churn date is invented, but the
// customers that leaves you with are exactly the ones who churned early
// enough to be seen doing it, so the orange curve falls away even faster
// than the naive red one. A Reset button takes it off again. This slide
// wasn't part of the talk as delivered — it answers a question the
// audience asked several times — so it is marked as an encore: above the
// heading sits the same small uppercase mono label used for "we're
// hiring" on the previous slide, in orange to match the new curve,
// reading "encore · added after the talk", and the line under the
// heading names the audience question it answers before giving the
// counts.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
  MAX_YEARS,
  buildDataset,
  naiveSurvivalSteps,
  trueLifetimeSteps,
  kaplanMeierSurvivalSteps,
  completeCaseSurvivalSteps,
  getSaasRun,
} from "../js/saas-dataset.js";

const WIDTH = 760;
const HEIGHT = 420;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 46 };
const DRAW_MS = 1100;

const FALLBACK = { n: 400, rate: 0.2, bumpWeight: 0.65 };

export default {
  id: "drop-censored-users",
  mount(stage) {
    const run = getSaasRun() || {
      rows: buildDataset(FALLBACK.n, FALLBACK.rate, FALLBACK.bumpWeight),
      n: FALLBACK.n,
    };
    const { rows, n } = run;
    const churned = rows.filter((r) => r.event).length;

    stage.innerHTML = `
      <div class="accent-orange" style="font-family:var(--font-mono); font-size:0.85rem; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:0.35rem;">
        encore · added after the talk
      </div>
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom:0.2rem;">
        What if we just drop them?
      </h2>
      <p style="margin:0 0 0.6rem; font-family:var(--font-mono); font-size:0.85rem; color:var(--fg-dim);">
        asked from the floor more than once — keep only the ${churned} customers we watched
        churn, ignore the other ${n - churned}
      </p>
      <div class="viz-panel">
        <div>
          <svg id="chart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; justify-content:center; gap:1.2rem; margin-top:1.4rem;">
            <button id="dropBtn" class="btn-primary">Drop the censored customers</button>
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

    function curve(steps, color, dash) {
      const path = g
        .append("path")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .datum(steps)
        .attr("d", step);
      if (dash) path.attr("stroke-dasharray", dash);
      return path;
    }

    // Everything the previous slide ended on is already here; the only new
    // line is the one the button draws.
    curve(naiveSurvivalSteps(rows, n), "var(--accent-red)");
    curve(trueLifetimeSteps(rows, n), "var(--accent-green)", "2 4");
    curve(kaplanMeierSurvivalSteps(rows), "var(--accent-blue)");
    const droppedPath = curve(completeCaseSurvivalSteps(rows), "var(--accent-orange)").attr("opacity", 0);

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
    legend("Kaplan-Meier (estimated)", "var(--accent-blue)", 2);
    const droppedLegend = legend("censored users dropped", "var(--accent-orange)", 3).attr("opacity", 0);

    const dropLength = droppedPath.node().getTotalLength();
    let drawRaf = null;

    function drawDropped() {
      droppedPath.attr("opacity", 1).attr("stroke-dasharray", `0 ${dropLength}`);
      droppedLegend.attr("opacity", 1);
      const start = performance.now();
      if (drawRaf) cancelAnimationFrame(drawRaf);
      function tick(now) {
        const p = Math.min(1, (now - start) / DRAW_MS);
        droppedPath.attr("stroke-dasharray", `${p * dropLength} ${dropLength}`);
        if (p < 1) drawRaf = requestAnimationFrame(tick);
        else {
          droppedPath.attr("stroke-dasharray", null);
          drawRaf = null;
        }
      }
      drawRaf = requestAnimationFrame(tick);
    }

    function reset() {
      if (drawRaf) cancelAnimationFrame(drawRaf);
      drawRaf = null;
      droppedPath.attr("opacity", 0).attr("stroke-dasharray", null);
      droppedLegend.attr("opacity", 0);
    }

    stage.querySelector("#dropBtn").addEventListener("click", drawDropped);
    stage.querySelector("#resetBtn").addEventListener("click", reset);

    return () => {
      if (drawRaf) cancelAnimationFrame(drawRaf);
    };
  },
};
