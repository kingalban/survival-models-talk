// Title slide: hand-rolled entrance animation (no D3 needed here).
//
// --- SCRIPT ANNOTATION (auto-synced from script.md) ---
// Fade in the title "An Intuitive Understanding of Survival Models" with a
// short upward drift, then fade in a subtitle half a second later: "Time-to-
// event data, hazard functions, and why the math is simpler than it looks."
// --- END SCRIPT ANNOTATION ---
export default {
  id: "title",
  mount(stage) {
    stage.innerHTML = `
      <h1 class="slide-title" style="opacity:0; transform: translateY(12px);">
        An Intuitive Understanding of
        <span class="accent-blue">Survival Models</span>
      </h1>
      <p class="slide-subtitle" style="opacity:0;">
        Time-to-event data, hazard functions, and why the math is simpler than it looks.
      </p>
    `;

    const title = stage.querySelector(".slide-title");
    const subtitle = stage.querySelector(".slide-subtitle");

    const t1 = setTimeout(() => {
      title.style.transition = "opacity 600ms ease, transform 600ms ease";
      title.style.opacity = "1";
      title.style.transform = "translateY(0)";
    }, 80);

    const t2 = setTimeout(() => {
      subtitle.style.transition = "opacity 600ms ease";
      subtitle.style.opacity = "1";
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  },
};
