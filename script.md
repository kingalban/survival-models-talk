<!--
How this file works:

- `##` headings are for YOU, the reader — they organize the prose into beats
  so you can navigate the document. Tooling ignores them entirely; they are
  not tied to slide ids and don't need to be unique or machine-parseable.
- A `[...]` block is a build instruction for whichever agent implements that
  visual. It is immediately preceded by a small tag naming it:
    {slide:<id>}
    [describe the slide]
  for a new, full slide, or:
    {layer:<id> on:<base-id>}
    [describe what gets added/overlaid]
  for something that builds on top of an existing slide (e.g. a second curve
  drawn over a graph that's already on screen) rather than being its own
  slide transition. `<id>` and `<base-id>` are kebab-case and must be unique.
- Prose with no `[...]` block just hasn't had a visual decided yet — that's
  fine, it shows up as a placeholder or a gap, not an error.
- Angle-bracket notes like `<this needs rewording>` are your own private
  asides to yourself. Tooling ignores them too — don't treat them as build
  instructions.
- Agents: copy the bracketed text verbatim into a tagged comment at the top
  of the slide's .js file (see CLAUDE.md). A `{layer:...}` annotation lives
  in the same file as its base slide, as a second tagged comment block.
- Run `node tools/check-script-sync.mjs` to check every implemented
  slide/layer's embedded annotation still matches what's written here.
-->

## Title

{slide:title}
[Intuitive understanding for Survival Models]

## A real problem

{slide:meeple-churn-problem}
[A slide showing animations of Of little meeple-shaped users subscribing to a service and then eventually leaving the service and going into a churn-out area over time]
Let's say you're given a task at the SaaS company you work at to work out what your customer retention looks like. Do people generally stay around for a long time or a short time? Really we want to know: is there some shape to our customer retention? Can we get some good insights from this?

{slide:naive-survival-graph}
[A slide showing a survival function graph being animated into existence from left to right. The data is selected from an actual distribution, which can be reset or reparameterized by a few buttons in the UI. But this is a naive analysis. We assume that all right-censored individuals turn at that moment. For the data in the graph we select the actual lifetime of each user from some negative exponential distribution and then the censoring lifetime From a Negative linear distribution over the period 0 to 5 years, mixed with an extra bump of censoring times under 1 year (representing a recent surge of new signups) so that a lot more users end up censored early. We then get the Observed lifetime of each user by taking the minimum of their real lifetime and their censored lifetime.]
You're probably thinking in your head that you want to see some nice graph that shows: what's the chance that somebody stays a customer for 1 month, 2 months, 3 months, 4 months? You can see that some customers only stay around for 1 month and you have a few really sticky customers that stay around longer. Maybe you think you could investigate what's special about the sticky customers or their experience. The first thing you do is run some SQL and look at how many customers have got a subscription right now and how many customers Used to have one 'cause they quit. You're going to notice that if you take a bit of a graph of this, things look really wonky. Things look all bunched up to one side. You're not getting the nice picture you want because your user base has been growing, A lot of your users are newer and You don't know What they're going to do in the future. This naive graph just assumes that they all quit today.

You realise there is some bias going on here and you're not getting the true graph because you see all these customers who are still subscribing today. You don't know how long they're going to subscribe for after this. What do you do? Cut the data in half and then you get only the customers from early days. This becomes a bit of a pain. 

The problem you're facing here is that for a huge number of your users you only see half the picture. You know at least they've been a customer for 1 month, 1 year, or something like that but you don't know if they're going to unsubscribe tomorrow or in 10 years. You really want to use that information that you already have: that they've been at least 1 month or 1 year. What's the smart way to do this? 

The special word for the thing that we want to make here is called a survival function. It's a function which tells us how likely a user is to last at least this long. 

{layer:true-lifetime-overlay on:naive-survival-graph}
[A graph of the real survival function, computed directly from each user's actual uncensored lifetime — which we know here because we generated the simulated data ourselves — overlaid on top of the previous naive graph. This is not Kaplan-Meier; that comes later, once we no longer get to peek at the ground truth.]

The good news is that there are a lot of different ways to estimate this survival function to get this graph but you probably are a smart person and you want to actually understand how it works. So we're not going to jump right to the end and see the equations. Let's first pick a much simpler problem to build some intuition

This is a common type of problem. We have some process, something which has a state which changes, and we see some part of its lifetime. We want to get an estimate of how the population evolves. This pops up in a bunch of places, like medical research (seeing how patients respond after some intervention), or in some finance fields, or in biology.
<I had a passage here which explains that this is not just a SaaS user base problem but a common problem to be modelled.>

(cut this to somewhere else)
  The whole point is that we do not know for sure, for every observation, the beginning and end. We just know some, at least, time period. These are non-parametric models, which means that they kind of work for any distribution. They don't have to be some specific thing, but it also means that we have the caveat that we only get an estimate of the Survival function. You might have some Gaussian distribution at which point the process stops, but you can't get the standard deviation of that Gaussian out of the Kaplan-Meier model or another similar model. 

## The spinning-top example

{slide:spinning-top-single}
[A simple animation of a spinning top, silver, sleek, and rotating occasionally, jiggling, and then eventually falling on its side and stopping moving, using the shared spinning-top artefact (artefacts/spinning-top.js).]

{slide:spinning-top-population-standing}
[The spinning top resets, shrinks, and many more identical spinning tops start next to it in a column. Some of them fall over at a random time within the observation window; the rest stay standing (still spinning) at the end of it. No graph yet — just the population.]

{slide:spinning-top-population-graph}
[The same group of spinning tops as the previous slide, but now as they spin they progress to the right, drawing a bar along underneath them, which becomes a graph. Every spinning top falls at some point before reaching the right-hand side — its falling time is drawn from a distribution bounded between the start and the end of the observation window, so none of them are left still spinning at the edge. Once they've all fallen, an "Order" button appears; clicking it fades the tops out and, with no slide transition (this is still the same slide), reorders the bars via a smooth transition: shortest at the top, longest at the bottom, settling into a simple graph. Once the bars settle, they cross-fade into the same data, same order, drawn as an actual chart with our graphing library (D3) and a real axis, rather than the hand-built div bars. Overlaid on top of the real chart, a dotted line traces the empirical survival function — since the bars are already sorted with even spacing, each row boundary is exactly one more event's worth of drop. A percentage y-axis on the left (100% at the top, 0% at the bottom) makes that scale explicit.]
<This is clunky and needs to be reworded to make it obvious that we are taking a sample only for a strict amount of time. >
Before we jump into understanding these, let's think of a really simple example. Let's say I have a set of spinning tops I'm testing on my table, and what I care about is whether each one falls over while I'm watching it. For each one I spin, I measure if it does or doesn't fall over. I can find, at the end of spinning all of them, that maybe 7 out of 10 did in the minute I tested each one. What's the chance that any one would fall over? It's 7/10. It's a 70% chance.

{slide:sorted-graph-conditional-probability}
[The same finished graph from the previous slide — sorted bars, survival step line, percentage axis. Three annotations sit to the right of the first three bars: "9/10", "8/10", "7/10", each a proper stacked fraction (a horizontal rule between numerator and denominator, not a slash), positioned clear of the dotted survival line rather than overlapping it. To the right of the graph, two stacked equations, both written in the same ascending order (each term's denominator becomes the next term's numerator) for visual symmetry: 8/9 × 9/10 = 8/10, and below it 7/8 × 8/9 × 9/10 = 7/10 — the second the product of three fractions, extending the same conditional-probability chain one event further. The equations start hidden under a plain greyed-out panel; clicking it fades the panel away.]

{slide:survival-graph-buildup-placeholder}
[PLACEHOLDER — not yet designed. Needs to cover: building the survival graph up event-by-event as a progressive animation (revealing one row/fraction at a time rather than the static two-event example already shown), extending the conditional-probability walkthrough across the remaining events.]

Looking at this graph it seems like there's a lot more information here that I can get out. I could actually even see, not just the median time (the 50% likelihood time), but we can also look at how that changes as things go along. Is there A point where most of them start to tumble or is it just sort of uniform across the whole time period? 

To investigate this let's make a graph from our graph here that shows the likelihood that you reach at least some time, maybe something longer. We can do this very intuitively. We can say at the start there's a 100% chance you reach 0 seconds. Everyone's reached that.

The one caveat we have on this is that we're only going to update the graph when we have an event. I'm not going to update it when the spinning top is a bit wobbling. It's just going to be when we have an event so it's going to be this sort of stepwise thing.

This is where I'm going to remind myself Of the only good advice I got in high school mathematics: if you're confronted with a more daunting-looking problem, just apply the rules you know. 

At 5 seconds the first spinning top has fallen over. Now I can say that after 5 seconds only 9 out of the 10 remain so we have a 90% chance of any spinning top reaching more than 5 seconds. 

At 20 seconds the next spinning top falls and here we've gone from 9 to 8 spinning tops. That's an 89% survival rate through this event but that's conditional on having already made it to 20 seconds. We know only 90% made it to 20 seconds. We have this conditional probability here so we're going to multiply the two. We're going to get 90% × 89%. Which is, of course, 80%. We already knew that 8 out of 10 are surviving here. It's the same for the next one: 7/8. All of the numerators and denominators cancel so here it happens to be very nice and easy. And we get a 70% chance at 30 seconds.

And this conditional probability is the thing I really want to Reinforce here: for each event we're looking at the group that was around before and after and that's all conditional on having even reached the group before. Yes here the maths works out very nicely, that we just see the equal steps of 10%. The other really important thing about this conditional probability is that it's kind of what the graph is showing us. It's not saying, "What's the probability of finding something at this time?" It's saying, "What's the probability of one spinning top lasting at least this time?"

## Censoring

{slide:spinning-top-population-graph-censored}
[The same population-graph setup as before — spinning tops falling over and drawing bars underneath them — but now, while a top is still spinning, a selection of them get stolen by a dog before they fall: the top disappears and a paw print (the shared paw-print artefact) stamps down frozen at that spot, its bar stopping there too, in a distinct color from an actual fall. The rest still fall as before. The draw is forced at the start of the ordering so the talk can walk it event by event: the shortest observation is always a fall and the second-shortest is always a censoring, with the remaining stolen tops picked at random from everything after those two. Once they've all been resolved, "Order" reorders the bars by observed time (regardless of type) and cross-fades into a real D3 chart with a percentage axis, same as the previous pair — small paw markers stay next to the censored bars. No survival line is drawn here: the bars and the paw prints are the whole picture, and the question of what the curve should do at a censored observation is left for the next slide to answer.]

{slide:sorted-graph-conditional-probability-censored}
[The same finished graph from the previous slide — sorted bars (red for an actual fall, purple with a small paw marker for a dog-stolen one), the Kaplan-Meier step line, percentage axis — locked to that slide's exact numbers, no restarting or recalculating here. Laid out like the uncensored pair, but with the numbers now derived from the actual run rather than hard-coded: each of the first three genuine falls is labelled with the level the curve has reached after it, sitting just above its bar and right-aligned so the label ends exactly where the bar does — the same role the uncensored slide's 9/10, 8/10, 7/10 play, but as a percentage, since with censoring in the mix it is no longer a tidy k/10. The per-event conditional factors, (at risk − 1) / at risk with the at-risk count already reduced by any censoring before it, appear only in the equations, and each equation's result is the label beside its own bar. Each censored row before that point is labelled "no update" next to its paw print. To the right of the graph, the same two stacked equations in ascending order — the second and third falls' running products — with a line underneath noting that a paw print never becomes a term in the product, it only shrinks the denominator of every fall after it. Above those, the uncensored slide's own two-term equation, 8/9 × 9/10 = 8/10, sits in the same grid so its "=" lines up with theirs, set slightly smaller and dimmer, with an orange border drawn around it and a small "previously, without censoring" label along its bottom edge — the same beat a few slides earlier, kept on screen to compare against. Unlike the uncensored pair, nothing here is hidden behind a reveal panel: all three equations are on screen from the start.]

{slide:censoring-and-wrapup-placeholder}
[PLACEHOLDER — not yet designed. Needs to cover: the wrap-up/summary tying back to the SaaS problem, naming Kaplan-Meier, its non-parametric tradeoffs, and the restricted-mean-survival-time bonus fact.]

Now we're going to switch it up a little bit and make it a bit more difficult and more real-world-like. Let's keep going with the spinning top example but let's imagine that when I spin the top and start timing and watching it, maybe My dog steals it from me for a game. So now I have this sort of partial information. All I know is that the spinning top lasted at least until the dogs stopped it. I don't know if it was wobbling or not. I can't really say if that meant it was going to fall. How can I put this into my numbers above, into my graph, and work out the 50% likelihood time or work out my nice pretty staircase graph? Really here, I have a whole handful of observations which are incomplete. Somebody hid the final part of the result from me. I know the spinning top lasted, let's say, at least 5 seconds but I don't know if it was going to last 1 more second or 100 more seconds. This is a lot like real life. You have somebody enter your drug trial. One year before the end of the trial, at the end of the trial, they had no side effects. They didn't have complications but they were still alive so it's somewhat uninteresting. There is nothing to report but you know that they lived at least 1 year healthily. Or maybe you have a customer sign up to your product and they are a subscriber for The last 6 months, and they haven't quit yet. How can you include this information in your estimate of how long people subscribe to your product for? 
The term for this in the literature is censored, not like "IoT sensored", but more like "redacted" censored. We're having part of the information hidden from us because it's in the future or something else. 

Let's go back to our simple calculation here and look at our basic equations. Where did we even go to put this censored hidden data into it? If we start recording each time something gets censored. It doesn't really make sense to put it in the numerator or denominator of our survival probability at each step. We don't know if they survived or not. 

The key and simple insight here is That when we get to a censored event we don't Recalculate. Before the individual is censored it gets counted as surviving and afterwards we just ignore it from all the other Calculations. 

Let's play through an example. At the 5-second mark, one spinning top falls. There are still 9 more. Some of these are going to be censored but we knew at least 9 made it here.

At the 6-second mark, the dog deals one. We don't know if it lives any longer. We can't update our probability here. Maybe our uncertainty of the survival function goes up but that's beyond what we're looking at here.

Now at the 20-second mark, we look and see that one spinning top falls but there were actually only 8 remaining at this time because one of them was censored before now. We didn't know if it made it to this point.

Look, the censored data does not go into our equation at all. It just gets ignored after it's been censored. 

Now we just keep applying the same pattern and we get a very similar-looking graph. 

## Wrap-up

<Here we have the final act of this talk and we need to really sum things up and tie it in a bow. Max five sentences: make the point that we need to make and tie it back to the original section of this talk on the problem.>

We haven't really done anything extraordinary here. We've just applied our basic (how many people before / how many people after) probability formula a whole bunch of times in a row and multiplied them together. We've just done it for each individual time step. If we have enough people in our sample or enough spinning tops in our sample, then we should get a good estimate of what it really looks like. 

Those people in the audience who already know about these models are probably just waiting for me to say that this is just one specific example of a model that estimates this survival function, this nice curve that we want to get out. This estimator is a classic. It's called Kaplan-Meier after the two guys who invented it simultaneously.

It's handy because it's very popular and non-parametric, which means you don't really have to know or care about what the actual distribution is. It also makes it not very powerful because you can't easily get nice things like what the arithmetic mean is of the time that a spinning top keeps spinning or a customer stays a customer. Those bits of information are sometimes really useful so you need to pick a more powerful tool. Some sort of parametric model perhaps, but that's for another day. 

## Bonus fact

Okay I have one more bonus extra fact here. Last month I was asking Babek, "How do you get the mean out of Kaplan-Meier?" because I didn't think that there was an easy way to do this.
Looking around a little bit more recently, I learned that there is a method called restricted mean survival time. You put in some cutoff time and say that everything is going to finish by this time in the future, we estimate, and then you find the point where the area under the graph is divided in two. That's your mean.
Exercise for the reader if you want to know this. 
