// --- SCRIPT ANNOTATION [slide:about-and-hiring-placeholder] ---
// PARTIAL PLACEHOLDER — the speaker's own details (name, LinkedIn) and
// the embedded section about the company and its open positions are not
// designed yet; undecided: whether that section is a live careers page,
// a static list of roles, or a QR code the room can scan. What is built
// is the small graph that sits alongside them: employee tenure at the
// company, generated the same way as the customer data but with no
// recent-signup bump, since headcount is not surging the way the
// customer base is. A compact survival chart shows the naive curve in
// red and the Kaplan-Meier curve in blue against a dashed 50% line, with
// a tick dropped from each crossing, and underneath it the two numbers
// those crossings give: the naive median tenure, which counts everyone
// still employed as if they left today, and the Kaplan-Meier median,
// which does not.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { medianFromSteps } from "../js/kaplan-meier.js";
import {
  MAX_YEARS,
  buildTenureDataset,
  naiveMedianTime,
  naiveSurvivalSteps,
  kaplanMeierSurvivalSteps,
} from "../js/saas-dataset.js";

const WIDTH = 460;
const HEIGHT = 240;
const MARGIN = { top: 14, right: 16, bottom: 30, left: 40 };

// Employees, not customers: a shorter typical tenure than the customer
// base's, chosen so the Kaplan-Meier median reliably lands inside the
// five-year window (at rate 0.4 with n=150 it was defined in 4000 out of
// 4000 simulated runs — the slide still handles the miss, but a live talk
// should not be rolling dice on whether its punchline exists).
const N_EMPLOYEES = 150;
const TENURE_RATE = 0.4;

const formatYears = (t) => (t === null ? "not reached" : `${t.toFixed(1)}y`);

export default {
  id: "about-and-hiring-placeholder",
  mount(stage) {
    const rows = buildTenureDataset(N_EMPLOYEES, TENURE_RATE);
    const naiveSteps = naiveSurvivalSteps(rows, N_EMPLOYEES);
    const kmSteps = kaplanMeierSurvivalSteps(rows);
    const naiveMedian = naiveMedianTime(rows);
    const kmMedian = medianFromSteps(kmSteps);
    const stillHere = rows.filter((r) => !r.event).length;

    stage.innerHTML = `
      <h2 class="slide-title accent-yellow" style="font-size: clamp(1.4rem, 3vw, 2rem);">
        TODO: who I am, and who we're hiring
      </h2>
      <div style="display:flex; align-items:flex-start; justify-content:center; gap:3rem; flex-wrap:wrap;">
        <div style="max-width:24rem;">
          <p class="slide-body" style="color: var(--fg-dim); text-align:left;">
            Needs: the speaker's own details (name, LinkedIn), then an
            embedded section about the company and its open positions.
          </p>
          <p class="slide-body" style="color: var(--fg-dim); text-align:left;">
            Undecided: how the company section is embedded — a live careers
            page, a static list of roles, or a QR code the room can scan.
          </p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0 0 0.4rem; font-family:var(--font-mono); font-size:0.85rem; color:var(--fg-dim);">
            How long do people stay here? ${N_EMPLOYEES} employees, ${stillHere} still with us
          </p>
          <svg id="tenureChart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; justify-content:center; gap:2.4rem; margin-top:0.8rem;">
            <div>
              <div class="accent-red" style="font-family:var(--font-mono); font-size:1.8rem;">
                ${formatYears(naiveMedian)}
              </div>
              <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--fg-dim); max-width:11rem;">
                naive median — everyone still here counted as if they left today
              </div>
            </div>
            <div>
              <div class="accent-blue" style="font-family:var(--font-mono); font-size:1.8rem;">
                ${formatYears(kmMedian)}
              </div>
              <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--fg-dim); max-width:11rem;">
                Kaplan-Meier median — censoring handled properly
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const svg = d3.select(stage.querySelector("#tenureChart"));
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
      .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format(".0%")));

    // The 50% line is what both numbers are read off, so it is drawn
    // first and the two curves cross it in plain sight.
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", y(0.5))
      .attr("y2", y(0.5))
      .attr("stroke", "var(--fg-dim)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 4");

    const step = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveStepAfter);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-red)")
      .attr("stroke-width", 2.5)
      .datum(naiveSteps)
      .attr("d", step);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-blue)")
      .attr("stroke-width", 2.5)
      .datum(kmSteps)
      .attr("d", step);

    // A tick dropped from each crossing to the axis, so the two numbers
    // underneath are visibly the two places the curves cut 50%.
    [
      { t: naiveMedian, color: "var(--accent-red)" },
      { t: kmMedian, color: "var(--accent-blue)" },
    ].forEach(({ t, color }) => {
      if (t === null) return;
      g.append("line")
        .attr("x1", x(t))
        .attr("x2", x(t))
        .attr("y1", y(0.5))
        .attr("y2", innerH)
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "2 3");
    });

    return () => {};
  },
};
