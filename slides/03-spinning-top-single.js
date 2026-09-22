// Hand-rolled canvas stand-in for a single spinning top spin-and-fall
// animation. Intentionally simple — the plan is to swap this canvas
// rendering for a nicer generated artefact later without touching the
// slide's mount/cleanup contract.
//
// --- SCRIPT ANNOTATION [slide:spinning-top-single] ---
// A simple animation of a spinning top, silver, sleek, and rotating
// occasionally, jiggling, and then eventually falling on its side and
// stopping moving. (A nicer artefact for this will be generated and
// dropped in later — this is a stand-in.)
// --- END SCRIPT ANNOTATION ---

const WIDTH = 820;
const HEIGHT = 360;
const FALL_DELAY_MS = 3500;

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
  id: "spinning-top-single",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        A simpler problem first: spinning tops
      </h2>
      <div class="viz-panel">
        <canvas id="topCanvas" width="${WIDTH}" height="${HEIGHT}"
          style="max-width:100%; height:auto; background: var(--bg-raised); border-radius: 12px;"></canvas>
      </div>
    `;

    const canvas = stage.querySelector("#topCanvas");
    const ctx = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const dim = styles.getPropertyValue("--fg-dim").trim();

    const start = performance.now();
    let fallen = false;
    let rafId;

    function render(t) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const elapsed = t - start;
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;

      if (!fallen && elapsed > FALL_DELAY_MS) fallen = true;

      let tilt = 0;
      if (fallen) {
        const fallElapsed = elapsed - FALL_DELAY_MS;
        tilt = Math.min(1, fallElapsed / 500) * (Math.PI / 2);
      }

      const jiggleX = fallen ? 0 : Math.sin(elapsed / 90) * 2;
      drawTop(ctx, cx + jiggleX, cy, elapsed / 30, tilt, blue);

      ctx.fillStyle = dim;
      ctx.font = "14px var(--font-sans)";
      ctx.textAlign = "center";
      ctx.fillText(
        fallen ? "It fell over." : "Watching a single spinning top...",
        cx,
        cy + 60
      );
      ctx.textAlign = "left";

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(rafId);
  },
};
