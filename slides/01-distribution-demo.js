// Demo slide: D3 handles the scales/axes/data-binding scaffolding for a
// standard statistical chart (an interactive exponential PDF). Bespoke,
// non-standard animations belong in hand-rolled slides instead — see
// 00-title.js for that pattern.
//
// --- SCRIPT ANNOTATION (auto-synced from script.md) ---
// Interactive chart of the exponential PDF f(x) = λe^(-λx) over x in [0,6],
// with a slider for λ from 0.2 to 3. Curve redraws live as the slider moves.
// Draw the curve in accent-blue.
// --- END SCRIPT ANNOTATION ---
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const WIDTH = 720;
const HEIGHT = 420;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

function exponentialPdf(x, rate) {
  return rate * Math.exp(-rate * x);
}

export default {
  id: "distribution-demo",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.4rem);">
        The Exponential Distribution
      </h2>
      <div class="viz-panel">
        <div>
          <svg id="chart" width="${WIDTH}" height="${HEIGHT}"></svg>
          <div style="display:flex; align-items:center; gap:0.8rem; margin-top:0.5rem; font-family: var(--font-mono); color: var(--fg-dim);">
            <label for="rate">rate (&lambda;)</label>
            <input id="rate" type="range" min="0.2" max="3" step="0.05" value="1" style="flex:1;" />
            <span id="rateVal" class="accent-yellow">1.00</span>
          </div>
        </div>
      </div>
    `;

    const svg = d3.select(stage.querySelector("#chart"));
    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear().domain([0, 6]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 3]).range([innerH, 0]);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6));

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));

    const line = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveBasis);

    const path = g
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "var(--accent-blue)")
      .attr("stroke-width", 3);

    function samples(rate) {
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const xi = (i / 120) * 6;
        points.push([xi, exponentialPdf(xi, rate)]);
      }
      return points;
    }

    function render(rate) {
      path.datum(samples(rate)).attr("d", line);
    }

    render(1);

    const slider = stage.querySelector("#rate");
    const rateVal = stage.querySelector("#rateVal");
    const onInput = () => {
      const rate = Number(slider.value);
      rateVal.textContent = rate.toFixed(2);
      render(rate);
    };
    slider.addEventListener("input", onInput);

    return () => {
      slider.removeEventListener("input", onInput);
    };
  },
};
