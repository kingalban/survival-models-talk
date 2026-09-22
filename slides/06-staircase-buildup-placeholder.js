// --- SCRIPT ANNOTATION [slide:staircase-buildup-placeholder] ---
// PLACEHOLDER — not yet designed. Needs to cover: turning the spinning-top
// population into the step-function survival graph, building it up
// event-by-event (5s / 20s / 30s drops), and making the
// conditional-probability multiplication (90% x 89% = 80%, etc.) visually
// intuitive.
// --- END SCRIPT ANNOTATION ---
export default {
  id: "staircase-buildup-placeholder",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title accent-yellow" style="font-size: clamp(1.4rem, 3vw, 2rem);">
        TODO: building the survival staircase
      </h2>
      <p class="slide-body" style="text-align:center; color: var(--fg-dim);">
        Needs: turning the spinning-top population into the step-function
        survival graph, built up event-by-event (5s / 20s / 30s drops), with
        the conditional-probability multiplication (90% &times; 89% = 80%,
        etc.) made visually intuitive.
      </p>
    `;
  },
};
