<!--
How this file works:

- One `## <slide-id>` heading per slide, in presentation order. The id must
  match the `id` field exported by the corresponding file in slides/.
- Below the heading: your own narration / speaker notes, free text.
- Anywhere in that section, a `[...]` block is a build instruction for
  whichever agent implements the slide. Agents copy it verbatim into a
  tagged comment at the top of the slide's .js file.
- Run `node tools/check-script-sync.mjs` to check every implemented slide's
  embedded annotation still matches what's written here. A slide section
  with no matching .js file yet is fine — it just shows as "not implemented".
-->

## title

Cold open. Say the title out loud, pause, let it land before talking about
what survival analysis actually is.

[Fade in the title "An Intuitive Understanding of Survival Models" with a
short upward drift, then fade in a subtitle half a second later: "Time-to-
event data, hazard functions, and why the math is simpler than it looks."]

## distribution-demo

Introduce the exponential distribution as the simplest possible survival
model: constant risk over time, no memory of the past.

[Interactive chart of the exponential PDF f(x) = λe^(-λx) over x in [0,6],
with a slider for λ from 0.2 to 3. Curve redraws live as the slider moves.
Draw the curve in accent-blue.]
