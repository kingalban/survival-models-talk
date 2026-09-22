// --- SCRIPT ANNOTATION [slide:sorted-graph-conditional-probability-censored] ---
// The same finished graph from the previous slide — sorted bars (red for
// an actual fall, purple with a small paw marker for a dog-stolen one),
// the Kaplan-Meier step line, percentage axis — locked to that slide's
// exact numbers, no restarting or recalculating here. Laid out like the
// uncensored pair, but with the numbers now derived from the actual run
// rather than hard-coded: each of the first three genuine falls gets a
// stacked fraction to the right of its bar giving that event's
// conditional survival, (at risk − 1) / at risk, where the at-risk count
// has already been reduced by any censoring before it. Each censored row
// before that point is labelled "no update" next to its paw print. To
// the right of the graph, the same two stacked equations in ascending
// order — the second and third falls' running products — but since the
// fractions no longer cancel, each one's result is a percentage rather
// than a tidy k/10, with a line underneath noting that a paw print never
// becomes a term in the product, it only shrinks the denominator of
// every fall after it. The equations start hidden under the same
// greyed-out reveal panel; clicking it fades the panel away.
// --- END SCRIPT ANNOTATION ---
import { createPawPrint } from "../artefacts/paw-print.js";
import { getSpinningTopRun } from "../js/spinning-top-run.js";
import { kaplanMeierSteps } from "../js/kaplan-meier.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const N = 10;
const TOP_SIZE = 80;
const ROW_HEIGHT = 80;
const TRACK_LEFT = TOP_SIZE / 2 + 10;
const TRACK_WIDTH = 620;
const TRACK_TOTAL_WIDTH = TRACK_LEFT + TRACK_WIDTH + TOP_SIZE / 2;
const AXIS_HEIGHT = 36;
const DURATION_MS = 9000;
const BAR_HEIGHT = 24;
const MARKER_SIZE = 32;
const MIN_TRIGGER_FRAC = 0.05;
const MAX_TRIGGER_FRAC = 0.95;
const STOLEN_COUNT = 3;

// Mirrors the population slide's sampler, including its forced opening:
// shortest observation a fall, second-shortest a censoring.
function sampleFallback() {
  const values = Array.from({ length: N }, () => MIN_TRIGGER_FRAC + Math.random() * (MAX_TRIGGER_FRAC - MIN_TRIGGER_FRAC));
  const byTime = values
    .map((value, i) => ({ value, i }))
    .sort((a, b) => a.value - b.value)
    .map((r) => r.i);
  const stolen = new Set([byTime[1]]);
  const later = byTime.slice(2);
  while (stolen.size < STOLEN_COUNT) stolen.add(later[Math.floor(Math.random() * later.length)]);
  return values.map((value, i) => ({ value, censored: stolen.has(i) }));
}

function fractionHtml(num, den, extraClass = "") {
  return `<span class="fraction ${extraClass}"><span class="num">${num}</span><span class="bar"></span><span class="den">${den}</span></span>`;
}

// Once censoring is in the mix the fractions stop cancelling, so the
// running product is shown as a percentage instead of a tidy k/10.
function percentHtml(value) {
  const pct = value * 100;
  const text = Math.abs(pct - Math.round(pct)) < 0.05 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
  return `<span style="font-family: var(--font-mono);">${text}</span>`;
}

// Placed on an explicit grid cell so the "=" in a two-term and a
// three-term equation land in the same column regardless of how many
// factors come before it.
function gridItem(html, row, col) {
  return `<span style="grid-row:${row}; grid-column:${col}; display:flex; align-items:center; justify-content:center;">${html}</span>`;
}

