// A cartoon dog paw print, as a reusable object.
//
//   import { createPawPrint } from "../artefacts/paw-print.js";
//
//   const paw = createPawPrint({ size: 180 });
//   container.appendChild(paw.el);
//   paw.press();    // stamp it down, then settle
//   paw.reset();    // back to the resting print
//   paw.destroy();  // drop the element
//
// It renders itself and owns its own animation; the page only says when to
// stamp. Pure CSS transitions, so no frame loop and no cleanup beyond
// removing the element.
//
// Shape: one big heart-ish metacarpal pad with four toe beans fanned above
// it, the whole print tipped slightly to one side the way a real print
// lands — a left paw by default, mirrored for a right.

const PALETTE = {
  pad: "#9a6a44",        // the beans themselves
  padDark: "#7a5232",    // the lower edge of each bean
  padLight: "#c69b6d",   // the lit upper face
  shine: "#f0dcc0",      // beige catchlight
  outline: "#4a3020",
  ground: "#e8d7bd",     // beige halo under the print
};

// Toe beans: centre, radii and their own lean, in viewBox units. The outer
// two are smaller and lean further out, which is what stops the fan looking
// like a row of identical blobs.
const TOES = [
  { x: 20.5, y: 41, rx: 9.6, ry: 12.6, rot: -30 },
  { x: 38.5, y: 24, rx: 10.4, ry: 14.0, rot: -11 },
  { x: 60.0, y: 23, rx: 10.4, ry: 14.0, rot: 11 },
  { x: 78.5, y: 38, rx: 9.6, ry: 12.6, rot: 29 },
];

// The big pad, drawn once rather than assembled from circles so the three
// lobes along its bottom edge stay under one silhouette.
const PAD = `
  M 50,47
  C 68.5,47 82,59.5 82,73.5
  C 82,85.5 72.5,94.5 63.5,94.5
  C 57.5,94.5 54,91.5 50,91.5
  C 46,91.5 42.5,94.5 36.5,94.5
  C 27.5,94.5 18,85.5 18,73.5
  C 18,59.5 31.5,47 50,47
  Z`;

const VB_W = 100;
const VB_H = 108;

let uid = 0;

function markup(id, p) {
  const toes = TOES.map((t, i) => `
    <g class="paw-bean" transform="rotate(${t.rot} ${t.x} ${t.y})" style="--i:${i}">
      <ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}"
               fill="url(#pawBean${id})" stroke="${p.outline}" stroke-width="2.6" />
      <ellipse cx="${t.x - t.rx * 0.26}" cy="${t.y - t.ry * 0.34}"
               rx="${t.rx * 0.30}" ry="${t.ry * 0.26}"
               fill="${p.shine}" opacity="0.55" />
    </g>`).join("");

  return `
  <svg class="paw-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Dog paw print">
    <defs>
      <linearGradient id="pawBean${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="${p.padLight}" />
        <stop offset="62%" stop-color="${p.pad}" />
        <stop offset="100%" stop-color="${p.padDark}" />
      </linearGradient>
      <radialGradient id="pawHalo${id}" cx="50%" cy="58%" r="58%">
        <stop offset="0%"   stop-color="${p.ground}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="${p.ground}" stop-opacity="0" />
      </radialGradient>
    </defs>

    <ellipse class="paw-halo" cx="50" cy="62" rx="52" ry="48" fill="url(#pawHalo${id})" />

    <g class="paw-print">
      <g class="paw-bean paw-bean--pad">
        <path d="${PAD}" fill="url(#pawBean${id})" stroke="${p.outline}" stroke-width="2.6"
              stroke-linejoin="round" />
        <path d="M 36,58 C 44,52 56,52 64,58 C 56,56 44,56 36,58 Z"
              fill="${p.shine}" opacity="0.5" />
      </g>
      ${toes}
    </g>
  </svg>`;
}

class PawPrint {
  constructor({
    size = 180,
    angle = -14,        // the lean, in degrees; negative tips to the left
    side = "left",      // "right" mirrors the fan of toes
    palette = {},
    className = "",
  } = {}) {
    const p = { ...PALETTE, ...palette };

    this.el = document.createElement("div");
    this.el.className = ["paw-print-artefact", className].filter(Boolean).join(" ");
    this.el.style.width = `${size}px`;
    this.el.style.height = `${Math.round((size * VB_H) / VB_W)}px`;
    this.el.style.setProperty("--paw-angle", `${angle}deg`);
    this.el.style.setProperty("--paw-flip", side === "right" ? "-1" : "1");
    this.el.innerHTML = `<style>${css()}</style>${markup(uid++, p)}`;

    this._print = this.el.querySelector(".paw-print");
    this.state = "rest";
  }

  // Stamp: squash down onto the ground, then ease back to the print.
  press() {
    if (this.state === "press") return;
    this.state = "press";
    this._print.classList.remove("is-press");
    void this._print.offsetWidth;        // restart the transition
    this._print.classList.add("is-press");
    clearTimeout(this._t);
    this._t = setTimeout(() => {
      this._print.classList.remove("is-press");
      this.state = "rest";
    }, 260);
  }

  reset() {
    clearTimeout(this._t);
    this._print.classList.remove("is-press");
    this.state = "rest";
  }

  destroy() {
    clearTimeout(this._t);
    this.el.remove();
  }
}

function css() {
  return `
  .paw-print-artefact { display: block; }
  .paw-svg { width: 100%; height: 100%; overflow: visible; display: block; }
  .paw-print {
    transform-origin: 50px 64px;
    transform: rotate(var(--paw-angle)) scaleX(var(--paw-flip));
    transition: transform 220ms cubic-bezier(.2,.9,.3,1);
  }
  .paw-print.is-press {
    transform: rotate(var(--paw-angle)) scaleX(var(--paw-flip)) scale(0.93) translateY(3px);
    transition-duration: 90ms;
  }`;
}

/**
 * @returns {PawPrint} with .el, .state, .press(), .reset(), .destroy()
 */
export function createPawPrint(options) {
  return new PawPrint(options);
}
