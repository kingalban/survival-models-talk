// A flat dog paw print, as a reusable object.
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
// Flat by construction: solid fills only — no gradients, no outlines, no
// highlights, no shadow. The shape carries it. One metacarpal pad with four
// toe beans fanned above, the whole print tipped slightly to one side the
// way a real print lands — a left paw by default, mirrored for a right.

const PALETTE = {
  pad: "#8a5a3b",        // the beans and the pad, one flat brown
  disc: "#e8d7bd",       // the flat beige field behind the print
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
// lobes along its bottom edge stay under one silhouette. The notch between
// them is shallow — deep lobes read as a cartoon, a hint of them reads as a
// paw.
const PAD = `
  M 50,47
  C 68.5,47 82,59.5 82,73.5
  C 82,86 73,94.5 63.5,94.5
  C 58,94.5 54,92.5 50,92.5
  C 46,92.5 42,94.5 36.5,94.5
  C 27,94.5 18,86 18,73.5
  C 18,59.5 31.5,47 50,47
  Z`;

const VB_W = 100;
const VB_H = 108;

function markup(p, disc) {
  const toes = TOES.map((t) => `
      <ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}"
               transform="rotate(${t.rot} ${t.x} ${t.y})" />`).join("");

  return `
  <svg class="paw-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Dog paw print">
    ${disc ? `<circle class="paw-disc" cx="50" cy="59" r="52" fill="${p.disc}" />` : ""}
    <g class="paw-print" fill="${p.pad}">
      <path d="${PAD}" />
      ${toes}
    </g>
  </svg>`;
}

class PawPrint {
  constructor({
    size = 180,
    angle = -14,        // the lean, in degrees; negative tips to the left
    side = "left",      // "right" mirrors the fan of toes
    disc = true,        // the flat beige field behind the print
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
    this.el.innerHTML = `<style>${css()}</style>${markup(p, disc)}`;

    this._print = this.el.querySelector(".paw-print");
    this.state = "rest";
  }

  // Stamp: press down onto the ground, then ease back to the print.
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
    transform: rotate(var(--paw-angle)) scaleX(var(--paw-flip)) scale(0.94);
    transition-duration: 90ms;
  }`;
}

/**
 * @returns {PawPrint} with .el, .state, .press(), .reset(), .destroy()
 */
export function createPawPrint(options) {
  return new PawPrint(options);
}
