# Survival models presentation

An HTML/JS slide deck (custom deck engine, no framework) spoken alongside a
live talk. Visual target: 3Blue1Brown-style animated math, not a generic
slideshow. `script.md` is the source of truth for content; this file is the
process for turning it into slides.

`##` headings in `script.md` are the author's own navigation aid, nothing
more — they don't map to slides and carry no meaning for tooling. The unit
of truth is a `{slide:<id>}` or `{layer:<id> on:<base-id>}` tag immediately
followed by a `[...]` block:

- `{slide:<id>}` — a new, full slide.
- `{layer:<id> on:<base-id>}` — something that builds on top of an existing
  slide already on screen (an overlay curve, a follow-up reveal) rather than
  its own slide transition. Implement it inside the base slide's `mount()`
  (e.g. behind a "reveal" button or a later animation beat), in the same
  `.js` file as the base slide.
- A `[PLACEHOLDER — ...]` block marks a beat that has no visual designed yet.
  Implement it as a plain placeholder slide (heading + the placeholder text
  + a note on what's undecided) so the deck stays walkable end to end;
  replace it once the real visual is designed.
- Angle-bracket asides (`<like this>`) are the author's private notes, never
  build instructions — ignore them.

## Implementing a slide or layer

1. Read the **entire** `script.md`, not just the tag's surrounding prose —
   the narration around a slide is what makes its instruction make sense,
   and callbacks/running motifs across slides live in the prose.
2. Read the slides immediately before and after this one in `js/storyboard.js`
   (open their files) so tone, palette use, and transition pacing stay
   consistent with neighbors.
3. Implement `slides/<NN>-<id>.js` per the conventions in `js/deck.js`'s
   header comment (`{ id, mount(stage) }`, optional cleanup return). For a
   layer, add the code to the *base* slide's existing file instead of
   creating a new one.
4. Copy the `[...]` text verbatim into a tagged comment block, including the
   id (and, for a layer, its base) in the marker itself:
   ```js
   // --- SCRIPT ANNOTATION [slide:naive-survival-graph] ---
   // <exact bracketed text from script.md>
   // --- END SCRIPT ANNOTATION ---

   // --- SCRIPT ANNOTATION [layer:km-overlay on:naive-survival-graph] ---
   // <exact bracketed text from script.md>
   // --- END SCRIPT ANNOTATION ---
   ```
5. Add new slides to `js/storyboard.js` in the right position (layers don't
   get their own storyboard entry — they live inside their base slide).
6. Run `node tools/check-script-sync.mjs` — it fails if any embedded
   annotation drifts from `script.md`. Fix drift before finishing.

`script.md` is a working document, not something rendered in the deck itself.

## Editing an existing slide or layer

If you change what a slide/layer does in a way that no longer matches its
`[...]` instruction, update `script.md` first, then the embedded annotation
comment to match — re-run the sync check afterward either way.

## Commit often

Commit after each meaningfully complete step (one slide implemented, one
script section rewritten, one engine tweak) rather than batching unrelated
changes into one commit. This is a storyboard under active iteration — small
commits make it cheap to rearrange, revert, or diff a single slide later.

