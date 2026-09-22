// --- SCRIPT ANNOTATION [slide:censoring-and-wrapup-placeholder] ---
// PLACEHOLDER — not yet designed. Needs to cover: the wrap-up/summary
// tying back to the SaaS problem, naming Kaplan-Meier, its
// non-parametric tradeoffs, and the restricted-mean-survival-time bonus
// fact.
// --- END SCRIPT ANNOTATION ---
export default {
  id: "censoring-and-wrapup-placeholder",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title accent-yellow" style="font-size: clamp(1.4rem, 3vw, 2rem);">
        TODO: censoring, then wrap-up
      </h2>
      <p class="slide-body" style="text-align:center; color: var(--fg-dim);">
        Needs: reworking the staircase graph to correctly ignore censored
        observations instead of counting them as failures, the wrap-up
        tying back to the SaaS problem, naming Kaplan-Meier and its
        non-parametric tradeoffs, and the restricted-mean-survival-time
        bonus fact.
      </p>
    `;
  },
};
