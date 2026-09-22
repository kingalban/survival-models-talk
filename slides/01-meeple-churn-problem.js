// Hand-rolled canvas animation — a continuous population of little
// meeple-shaped users subscribing, then eventually dropping into a
// "churned" band over time. No chart/data-binding here, so no D3.
//
// --- SCRIPT ANNOTATION [slide:meeple-churn-problem] ---
// A slide showing animations of Of little meeple-shaped users subscribing
// to a service and then eventually leaving the service and going into a
// churn-out area over time
// --- END SCRIPT ANNOTATION ---

const WIDTH = 860;
const HEIGHT = 460;
const CHURN_LINE_Y = 260;
const SPAWN_INTERVAL_MS = 500;

function drawMeeple(ctx, x, y, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  // head
  ctx.beginPath();
  ctx.arc(0, -14, 6, 0, Math.PI * 2);
  ctx.fill();
  // body (rounded trapezoid)
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.quadraticCurveTo(-9, -8, 0, -8);
  ctx.quadraticCurveTo(9, -8, 8, 8);
  ctx.quadraticCurveTo(8, 14, 0, 14);
  ctx.quadraticCurveTo(-8, 14, -8, 8);
  ctx.fill();
  ctx.restore();
}

export default {
  id: "meeple-churn-problem",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        What does your customer retention actually look like?
      </h2>
      <div class="viz-panel">
        <canvas id="churnCanvas" width="${WIDTH}" height="${HEIGHT}"
          style="max-width:100%; height:auto; background: var(--bg-raised); border-radius: 12px;"></canvas>
      </div>
      <div style="display:flex; gap:2.5rem; font-family: var(--font-mono); margin-top:0.5rem;">
        <span class="accent-blue">Subscribed: <span id="subCount">0</span></span>
        <span class="accent-red">Churned: <span id="churnCount">0</span></span>
      </div>
    `;

    const canvas = stage.querySelector("#churnCanvas");
    const ctx = canvas.getContext("2d");
    const subCountEl = stage.querySelector("#subCount");
    const churnCountEl = stage.querySelector("#churnCount");

    const styles = getComputedStyle(document.documentElement);
    const blue = styles.getPropertyValue("--accent-blue").trim();
    const red = styles.getPropertyValue("--accent-red").trim();
    const dim = styles.getPropertyValue("--fg-dim").trim();

    let meeples = [];
    let nextId = 0;
    let churnedCount = 0;
    let lastSpawn = 0;
    let rafId;

    function spawn(t) {
      meeples.push({
        id: nextId++,
        x: 40 + Math.random() * (WIDTH - 80),
        bobPhase: Math.random() * Math.PI * 2,
        subscribedAt: t,
        // subscription length: mostly a few seconds, a long tail of "sticky" ones
        lifespan: 1500 + Math.random() * Math.random() * 9000,
        state: "subscribed",
        fallY: 90,
        churnedX: null,
      });
    }

    function render(t) {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // churn line + label
      ctx.strokeStyle = dim;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, CHURN_LINE_Y);
      ctx.lineTo(WIDTH, CHURN_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = dim;
      ctx.font = "13px var(--font-sans)";
      ctx.fillText("still subscribed", 10, CHURN_LINE_Y - 10);
      ctx.fillText("churned", 10, CHURN_LINE_Y + 20);

      if (t - lastSpawn > SPAWN_INTERVAL_MS && meeples.length < 90) {
        spawn(t);
        lastSpawn = t;
      }

      let subscribedShown = 0;
      meeples.forEach((m) => {
        if (m.state === "subscribed") {
          const age = t - m.subscribedAt;
          if (age > m.lifespan) {
            m.state = "falling";
            m.fallY = 90;
            m.churnedX = m.x + (Math.random() - 0.5) * 30;
          } else {
            const y = 90 + Math.sin(t / 400 + m.bobPhase) * 8;
            drawMeeple(ctx, m.x, y, blue);
            subscribedShown++;
          }
        } else if (m.state === "falling") {
          m.fallY += 6;
          const targetY = CHURN_LINE_Y + 40 + ((m.id * 37) % 140);
          drawMeeple(ctx, m.churnedX, m.fallY, red, 0.9);
          if (m.fallY >= targetY) {
            m.state = "churned";
            m.settledY = targetY;
            churnedCount++;
          }
        } else {
          drawMeeple(ctx, m.churnedX, m.settledY, red, 0.9);
        }
      });

      subCountEl.textContent = subscribedShown;
      churnCountEl.textContent = churnedCount;

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(rafId);
  },
};
