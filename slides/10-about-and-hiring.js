// --- SCRIPT ANNOTATION [slide:about-and-hiring] ---
// The closing "who I am, and who we're hiring" slide: a hiring panel on
// the left, built to the same width as the graph on the right so the two
// halves carry equal weight: a "we're hiring" label, the role being
// advertised in large type — Applied AI Software Engineer, "Softlandia,
// Finland. Full-stack role building production AI systems." — and under
// it a scannable QR code beside a written-out URL. The two point at
// different pages on purpose: the code goes straight to the role's own
// posting, softlandia.com/open-jobs/applied-ai-software-engineer, while
// the printed address stays the short softlandia.com/careers, which
// someone can actually type from the back of a room. The code is
// generated ahead of time and baked into the deck rather than fetched or
// rendered at runtime, so the standalone build still opens with no
// network. Along the bottom of the slide, in small type rather than as a
// title, the speaker's name sits to the left of their LinkedIn,
// linkedin.com/in/alban-king, which is a plain link rather than a second
// code. Alongside them, a small worked example on employee tenure,
// framed as the kind of statistic a large employer might publish rather
// than as anything about the speaker's own company — "Have you seen this
// type of statistic?" — with the data generated the same way as the
// customer lifetimes but with no recent-signup bump, since headcount is
// not surging the way a customer base is. A compact survival chart shows
// the naive curve in red and the Kaplan-Meier curve in blue against a
// dashed 50% line, with a tick dropped from each crossing, and
// underneath it the two numbers those crossings give: the naive median
// tenure, which counts everyone still employed as if they left today,
// and the Kaplan-Meier median, which does not.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { qrCodes } from "../js/qr-codes.js";
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
const LINKEDIN_URL = "https://www.linkedin.com/in/alban-king/";
const QR_SIZE = 124;
const N_EMPLOYEES = 150;
const TENURE_RATE = 0.4;

const formatYears = (t) => (t === null ? "not reached" : `${t.toFixed(1)}y`);

// The hiring panel is built to the same width as the chart beside it, so
// the two halves of the closing slide carry equal weight rather than the
// job ad reading as a footnote to the graph.
function hiringPanel(qrSvg) {
  return `
    <div style="width:${WIDTH}px; max-width:100%; text-align:left;">
      <div class="accent-blue" style="font-family:var(--font-mono); font-size:0.85rem; letter-spacing:0.12em; text-transform:uppercase;">
        we're hiring
      </div>
      <div class="accent-yellow" style="margin-top:0.5rem; font-size:1.8rem; font-weight:600; line-height:1.2;">
        Applied AI Software Engineer
      </div>
      <div style="margin-top:0.5rem; font-size:1.15rem; line-height:1.4;">
        Softlandia, Finland. Full-stack role building production AI systems.
      </div>
      <div style="display:flex; align-items:center; gap:1.1rem; margin-top:1.4rem;">
        <div style="width:${QR_SIZE}px; background:#fff; padding:7px; border-radius:8px; flex:none;">
          ${qrSvg}
        </div>
        <div style="font-family:var(--font-mono); font-size:1.15rem;">softlandia.com/careers</div>
      </div>
    </div>`;
}

export default {
  id: "about-and-hiring",
  mount(stage) {
    const rows = buildTenureDataset(N_EMPLOYEES, TENURE_RATE);
    const naiveSteps = naiveSurvivalSteps(rows, N_EMPLOYEES);
    const kmSteps = kaplanMeierSurvivalSteps(rows);
    const naiveMedian = naiveMedianTime(rows);
    const kmMedian = medianFromSteps(kmSteps);
    const stillHere = rows.filter((r) => !r.event).length;

    stage.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:3rem; flex-wrap:wrap;">
        ${hiringPanel(qrCodes.careers)}
        <div style="width:${WIDTH}px; max-width:100%; text-align:center;">
          <p style="margin:0 0 0.15rem; font-size:1.05rem;">
            Have you seen this type of statistic?
          </p>
          <p style="margin:0 0 0.4rem; font-family:var(--font-mono); font-size:0.8rem; color:var(--fg-dim);">
            median tenure at some large employer — ${N_EMPLOYEES} people, ${stillHere} still employed
          </p>
          <svg id="tenureChart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; justify-content:center; gap:2.4rem; margin-top:0.8rem;">
            <div>
              <div class="accent-red" style="font-family:var(--font-mono); font-size:1.8rem;">
                ${formatYears(naiveMedian)}
              </div>
              <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--fg-dim); max-width:11rem;">
                naive median — everyone still employed counted as if they left today
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
      <div style="display:flex; align-items:baseline; justify-content:center; gap:1rem; margin-top:1.8rem; font-family:var(--font-mono); font-size:0.95rem;">
        <span>Alban King</span>
        <span style="color:var(--fg-dim);">&middot;</span>
        <a href="${LINKEDIN_URL}" target="_blank" rel="noreferrer" class="accent-blue">
          linkedin.com/in/alban-king
        </a>
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