export default {
  id: "sorted-graph-conditional-probability-censored",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;

    // Locked to whatever the population-graph-censored slide last
    // generated — only a fallback if this slide is viewed standalone.
    const data = (getSpinningTopRun("population-graph-censored") || sampleFallback())
      .slice()
      .sort((a, b) => a.value - b.value);
    const seconds = data.map((d) => d.value * (DURATION_MS / 1000));

    // The whole point of this slide: a dog-stolen top leaves the risk set
    // without moving the curve, so every fall after it is conditional on a
    // smaller denominator than the naive one-row-per-observation count.
    const steps = kaplanMeierSteps(
      data.map((d, i) => ({ time: seconds[i], censored: d.censored }))
    );
    const falls = steps
      .map((step, i) => ({ ...step, row: i }))
      .filter((step) => !step.censored)
      .slice(0, 3);

    const x = d3
      .scaleLinear()
      .domain([0, DURATION_MS / 1000])
      .range([TRACK_LEFT, TRACK_LEFT + TRACK_WIDTH]);
    const yPercent = d3.scaleLinear().domain([1, 0]).range([0, N * ROW_HEIGHT]);

    // Lifted well clear of the survival line, same as the uncensored slide.
    const ANNOTATION_LIFT = 42;
    const annotations = falls.map((step) => ({
      html: fractionHtml(step.atRisk - 1, step.atRisk),
      x: x(step.time) + 16,
      y: step.row * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT / 2 - ANNOTATION_LIFT,
    }));
    // Every censoring before the third fall gets called out as the thing
    // that isn't happening: no term, no step in the curve.
    const lastAnnotatedRow = falls.length ? falls[falls.length - 1].row : N - 1;
    const censoredNotes = steps
      .map((step, i) => ({ ...step, row: i }))
      .filter((step) => step.censored && step.row < lastAnnotatedRow)
      .map((step) => ({
        x: x(step.time) + 16 + MARKER_SIZE,
        y: step.row * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT / 2 - ANNOTATION_LIFT + 12,
      }));

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        A stolen top never updates the curve
      </h2>
      <div style="display:flex; align-items:center; justify-content:center; gap:3rem; flex-wrap:wrap;">
        <div style="position:relative; width:${TRACK_TOTAL_WIDTH}px; max-width:100%; height:${rowsHeight + AXIS_HEIGHT}px;">
          <svg id="chart" width="${TRACK_TOTAL_WIDTH}" height="${rowsHeight + AXIS_HEIGHT}"></svg>
          ${annotations
            .map(
              (a) => `
            <div class="accent-yellow" style="position:absolute; left:${a.x}px; top:${a.y}px; font-size:1.1rem;">
              ${a.html}
            </div>`
            )
            .join("")}
          ${censoredNotes
            .map(
              (c) => `
            <div class="accent-purple" style="position:absolute; left:${c.x}px; top:${c.y}px; font-family:var(--font-mono); font-size:0.85rem; opacity:0.85;">
              no update
            </div>`
            )
            .join("")}
        </div>
        <div style="position:relative;">
          <div style="display:grid; grid-template-columns: repeat(7, auto); align-items:center; column-gap:0.7rem; row-gap:1.4rem; font-size:1.7rem;">
            ${gridItem(fractionHtml(falls[1].atRisk - 1, falls[1].atRisk), 1, 3)}
            ${gridItem("&times;", 1, 4)}
            ${gridItem(fractionHtml(falls[0].atRisk - 1, falls[0].atRisk), 1, 5)}
            ${gridItem("=", 1, 6)}
            ${gridItem(`<span class="accent-yellow">${percentHtml(falls[1].after)}</span>`, 1, 7)}

            ${gridItem(fractionHtml(falls[2].atRisk - 1, falls[2].atRisk), 2, 1)}
            ${gridItem("&times;", 2, 2)}
            ${gridItem(fractionHtml(falls[1].atRisk - 1, falls[1].atRisk), 2, 3)}
            ${gridItem("&times;", 2, 4)}
            ${gridItem(fractionHtml(falls[0].atRisk - 1, falls[0].atRisk), 2, 5)}
            ${gridItem("=", 2, 6)}
            ${gridItem(`<span class="accent-yellow">${percentHtml(falls[2].after)}</span>`, 2, 7)}
          </div>
          <p style="max-width:26rem; margin-top:1.8rem; font-size:0.95rem; opacity:0.75;">
            A paw print never becomes a term in the product — it only shrinks
            the denominator of every fall that comes after it.
          </p>
          <div id="equationCover" style="position:absolute; inset: -0.6rem; background: var(--bg-raised); border-radius: 10px; cursor:pointer; transition: opacity 300ms ease;"></div>
        </div>
      </div>
    `;

    const equationCover = stage.querySelector("#equationCover");
    equationCover.addEventListener("click", () => {
      equationCover.style.opacity = "0";
      setTimeout(() => equationCover.remove(), 300);
    });

    const styles = getComputedStyle(document.documentElement);
    const red = styles.getPropertyValue("--accent-red").trim();
    const purple = styles.getPropertyValue("--accent-purple").trim();

    const svg = d3.select(stage.querySelector("#chart"));

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", TRACK_LEFT)
      .attr("y", (_, i) => i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT)
      .attr("width", (d) => x(d.value * (DURATION_MS / 1000)) - TRACK_LEFT)
      .attr("height", BAR_HEIGHT)
      .attr("rx", 4)
      .attr("fill", (d) => (d.censored ? purple : red));

    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${rowsHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}s`));

    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${TRACK_LEFT},0)`)
      .call(
        d3
          .axisLeft(yPercent)
          .tickValues(d3.range(0, 1.001, 0.1))
          .tickFormat(d3.format(".0%"))
      );

    const survivalSteps = [
      [0, 1],
      ...steps.map((step) => [step.time, step.after]),
      [DURATION_MS / 1000, steps[steps.length - 1].after],
    ];
    const survivalLine = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => yPercent(d[1]))
      .curve(d3.curveStepAfter);

    svg
      .append("path")
      .datum(survivalSteps)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "3 6")
      .attr("d", survivalLine);

    // Small persistent paw markers next to each censored bar's end.
    const chartHost = stage.querySelector("svg#chart").parentElement;
    const pawMarkers = [];
    data.forEach((d, i) => {
      if (!d.censored) return;
      const paw = createPawPrint({ size: MARKER_SIZE, disc: false });
      paw.el.style.position = "absolute";
      paw.el.style.left = `${x(d.value * (DURATION_MS / 1000)) + 6}px`;
      paw.el.style.top = `${i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT / 2 - MARKER_SIZE / 2}px`;
      chartHost.appendChild(paw.el);
      pawMarkers.push(paw);
    });

    return () => pawMarkers.forEach((paw) => paw.destroy());
  },
};
