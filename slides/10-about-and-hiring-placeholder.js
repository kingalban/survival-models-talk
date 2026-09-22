// --- SCRIPT ANNOTATION [slide:about-and-hiring-placeholder] ---
// PLACEHOLDER — not yet designed. Needs to cover: the speaker's own
// details (name, LinkedIn), then an embedded section about the company
// they work for and the open positions it has available. Undecided: how
// the company section is embedded — a live careers page, a static list
// of roles, or a QR code the room can scan.
// --- END SCRIPT ANNOTATION ---
export default {
  id: "about-and-hiring-placeholder",
  mount(stage) {
    stage.innerHTML = `
      <h2 class="slide-title accent-yellow" style="font-size: clamp(1.4rem, 3vw, 2rem);">
        TODO: who I am, and who we're hiring
      </h2>
      <p class="slide-body" style="text-align:center; color: var(--fg-dim);">
        Needs: the speaker's own details (name, LinkedIn), then an embedded
        section about the company and its open positions.
      </p>
      <p class="slide-body" style="text-align:center; color: var(--fg-dim);">
        Undecided: how the company section is embedded — a live careers
        page, a static list of roles, or a QR code the room can scan.
      </p>
    `;
  },
};
