// Hand-rolled canvas animation: the same population idea as the previous
// slide, now with a growing bar under each top — the precursor to turning
// this into an actual survival graph in a later slide.
//
// --- SCRIPT ANNOTATION [slide:spinning-top-population-graph] ---
// The same group of spinning tops as the previous slide, but now as they
// spin they progress to the right, drawing a bar along underneath them,
// which becomes a graph. Spinning tops that do not fall within the time
// frame reach the right-hand side of the graph area and simply continue
// spinning there. (parameterised and resettable via UI buttons)
// --- END SCRIPT ANNOTATION ---

const WIDTH = 820;
const HEIGHT = 440;
const ROW_HEIGHT = 34;
const TRACK_LEFT = 60;
const TRACK_RIGHT = WIDTH - 40;
const DURATION_MS = 9000;
const SURVIVE_FRACTION = 0.3; // fraction that reach the edge still spinning

function drawTop(ctx, x, y, angle, tilt, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 10);
  ctx.lineTo(9, 10);
  ctx.stroke();
  ctx.rotate(angle * 0.05);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default {
  id: "spinning-top-population-graph",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        Watching them draw their own graph
      </h2>
      <div class="viz-panel">
        <div>
          <canvas id="topCanvas" width="${WIDTH}" height="${HEIGHT}"
            style="max-width:100%; height:auto; background: var(--bg-raised); border-radius: 12px;"></canvas>
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-top:0.6rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">
            <label>N <input id="nSlider" type="range" min="5" max="25" step="1" value="12" /></label>
            <button id="restartBtn">Restart</button>
          </div>
        </div>
      </div>
    `;

    const canvas = stage.querySelector("#topCanvas");
    const ctx = canvas.getContext("2d");
    const nSlider = stage.querySelector("#nSlider");
    const restartBtn = stage.querySelector("#restartBtn");

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();
    const yellow = styles.getPropertyValue("--accent-yellow").trim();
    const dim = styles.getPropertyValue("--fg-dim").trim();

    let rows = [];
    let start = performance.now();
    let rafId;

    function setup() {
      const n = Number(nSlider.value);
      rows = Array.from({ length: n }, (_, i) => {
        const survives = Math.random() < SURVIVE_FRACTION;
        return {
          y: 30 + i * ROW_HEIGHT,
          fallFrac: survives ? null : 0.15 + Math.random() * 0.8,
        };
      });
      start = performance.now();
    }

    function render(t) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const p = Math.min(1, (t - start) / DURATION_MS);
      const trackW = TRACK_RIGHT - TRACK_LEFT;

      rows.forEach((row) => {
        const targetFrac = row.fallFrac === null ? 1 : row.fallFrac;
        const frac = Math.min(p, targetFrac);
        const x = TRACK_LEFT + frac * trackW;
        const color = row.fallFrac === null ? yellow : frac >= targetFrac ? red : blue;

        // bar underneath, growing left to right
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(TRACK_LEFT, row.y + 8, x - TRACK_LEFT, 6);
        ctx.globalAlpha = 1;

        const tilt = row.fallFrac !== null && frac >= targetFrac ? Math.PI / 2 : 0;
        drawTop(ctx, x, row.y, t / 30 + row.y, tilt, color);
      });

      ctx.strokeStyle = dim;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(TRACK_RIGHT, 10);
      ctx.lineTo(TRACK_RIGHT, HEIGHT - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      rafId = requestAnimationFrame(render);
    }

    setup();
    rafId = requestAnimationFrame(render);

    restartBtn.addEventListener("click", setup);
    nSlider.addEventListener("change", setup);

    return () => cancelAnimationFrame(rafId);
  },
};
