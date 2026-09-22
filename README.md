# Intuitive understanding for Survival Models

Slides from a talk given by Alban King at
[PyData Helsinki, 22 September 2026](https://pydata-helsinki.fi/events/2026-09-22-reaktor/),
hosted at Reaktor.

**[▶ View the deck](https://kingalban.github.io/survival-models-talk/dist/deck.html)**

An animated walk through censored data and the Kaplan–Meier estimator: why a
naive retention curve lies to you, and how counting only who was still at risk
at each moment fixes it. Arrow keys to move between slides.

## Running it

Open [`dist/deck.html`](dist/deck.html) — one self-contained file, no server
and no network. Rebuild it with `./build.sh`.

For development, serve the repo root (`python3 -m http.server`) and open
`index.html`; the slides are ES modules, so `file://` won't work there.

`script.md` is a rough draft of the spoken form, that was used to derive the
slides.
