// A single spinning top, as a reusable object.
//
//   import { createSpinningTop } from "../artefacts/spinning-top.js";
//
//   const top = createSpinningTop({ size: 260 });
//   container.appendChild(top.el);
//   top.fall();     // wobble, lose the spin, settle against the table
//   top.reset();    // back to a steady precession
//   top.destroy();  // stop animating, drop the element
//
// It renders itself and animates itself; the page only says when to fall
// and when to reset. Instances share one animation frame loop, so a slide
// can hold a whole population of them without stacking up rAF callbacks.
//
// Shape and motion are the ones settled on in the design exploration: the
// "handled button" profile — a squat, wide, polished-chrome body with a
// tall slender grip — under a precession model that ends with the top
// resting on its tip and its side, at the angle its own profile dictates.

/* ---------------------------------------------------------------- shape */

// The profile is generated rather than plotted, so the shape stays legible
// and tweakable:
//   H     overall height
//   R     belly radius, at height B (as a fraction of H)
//   low   tip-to-belly curve: 1 is a straight cone, above 1 draws the sides
//         in for a sharper point, below 1 bellies out into a bowl
//   up    belly-to-neck curve: above 1 holds the width and then breaks into
//         a shoulder, below 1 falls away immediately into a dome
//   neck  neck radius as a fraction of R
//   grip  the handle: `len` of the total height long, closing to `taper` of
//         the neck radius at the top
const DESIGN = {
  H: 108,
  R: 38,
  B: 0.19,
  low: 0.7,
  up: 1.3,
  neck: 0.16,
  grip: { len: 0.34, taper: 0.85 },
};

// The head, as a fraction of the radius it sits on, over the height of the
// head section, which starts at HEAD_FRAC of the way up.
const HEAD_FRAC = 0.86;
const HEAD = [[0, 1], [0.45, 1.3], [0.85, 1.35], [1, 1.15]];

const CHROME = {
  edge: "#2b3038",
  dark: "#5f6771",
  mid: "#b9c2cc",
  spec: "#ffffff",
  cut: "#454d57",
  lip: "#eef3f8",
};

const SCALE = 1.3;
const VB_W = 272;
const VB_H = 296;
const GROUND_Y = 204;   // the table line, in viewBox units
const CAM = 0.3;        // rim ellipse ry/rx with the top standing upright
const CAM_ANGLE = Math.asin(CAM);

function makeProfile({ H, R, B, low, up, neck, grip }) {
  const bellyY = H * B;
  const neckY = H * HEAD_FRAC;
  const bodyTop = neckY - (grip ? H * grip.len : 0);
  const neckR = R * neck;
  const pts = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    pts.push([bellyY * t, R * Math.pow(t, low)]);
  }
  for (let i = 1; i <= 9; i++) {
    const t = i / 9;
    pts.push([bellyY + (bodyTop - bellyY) * t, R + (neckR - R) * Math.pow(t, up)]);
  }
  if (grip) {
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      pts.push([bodyTop + (neckY - bodyTop) * t, neckR * (1 + (grip.taper - 1) * t)]);
    }
  }
  const topR = neckR * (grip ? grip.taper : 1);
  for (const [t, f] of HEAD.slice(1)) {
    pts.push([neckY + (H - neckY) * t, topR * f]);
  }
  const gap = bodyTop - bellyY;
  return {
    profile: pts.map(([y, r]) => [y * SCALE, r * SCALE]),
    grooves: [bellyY + gap * 0.18, bellyY + gap * 0.36].map((y) => y * SCALE),
  };
}

// Catmull-Rom through the points, emitted as cubic beziers.
function spline(pts, withMove) {
  let d = withMove ? `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}` : "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function silhouette(profile) {
  const right = profile.map(([y, r]) => [r, -y]);
  const left = profile.slice().reverse().map(([y, r]) => [-r, -y]);
  return (
    spline(right, true) +
    ` L ${left[0][0].toFixed(2)} ${left[0][1].toFixed(2)}` +
    spline(left, false) +
    " Z"
  );
}

function bellyOf(profile) {
  let best = profile[0];
  for (const p of profile) if (p[1] > best[1]) best = p;
  return { y: best[0], r: best[1] };
}

