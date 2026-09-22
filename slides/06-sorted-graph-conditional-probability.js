// --- SCRIPT ANNOTATION [slide:sorted-graph-conditional-probability] ---
// The same finished graph from the previous slide — sorted bars, survival
// step line, percentage axis. Three annotations sit to the right of the
// first three bars: "9/10", "8/10", "7/10", each a proper stacked fraction
// (a horizontal rule between numerator and denominator, not a slash),
// positioned clear of the dotted survival line rather than overlapping it.
// To the right of the graph, two stacked equations, both written in the
// same ascending order (each term's denominator becomes the next term's
// numerator) for visual symmetry: 8/9 × 9/10 = 8/10, and below it
// 7/8 × 8/9 × 9/10 = 7/10 — the second the product of three fractions,
// extending the same conditional-probability chain one event further. The
// equations start hidden under a plain greyed-out panel; clicking it
// fades the panel away.
// --- END SCRIPT ANNOTATION ---
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
const MIN_FALL_FRAC = 0.05;
const MAX_FALL_FRAC = 0.95;

function sampleBoundedFallFrac() {
  return MIN_FALL_FRAC + Math.random() * (MAX_FALL_FRAC - MIN_FALL_FRAC);
}

function fractionHtml(num, den, extraClass = "") {
  return `<span class="fraction ${extraClass}"><span class="num">${num}</span><span class="bar"></span><span class="den">${den}</span></span>`;
}

// Placed on an explicit grid cell so the "=" in a two-term and a
// three-term equation land in the same column regardless of how many
// factors come before it.
function gridItem(html, row, col) {
  return `<span style="grid-row:${row}; grid-column:${col}; display:flex; align-items:center; justify-content:center;">${html}</span>`;
}

export default {
  id: "sorted-graph-conditional-probability",
  mount(stage) {
    const rowsHeight = N * ROW_HEIGHT + TOP_SIZE;

    const fallFracs = Array.from({ length: N }, sampleBoundedFallFrac).sort((a, b) => a - b);
    const seconds = fallFracs.map((f) => f * (DURATION_MS / 1000));

    const x = d3
      .scaleLinear()
      .domain([0, DURATION_MS / 1000])
      .range([TRACK_LEFT, TRACK_LEFT + TRACK_WIDTH]);
    const yPercent = d3.scaleLinear().domain([1, 0]).range([0, N * ROW_HEIGHT]);

    // Lifted well clear of the survival line: right after bar i, the line
    // has already dropped to (i+1)*ROW_HEIGHT, only 12px below the bar's
    // own vertical center — nowhere near enough room for a stacked
    // fraction, so the annotation sits well above the bar instead.
    const ANNOTATION_LIFT = 42;
    const annotations = [
      { num: 9, den: 10 },
      { num: 8, den: 10 },
      { num: 7, den: 10 },
    ].map(({ num, den }, i) => ({
      num,
      den,
      x: x(seconds[i]) + 16,
      y: i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT / 2 - ANNOTATION_LIFT,
    }));

    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem); margin-bottom: 1.5rem;">
        Empirical Survival Function
      </h2>
      <div style="display:flex; align-items:center; justify-content:center; gap:3rem; flex-wrap:wrap;">
        <div style="position:relative; width:${TRACK_TOTAL_WIDTH}px; max-width:100%; height:${rowsHeight + AXIS_HEIGHT}px;">
          <svg id="chart" width="${TRACK_TOTAL_WIDTH}" height="${rowsHeight + AXIS_HEIGHT}"></svg>
          ${annotations
            .map(
              (a) => `
            <div class="accent-yellow" style="position:absolute; left:${a.x}px; top:${a.y}px; font-size:1.1rem;">
              ${fractionHtml(a.num, a.den)}
            </div>`
            )
            .join("")}
        </div>
        <div style="position:relative;">
          <div style="display:grid; grid-template-columns: repeat(7, auto); align-items:center; column-gap:0.7rem; row-gap:1.4rem; font-size:1.7rem;">
            ${gridItem(fractionHtml(8, 9), 1, 3)}
            ${gridItem("&times;", 1, 4)}
            ${gridItem(fractionHtml(9, 10), 1, 5)}
            ${gridItem("=", 1, 6)}
            ${gridItem(fractionHtml(8, 10, "accent-yellow"), 1, 7)}

            ${gridItem(fractionHtml(7, 8), 2, 1)}
            ${gridItem("&times;", 2, 2)}
            ${gridItem(fractionHtml(8, 9), 2, 3)}
            ${gridItem("&times;", 2, 4)}
            ${gridItem(fractionHtml(9, 10), 2, 5)}
            ${gridItem("=", 2, 6)}
            ${gridItem(fractionHtml(7, 10, "accent-yellow"), 2, 7)}
          </div>
          <div id="equationCover" style="position:absolute; inset: -0.6rem; background: var(--bg-raised); border-radius: 10px; cursor:pointer; transition: opacity 300ms ease;"></div>
        </div>
      </div>
    `;

    const equationCover = stage.querySelector("#equationCover");
    equationCover.addEventListener("click", () => {
      equationCover.style.opacity = "0";
      setTimeout(() => equationCover.remove(), 300);
    });

    const svg = d3.select(stage.querySelector("#chart"));

    svg
      .selectAll("rect")
      .data(seconds)
      .join("rect")
      .attr("x", TRACK_LEFT)
      .attr("y", (_, i) => i * ROW_HEIGHT + TOP_SIZE - BAR_HEIGHT)
      .attr("width", (d) => x(d) - TRACK_LEFT)
      .attr("height", BAR_HEIGHT)
      .attr("rx", 4)
      .attr("fill", "var(--accent-red)");

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
      [0, 0],
      ...seconds.map((t, i) => [t, (i + 1) * ROW_HEIGHT]),
      [DURATION_MS / 1000, N * ROW_HEIGHT],
    ];
    const survivalLine = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => d[1])
      .curve(d3.curveStepAfter);

    svg
      .append("path")
      .datum(survivalSteps)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "3 6")
      .attr("d", survivalLine);
  },
};
