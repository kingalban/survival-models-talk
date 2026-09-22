// Fully hand-rolled canvas animation: a single spinning top, then (via an
// in-slide control, not the deck's own Next) a population of them racing
// rightward, each drawing a growing bar underneath as a preview of the
// survival-curve idea developed later in the talk.
//
// --- SCRIPT ANNOTATION [slide:spinning-top-population] ---
// A slide showing a single simple animation of a spinning top, silver,
// sleek, and rotating occasionally, jiggling, and then eventually falling
// on its side and stopping moving. Pressing Next shows the spinning top
// resetting, shrinking, and many more identical spinning tops starting
// next to it in a column.  Some of them end at a random time but not all.
// As they spin they progress to the right, drawing a bar along underneath
// them, which will later become a graph. Spinning tops that do not end
// within the time frame reach the right-hand side of the graph area and
// simply continue spinning there.  (paramaterised and resetable via ui
// buttons)
// --- END SCRIPT ANNOTATION ---

const WIDTH = 820;
const HEIGHT = 440;
const SINGLE_FALL_DELAY_MS = 3500;
const ROW_HEIGHT = 34;
const TRACK_LEFT = 60;
const TRACK_RIGHT = WIDTH - 40;
const POPULATION_DURATION_MS = 9000;
const SURVIVE_FRACTION = 0.3; // fraction that reach the edge still spinning

function drawTop(ctx, x, y, angle, tilt, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  // shadow/base line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 10);
  ctx.lineTo(9, 10);
  ctx.stroke();
  // body (cone), rotated by spin angle only in the vertical case
  ctx.rotate(angle * 0.05); // subtle wobble instead of full spin, reads better at small size
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
  id: "spinning-top-population",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        A simpler problem first: spinning tops
      </h2>
      <div class="viz-panel">
        <div>
          <canvas id="topCanvas" width="${WIDTH}" height="${HEIGHT}"
            style="max-width:100%; height:auto; background: var(--bg-raised); border-radius: 12px;"></canvas>
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:1rem; margin-top:0.6rem; font-family: var(--font-mono); color: var(--fg-dim); font-size: 0.85rem;">
            <button id="advanceBtn">Now imagine spinning many at once &rarr;</button>
            <label id="nWrap" style="display:none;">N <input id="nSlider" type="range" min="5" max="25" step="1" value="12" /></label>
            <button id="restartBtn" style="display:none;">Restart</button>
          </div>
        </div>
      </div>
    `;

    const canvas = stage.querySelector("#topCanvas");
    const ctx = canvas.getContext("2d");
    const advanceBtn = stage.querySelector("#advanceBtn");
    const restartBtn = stage.querySelector("#restartBtn");
    const nSlider = stage.querySelector("#nSlider");
    const nWrap = stage.querySelector("#nWrap");

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();
    const yellow = styles.getPropertyValue("--accent-yellow").trim();
    const dim = styles.getPropertyValue("--fg-dim").trim();

    let phase = "single";
    let rafId;
    let singleStart = performance.now();
    let singleFallen = false;
    let rows = [];
    let popStart = performance.now();

    function setupPopulation() {
      const n = Number(nSlider.value);
      rows = Array.from({ length: n }, (_, i) => {
        const survives = Math.random() < SURVIVE_FRACTION;
        return {
          y: 30 + i * ROW_HEIGHT,
          fallFrac: survives ? null : 0.15 + Math.random() * 0.8,
          fallen: false,
        };
      });
      popStart = performance.now();
    }

    function renderSingle(t) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const elapsed = t - singleStart;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;

      if (!singleFallen && elapsed > SINGLE_FALL_DELAY_MS) {
        singleFallen = true;
        advanceBtn.disabled = false;
      }

      let tilt = 0;
      if (singleFallen) {
        const fallElapsed = elapsed - SINGLE_FALL_DELAY_MS;
        tilt = Math.min(1, fallElapsed / 500) * (Math.PI / 2);
      }

      const jiggleX = singleFallen ? 0 : Math.sin(elapsed / 90) * 2;
      drawTop(ctx, cx + jiggleX, cy, elapsed / 30, tilt, blue);

      ctx.fillStyle = dim;
      ctx.font = "14px var(--font-sans)";
      ctx.textAlign = "center";
      ctx.fillText(
        singleFallen ? "It fell over." : "Watching a single spinning top...",
        cx,
        cy + 60
      );
      ctx.textAlign = "left";

      rafId = requestAnimationFrame(renderSingle);
    }

    function renderPopulation(t) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const p = Math.min(1, (t - popStart) / POPULATION_DURATION_MS);
      const trackW = TRACK_RIGHT - TRACK_LEFT;

      rows.forEach((row) => {
        const targetFrac = row.fallFrac === null ? 1 : row.fallFrac;
        const frac = Math.min(p, targetFrac);
        const x = TRACK_LEFT + frac * trackW;
        const stillGoing = frac < targetFrac || (row.fallFrac === null && p < 1);

        // bar underneath, growing left to right
        ctx.fillStyle = row.fallFrac === null ? yellow : frac >= targetFrac ? red : blue;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(TRACK_LEFT, row.y + 8, x - TRACK_LEFT, 6);
        ctx.globalAlpha = 1;

        const tilt = row.fallFrac !== null && frac >= targetFrac ? Math.PI / 2 : 0;
        const color = row.fallFrac === null ? yellow : frac >= targetFrac ? red : blue;
        drawTop(ctx, x, row.y, t / 30 + row.y, tilt, stillGoing ? color : color);
      });

      // observation window edge
      ctx.strokeStyle = dim;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(TRACK_RIGHT, 10);
      ctx.lineTo(TRACK_RIGHT, HEIGHT - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      rafId = requestAnimationFrame(renderPopulation);
    }

    advanceBtn.disabled = true;
    rafId = requestAnimationFrame(renderSingle);

    advanceBtn.addEventListener("click", () => {
      if (!singleFallen) return;
      phase = "population";
      cancelAnimationFrame(rafId);
      advanceBtn.style.display = "none";
      nWrap.style.display = "inline";
      restartBtn.style.display = "inline";
      setupPopulation();
      rafId = requestAnimationFrame(renderPopulation);
    });

    restartBtn.addEventListener("click", () => {
      cancelAnimationFrame(rafId);
      setupPopulation();
      rafId = requestAnimationFrame(renderPopulation);
    });

    nSlider.addEventListener("change", () => {
      cancelAnimationFrame(rafId);
      setupPopulation();
      rafId = requestAnimationFrame(renderPopulation);
    });

    return () => cancelAnimationFrame(rafId);
  },
};
