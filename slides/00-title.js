// Title slide: hand-rolled entrance animation (no D3 needed here).
//
// --- SCRIPT ANNOTATION [slide:title] ---
// Intuitive understanding for Survival Models
// --- END SCRIPT ANNOTATION ---
export default {
  id: "title",
  mount(stage) {
    stage.innerHTML = `
      <h1 class="slide-title" style="opacity:0; transform: translateY(12px);">
        Intuitive Understanding for
        <span class="accent-blue">Survival Models</span>
      </h1>
    `;

    const title = stage.querySelector(".slide-title");

    const t1 = setTimeout(() => {
      title.style.transition = "opacity 600ms ease, transform 600ms ease";
      title.style.opacity = "1";
      title.style.transform = "translateY(0)";
    }, 80);

    return () => clearTimeout(t1);
  },
};
