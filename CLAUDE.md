# Survival models presentation

An HTML/JS slide deck (custom deck engine, no framework) spoken alongside a
live talk. Visual target: 3Blue1Brown-style animated math, not a generic
slideshow. `script.md` is the source of truth for content; this file is the
process for turning it into slides.

## Implementing a slide

1. Read the **entire** `script.md`, not just the target slide's section — the
   narration around a slide is what makes its `[...]` build instruction make
   sense, and callbacks/running motifs across slides live in the prose.
2. Read the slides immediately before and after this one in `js/storyboard.js`
   (open their files) so tone, palette use, and transition pacing stay
   consistent with neighbors.
3. Implement `slides/<NN>-<id>.js` per the conventions in `js/deck.js`'s
   header comment (`{ id, mount(stage) }`, optional cleanup return).
4. Copy the slide's `[...]` instruction from `script.md` verbatim into a
   comment block at the top of the file:
   ```js
   // --- SCRIPT ANNOTATION (auto-synced from script.md) ---
   // <exact bracketed text from script.md>
   // --- END SCRIPT ANNOTATION ---
   ```
5. Add the slide to `js/storyboard.js` in the right position.
6. Run `node tools/check-script-sync.mjs` — it fails if the embedded
   annotation drifts from `script.md`. Fix drift before finishing.

`script.md` is a working document, not something rendered in the deck itself.

## Editing an existing slide

If you change what a slide does in a way that no longer matches its `[...]`
instruction, update `script.md` first, then the slide's embedded annotation
comment to match — re-run the sync check afterward either way.

## Commit often

Commit after each meaningfully complete step (one slide implemented, one
script section rewritten, one engine tweak) rather than batching unrelated
changes into one commit. This is a storyboard under active iteration — small
commits make it cheap to rearrange, revert, or diff a single slide later.

