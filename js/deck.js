// Minimal slide-deck engine.
//
// A "slide module" is any object of the shape:
//   { id: string, mount(stageEl): (cleanupFn | void) }
//
// `mount` receives the stage <div> to render into and may return a cleanup
// function (cancel animation frames, remove listeners, stop simulations).
// That cleanup runs automatically before the slide is torn down.

const TRANSITION_MS = 500;

export class Deck {
  constructor({ stageEl, slides, hud }) {
    this.stageEl = stageEl;
    this.slides = slides;
    this.hud = hud;
    this.index = 0;
    this.currentCleanup = null;

    this._buildProgressDots();
    this._bindNav();
    this._bindKeyboard();
    this._restoreFromHash();

    this._render({ instant: true });
  }

  _buildProgressDots() {
    this.hud.progress.innerHTML = "";
    this.dots = this.slides.map(() => {
      const dot = document.createElement("div");
      dot.className = "dot";
      this.hud.progress.appendChild(dot);
      return dot;
    });
  }

  _bindNav() {
    this.hud.prevBtn.addEventListener("click", () => this.prev());
    this.hud.nextBtn.addEventListener("click", () => this.next());
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        this.next();
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        this.prev();
      } else if (e.key === "Home") {
        this.goTo(0);
      } else if (e.key === "End") {
        this.goTo(this.slides.length - 1);
      }
    });
  }

  _restoreFromHash() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const byId = this.slides.findIndex((s) => s.id === hash);
    if (byId >= 0) {
      this.index = byId;
      return;
    }
    const byNum = Number(hash);
    if (Number.isInteger(byNum) && byNum >= 0 && byNum < this.slides.length) {
      this.index = byNum;
    }
  }

  next() {
    if (this.index < this.slides.length - 1) this.goTo(this.index + 1, "forward");
  }

  prev() {
    if (this.index > 0) this.goTo(this.index - 1, "back");
  }

  goTo(newIndex, direction = newIndex > this.index ? "forward" : "back") {
    if (newIndex === this.index || newIndex < 0 || newIndex >= this.slides.length) return;
    this.index = newIndex;
    this._render({ direction });
  }

  _render({ direction = "forward", instant = false } = {}) {
    const slide = this.slides[this.index];
    window.location.hash = slide.id;

    const swap = () => {
      if (this.currentCleanup) {
        try {
          this.currentCleanup();
        } catch (err) {
          console.error(`cleanup failed for slide "${slide.id}"`, err);
        }
        this.currentCleanup = null;
      }
      this.stageEl.innerHTML = "";
      this.stageEl.className = `stage entering-${direction}`;

      try {
        this.currentCleanup = slide.mount(this.stageEl) || null;
      } catch (err) {
        console.error(`mount failed for slide "${slide.id}"`, err);
      }

      // Force layout so the entering-* transform is committed before we
      // remove it, otherwise the browser coalesces both class changes.
      void this.stageEl.offsetHeight;
      this.stageEl.className = "stage";

      this._updateHud();
    };

    if (instant) {
      swap();
      return;
    }

    this.stageEl.className = `stage leaving-${direction}`;
    window.setTimeout(swap, TRANSITION_MS);
  }

  _updateHud() {
    this.dots.forEach((dot, i) => dot.classList.toggle("active", i === this.index));
    this.hud.counter.textContent = `${this.index + 1} / ${this.slides.length}`;
    this.hud.prevBtn.disabled = this.index === 0;
    this.hud.nextBtn.disabled = this.index === this.slides.length - 1;
  }
}
