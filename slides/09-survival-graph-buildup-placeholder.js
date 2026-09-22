// --- SCRIPT ANNOTATION [slide:survival-graph-buildup-placeholder] ---
// PLACEHOLDER — not yet designed. Needs to cover: building the survival
// graph up event-by-event as a progressive animation (revealing one
// row/fraction at a time rather than the static two-event example already
// shown), extending the conditional-probability walkthrough across the
// remaining events.
// --- END SCRIPT ANNOTATION ---
export default {
  id: "survival-graph-buildup-placeholder",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title accent-yellow" style="font-size: clamp(1.4rem, 3vw, 2rem);">
        TODO: building the survival staircase
      </h2>
      <p class="slide-body" style="text-align:center; color: var(--fg-dim);">
        Needs: building the survival graph up event-by-event as a
        progressive animation (revealing one row/fraction at a time rather
        than the static two-event example already shown), extending the
        conditional-probability walkthrough across the remaining events.
      </p>
    `;
  },
};
