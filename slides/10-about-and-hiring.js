// --- SCRIPT ANNOTATION [slide:about-and-hiring] ---
// The closing "who I am, and who we're hiring" slide: the speaker's name
// centred at the top of the left-hand column, and under it a scannable
// QR code for softlandia.com/careers shown next to that written-out URL,
// labelled "we're hiring" and naming the role being advertised: Applied
// AI Software Engineer, "Softlandia, Finland. Full-stack role building
// production AI systems." The code is generated ahead of time and baked
// into the deck rather than fetched or rendered at runtime, so the
// standalone build still opens with no network. The speaker's LinkedIn,
// linkedin.com/in/alban-king, runs along the bottom of the slide as a
// plain link rather than a second code. Alongside them, a small worked
// example on employee tenure, framed as the kind of statistic a large
// employer might publish rather than as anything about the speaker's own
// company — "Have you seen this type of statistic?" — with the data
// generated the same way as the customer lifetimes but with no
// recent-signup bump, since headcount is not surging the way a customer
// base is. A compact survival chart shows the naive curve in red and the
// Kaplan-Meier curve in blue against a dashed 50% line, with a tick
// dropped from each crossing, and underneath it the two numbers those
// crossings give: the naive median tenure, which counts everyone still
// employed as if they left today, and the Kaplan-Meier median, which
// does not.
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
const QR_SIZE = 108;
const N_EMPLOYEES = 150;
const TENURE_RATE = 0.4;

const formatYears = (t) => (t === null ? "not reached" : `${t.toFixed(1)}y`);

// A scannable code over its own URL: the room can scan it, and anyone
// watching a recording can still read and type the address.
function card(url, label, qrSvg, extraHtml = "") {
  return `
    <div style="display:flex; align-items:center; gap:0.9rem;">
      <div style="width:${QR_SIZE}px; background:#fff; padding:6px; border-radius:8px; flex:none;">
        ${qrSvg}
      </div>
      <div style="text-align:left;">
        <div class="accent-blue" style="font-family:var(--font-mono); font-size:0.75rem; letter-spacing:0.08em; text-transform:uppercase;">
          ${label}
        </div>
        <div style="font-family:var(--font-mono); font-size:1rem;">${url}</div>
        ${extraHtml}
      </div>
    </div>`;
}

// The role currently being advertised, spelled out so the slide says what
// the job is without anyone having to scan the code first.
const ROLE_HTML = `
  <div style="margin-top:0.9rem; max-width:22rem;">
    <div class="accent-yellow" style="font-size:1.5rem; font-weight:600; line-height:1.2;">
      Applied AI Software Engineer
    </div>
    <div style="margin-top:0.35rem; font-size:1.05rem; line-height:1.35; color:var(--fg);">
      Softlandia, Finland. Full-stack role building production AI systems.
    </div>
  </div>`;

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
      <div style="display:flex; align-items:flex-start; justify-content:center; gap:2.6rem; flex-wrap:wrap;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:1.4rem;">
          <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin:0;">
            Alban King
          </h2>
          ${card("softlandia.com/careers", "we're hiring", qrCodes.careers, ROLE_HTML)}
        </div>
        <div style="text-align:center;">
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
      <div style="margin-top:1.8rem; text-align:center;">
        <a href="${LINKEDIN_URL}" target="_blank" rel="noreferrer"
           class="accent-blue" style="font-family:var(--font-mono); font-size:0.95rem;">
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