function radiusAt(profile, y) {
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    if (y >= a[0] && y <= b[0]) {
      const t = (y - a[0]) / (b[0] - a[0] || 1);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  return profile[profile.length - 1][1];
}

// Where a top that has stopped spinning comes to rest. Lean the axis by
// theta about the tip and a body point (r, y) reaches the table when
// tan(theta) = y / r, so the angle it settles at — tip and side both down —
// is the smallest y/r on the profile. Floored a little, because a profile
// sampled at 20 points can put the minimum arbitrarily close to the tip.
function restTiltOf(profile) {
  let min = Math.PI / 2;
  for (const [y, r] of profile) if (r > 0.5) min = Math.min(min, Math.atan2(y, r));
  return Math.max(0.44, min);
}

const { profile: PROFILE, grooves: GROOVES } = makeProfile(DESIGN);
const BODY_PATH = silhouette(PROFILE);
const BELLY = bellyOf(PROFILE);
const HEAD_PT = PROFILE[PROFILE.length - 1];
const REST_TILT = restTiltOf(PROFILE);
const ASPECT = VB_H / VB_W;

/* ---------------------------------------------------------------- markup */

let uid = 0;

function markup(id, palette) {
  const m = palette;
  const u = (n) => `${n}-st${id}`;
  return `
  <svg viewBox="0 0 ${VB_W} ${VB_H}" aria-hidden="true" focusable="false"
       style="width:100%;height:100%;display:block;overflow:visible">
    <defs>
      <linearGradient id="${u("body")}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="${m.edge}" />
        <stop offset="28%"  stop-color="${m.spec}" />
        <stop offset="52%"  stop-color="${m.mid}" />
        <stop offset="100%" stop-color="${m.dark}" />
      </linearGradient>
      <radialGradient id="${u("pool")}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%"   stop-color="#cbb894" stop-opacity="0.14" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="${u("shadow")}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%"   stop-color="#000" stop-opacity="0.6" />
        <stop offset="60%"  stop-color="#000" stop-opacity="0.22" />
        <stop offset="100%" stop-color="#000" stop-opacity="0" />
      </radialGradient>
      <clipPath id="${u("clip")}"><path d="${BODY_PATH}" /></clipPath>
    </defs>

    <g class="st-table">
      <ellipse cx="${VB_W / 2}" cy="${GROUND_Y}" rx="128" ry="28" fill="url(#${u("pool")})" />
      <line x1="${VB_W / 2 - 124}" y1="${GROUND_Y}" x2="${VB_W / 2 + 124}" y2="${GROUND_Y}"
            stroke="#4c5158" stroke-width="1.4" stroke-linecap="round" opacity="0.7" />
    </g>
    <ellipse class="st-cast" cx="${VB_W / 2}" cy="${GROUND_Y + 1}" rx="26" ry="7"
             fill="url(#${u("shadow")})" />

    <g class="st-top">
      <path d="${BODY_PATH}" fill="url(#${u("body")})" />
      <g clip-path="url(#${u("clip")})">
        ${GROOVES.map(
          () => `
        <path class="st-cut" fill="none" stroke="${m.cut}" stroke-width="2" stroke-linecap="round" />
        <path class="st-lip" fill="none" stroke="${m.lip}" stroke-width="1" stroke-linecap="round"
              opacity="0.75" />`
        ).join("")}
      </g>
      <ellipse class="st-head" cx="0" cy="${-HEAD_PT[0]}" rx="${HEAD_PT[1]}"
               ry="${HEAD_PT[1] * CAM}" fill="${m.mid}" />
    </g>
  </svg>`;
}

/* ---------------------------------------------------------------- motion */

const IDLE_TILT = 0.055;   // ~3 degrees of lean while it is happily spinning

// One frame loop for every top on the page.
const live = new Set();
let rafId = null;
let last = 0;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  for (const top of live) {
    top._step(dt);
    top._render();
  }
  rafId = live.size ? requestAnimationFrame(tick) : null;
}

function join(top) {
  live.add(top);
  if (rafId === null) {
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }
}

