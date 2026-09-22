// --- SCRIPT ANNOTATION [slide:spinning-top-single] ---
// A simple animation of a spinning top, silver, sleek, and rotating
// occasionally, jiggling, and then eventually falling on its side and
// stopping moving, using the shared spinning-top artefact
// (artefacts/spinning-top.js).
// --- END SCRIPT ANNOTATION ---
import { createSpinningTop } from "../artefacts/spinning-top.js";

const FALL_DELAY_MS = 3500;

export default {
  id: "spinning-top-single",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title" style="font-size: clamp(1.6rem, 3vw, 2.2rem);">
        A simpler problem first: spinning tops
      </h2>
      <div class="viz-panel" style="flex-direction: column; gap: 1rem;">
        <div id="topHost" style="width: 260px;"></div>
        <p id="caption" style="color: var(--fg-dim); font-family: var(--font-sans);">
          Watching a single spinning top...
        </p>
      </div>
    `;

    const caption = stage.querySelector("#caption");
    const top = createSpinningTop({
      size: 260,
      onRest: () => {
        caption.textContent = "It fell over.";
      },
    });
    stage.querySelector("#topHost").appendChild(top.el);

    const fallTimeout = setTimeout(() => top.fall(), FALL_DELAY_MS);

    return () => {
      clearTimeout(fallTimeout);
      top.destroy();
    };
  },
};
