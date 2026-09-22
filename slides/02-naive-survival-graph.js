// D3 handles scales/axes/line-drawing scaffolding; the sampling and the
// naive estimator are hand-rolled stats code, and the left-to-right reveal
// + overlay toggle are hand-rolled too.
//
// --- SCRIPT ANNOTATION [slide:naive-survival-graph] ---
// A slide showing a survival function graph being animated into existence
// from left to right. The data is selected from an actual distribution,
// which can be reset or reparameterized by a few buttons in the UI. But
// this is a naive analysis. We assume that all right-censored individuals
// turn at that moment. For the data in the graph we select the actual
// lifetime of each user from some negative exponential distribution and
// then the censoring lifetime From a Negative linear distribution over the
// period 0 to 5 years, mixed with an extra bump of censoring times under 1
// year (representing a recent surge of new signups) so that a lot more
// users end up censored early. We then get the Observed lifetime of each
// user by taking the minimum of their real lifetime and their censored
// lifetime.
// --- END SCRIPT ANNOTATION ---
//
// --- SCRIPT ANNOTATION [layer:true-lifetime-overlay on:naive-survival-graph] ---
// A graph of the real survival function, computed directly from each
// user's actual uncensored lifetime — which we know here because we
// generated the simulated data ourselves — overlaid on top of the previous
// naive graph. This is not Kaplan-Meier; that comes later, once we no
// longer get to peek at the ground truth.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
  MAX_YEARS,
  buildDataset,
  naiveSurvivalSteps,
  trueLifetimeSteps,
  setSaasRun,
} from "../js/saas-dataset.js";

const WIDTH = 760;
const HEIGHT = 420;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 46 };
const REVEAL_MS = 1200;

export default {
  id: "naive-survival-graph",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        The naive survival curve
      </h2>
      <div class="viz-panel">
        <div>
          <svg id="chart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-top:0.6rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">
            <label>N <input id="nSlider" type="range" min="20" max="400" step="10" value="400" /></label>
            <label>&lambda; <input id="rateSlider" type="range" min="0.1" max="2" step="0.05" value="0.2" /></label>
            <label>recent-signup bump <input id="bumpSlider" type="range" min="0" max="0.7" step="0.05" value="0.65" /></label>
            <button id="resampleBtn">Resample</button>
          </div>
          <div style="display:flex; justify-content:center; margin-top:1.4rem;">
            <button id="revealTrueBtn" class="btn-primary">Reveal actual survival curve</button>
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

    // The clip rect is referenced from paths inside `g`, which is already
    // translated by MARGIN — clipPath coordinates are resolved in that same
    // local space, so they must NOT re-apply the margin offset themselves.
    const clipId = "reveal-clip";
    const clipRect = svg
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("x", 0)
      .attr("y", -MARGIN.top)
      .attr("width", 0)
      .attr("height", HEIGHT);

    const step = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveStepAfter);

    const naivePath = g
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-red)")
      .attr("stroke-width", 3)
      .attr("clip-path", `url(#${clipId})`);

    const truePath = g
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-green)")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "2 4")
      .attr("clip-path", `url(#${clipId})`)
      .attr("opacity", 0);

    const legend = g
      .append("text")
      .attr("x", innerW - 10)
      .attr("y", 16)
      .attr("text-anchor", "end")
      .attr("fill", "var(--accent-red)")
      .attr("font-family", "var(--font-mono)")
      .attr("font-size", 12)
      .text("naive (biased)");

    const trueLegend = g
      .append("text")
      .attr("x", innerW - 10)
      .attr("y", 34)
      .attr("text-anchor", "end")
      .attr("fill", "var(--accent-green)")
      .attr("font-family", "var(--font-mono)")
      .attr("font-size", 12)
      .attr("opacity", 0)
      .text("actual (ground truth)");

    let rows = [];
    let revealRaf = null;

    function animateReveal(onDone) {
      const start = performance.now();
      if (revealRaf) cancelAnimationFrame(revealRaf);
      function tick(now) {
        const p = Math.min(1, (now - start) / REVEAL_MS);
        clipRect.attr("width", p * innerW);
        if (p < 1) revealRaf = requestAnimationFrame(tick);
        else if (onDone) onDone();
      }
      revealRaf = requestAnimationFrame(tick);
    }

    function resample() {
      const n = Number(nSlider.value);
      const rate = Number(rateSlider.value);
      const bumpWeight = Number(bumpSlider.value);
      rows = buildDataset(n, rate, bumpWeight);
      // Published so the closing slide can redraw this exact customer base.
      setSaasRun({ rows, n });
      naivePath.datum(naiveSurvivalSteps(rows, n)).attr("d", step);
      truePath.attr("opacity", 0);
      trueLegend.attr("opacity", 0);
      animateReveal();
    }

    const nSlider = stage.querySelector("#nSlider");
    const rateSlider = stage.querySelector("#rateSlider");
    const bumpSlider = stage.querySelector("#bumpSlider");
    const resampleBtn = stage.querySelector("#resampleBtn");
    const revealTrueBtn = stage.querySelector("#revealTrueBtn");

    resampleBtn.addEventListener("click", resample);
    nSlider.addEventListener("change", resample);
    rateSlider.addEventListener("change", resample);
    bumpSlider.addEventListener("change", resample);
    revealTrueBtn.addEventListener("click", () => {
      const n = Number(nSlider.value);
      truePath.datum(trueLifetimeSteps(rows, n)).attr("d", step).attr("opacity", 1);
      trueLegend.attr("opacity", 1);
    });

    resample();

    return () => {
      if (revealRaf) cancelAnimationFrame(revealRaf);
    };
  },
};