function leave(top) {
  live.delete(top);
  if (!live.size && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

class SpinningTop {
  constructor(options = {}) {
    const {
      size = 240,
      seed = Math.random(),
      palette = CHROME,
      table = true,
      wobbleDuration = 2.1,
      settleDuration = 1.25,
      onRest = null,
      className = "",
    } = options;

    this.seed = seed;
    this.wobbleDuration = wobbleDuration;
    this.settleDuration = settleDuration;
    this.onRest = onRest;
    this.rest = REST_TILT;

    this.el = document.createElement("div");
    this.el.className = ["spinning-top", className].filter(Boolean).join(" ");
    this.el.style.width = `${size}px`;
    this.el.style.height = `${Math.round(size * ASPECT)}px`;
    this.el.innerHTML = markup(uid++, palette);

    this._top = this.el.querySelector(".st-top");
    this._cast = this.el.querySelector(".st-cast");
    this._head = this.el.querySelector(".st-head");
    this._cuts = Array.from(this.el.querySelectorAll(".st-cut"));
    this._lips = Array.from(this.el.querySelectorAll(".st-lip"));
    this._grooves = GROOVES.map((y) => ({ y, r: radiusAt(PROFILE, y) }));
    if (!table) this.el.querySelector(".st-table").remove();

    this.reset();
    join(this);
  }

  /** 'spin' while it is up, then 'wobble', 'settle', and finally 'rest'. */
  get state() {
    return this.mode;
  }

  /** Let it fall. Ignored unless it is currently spinning. */
  fall() {
    if (this.mode !== "spin") return this;
    this.mode = "wobble";
    this.t = 0;
    return this;
  }

  /** Stand it back up, spinning steadily. */
  reset() {
    this.mode = "spin";
    this.t = this.seed * 3;
    this.phi = this.seed * 6.283;
    this.theta = IDLE_TILT;
    this._render();
    join(this);
    return this;
  }

  /** Stop animating — e.g. while the slide holding it is off screen. */
  pause() {
    leave(this);
    return this;
  }

  /** Resume after pause(). */
  play() {
    join(this);
    return this;
  }

  destroy() {
    leave(this);
    this.el.remove();
  }

  _step(dt) {
    this.t += dt;
    if (this.mode === "spin") {
      this.phi += (2.5 + 0.35 * Math.sin(this.t * 0.61 + this.seed)) * dt;
      this.theta = IDLE_TILT * (1 + 0.22 * Math.sin(this.t * 1.7 + this.seed * 4));
    } else if (this.mode === "wobble") {
      // Losing the spin: the cone opens up and the precession runs away.
      const k = Math.min(1, this.t / this.wobbleDuration);
      this.theta = IDLE_TILT + (this.rest * 0.6 - IDLE_TILT) * Math.pow(k, 2.6);
      this.phi += (2.5 + 8 * k * k) * dt;
      if (k >= 1) {
        this.mode = "settle";
        this.t = 0;
        this.theta0 = this.theta;
        this.phi0 = this.phi;
        // It carries on round the same way and runs out of turn, but is
        // steered to stop exactly side-on: any other angle foreshortens the
        // lean and leaves the body hanging clear of the table.
        let end = Math.PI / 2;
        while (end < this.phi + 2.6) end += Math.PI;
        this.phiEnd = end;
      }
    } else if (this.mode === "settle") {
      // The same motion winding down: the precession eases to a stop while
      // the lean opens to the angle where tip and side both touch.
      const k = Math.min(1, this.t / this.settleDuration);
      const e = 1 - Math.pow(1 - k, 3);
      this.phi = this.phi0 + (this.phiEnd - this.phi0) * e;
      // A last rock against the table. Never above this.rest — that would
      // be through the table.
      const tr = Math.max(0, this.t - this.settleDuration * 0.78);
      const rock = 0.07 * Math.exp(-5 * tr) * Math.abs(Math.cos(13 * tr));
      this.theta = this.rest * (1 - rock) - (this.rest - this.theta0) * (1 - e);
      if (this.t > this.settleDuration + 1.4) {
        this.mode = "rest";
        this.theta = this.rest;
        this.phi = this.phiEnd;
        if (this.onRest) this.onRest(this);
      }
    } else {
      leave(this);   // at rest nothing moves; stop burning frames
    }
  }

  _render() {
    // The top always turns about its tip, which never leaves the table, so
    // there is nothing to lift or slide at any angle.
    const lean = this.theta * Math.sin(this.phi);
    const toward = this.theta * Math.cos(this.phi);

    // How open the horizontal circles look from here. Signed, because past a
    // steep lean you see them from underneath and they bow the other way;
    // clamped, or the flat head balloons into a disc.
    const open = Math.max(-2.1, Math.min(2.1, Math.sin(CAM_ANGLE + toward) / CAM));
    const deg = (lean * 180) / Math.PI;

    this._top.setAttribute(
      "transform",
      `translate(${VB_W / 2} ${GROUND_Y}) rotate(${deg.toFixed(2)})`
    );
    this._head.setAttribute("ry", (HEAD_PT[1] * CAM * Math.abs(open)).toFixed(2));

    // Cut rings around the belly. The near half of each circle sits lower on
    // screen, which is the whole three-dimensional cue.
    this._grooves.forEach((g, i) => {
      const bow = g.r * CAM * open;
      const x = g.r * 0.985;
      const arc = (dy) =>
        `M ${-x.toFixed(2)} ${(-g.y + dy).toFixed(2)} Q 0 ${(-g.y + dy + bow * 2).toFixed(2)} ${x.toFixed(2)} ${(-g.y + dy).toFixed(2)}`;
      this._cuts[i].setAttribute("d", arc(0));
      this._lips[i].setAttribute("d", arc(1.8));
    });

    const s = Math.abs(Math.sin(lean));
    this._cast.setAttribute(
      "cx",
      (VB_W / 2 + Math.sin(lean) * HEAD_PT[0] * 0.42).toFixed(2)
    );
    this._cast.setAttribute("rx", (24 + 40 * s).toFixed(2));
    this._cast.setAttribute("ry", (7 + 3 * s).toFixed(2));
  }
}

/**
 * Build one spinning top.
 *
 * @param {object} [options]
 * @param {number} [options.size=240]        width in px; height follows the aspect ratio
 * @param {number} [options.seed]            0..1 phase offset, so a group is never in step
 * @param {object} [options.palette]         { edge, dark, mid, spec, cut, lip }
 * @param {boolean} [options.table=true]     draw the table line and pool of light
 * @param {number} [options.wobbleDuration]  seconds from fall() to losing the spin
 * @param {number} [options.settleDuration]  seconds from there to lying against the table
 * @param {Function} [options.onRest]        called once, with the top, when it comes to rest
 * @param {string} [options.className]       extra class on the wrapper element
 * @returns {SpinningTop} with .el, .state, .fall(), .reset(), .pause(), .play(), .destroy()
 */
export function createSpinningTop(options) {
  return new SpinningTop(options);
}

export { CHROME as SPINNING_TOP_CHROME, REST_TILT as SPINNING_TOP_REST_TILT };
