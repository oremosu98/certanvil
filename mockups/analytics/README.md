# Analytics page redesign mockups

Five distinct redesigns of the CertAnvil Analytics page. Each is a self-contained,
dual-theme (light + dark, toggle top-right) standalone HTML file that shares one data
fixture, so all five show identical numbers. Every mockup keeps the two reimagined
keeper components: the knowledge constellation and the pass-trend graph. Nothing here
is baked into production; the founder picks the winner.

## Serve locally
```bash
cd mockups/analytics
python3 -m http.server 3131   # then open http://localhost:3131/mockup-1-mission-control.html
```

## Shared data
`_sample-data.js` exposes `window.ANALYTICS_SAMPLE`: a "Getting Close" learner at 688 of
900, 32 short of the 720 pass mark, 24 days out, forecast 731, weakest domain Network
Security (58%). It carries the pass-trend series, 50 constellation topics across the 5
N10-009 domains, domain rollups with exam weights, streak, a 365-day heatmap, milestones,
exam history, wrong-answer patterns, and difficulty. Each mockup loads this file, so they
are directly comparable.

## The five directions

1. **Mission control** (`mockup-1-mission-control.html`, dark default)
   A command room: one dominant readiness panel up top, then an asymmetric instrument
   grid. Constellation = the live "Knowledge Sky" monitor. Pass-trend = a trajectory
   readout. Signature: the sky boots up, stars igniting in a radial cascade.

2. **Narrative scroll** (`mockup-2-narrative-scroll.html`, dark default)
   Seven full-screen story beats read top to bottom: where you stand, your trajectory,
   your sky, what is holding you back, your habit, what you have earned, before you book.
   Constellation = a full-bleed "your sky" moment that ignites left to right on arrival.
   Pass-trend = the headline chart of its own beat, drawing in as you reach it.

3. **Bento** (`mockup-3-bento.html`, dark default)
   An asymmetric tile mosaic where several tiles share weight. Constellation = a wide
   sky tile. Pass-trend = a wide chart tile with a one-line verdict. Signature: the board
   assembles itself, tiles springing into the grid and the sky igniting as its tile lands.

4. **Cockpit** (`mockup-4-cockpit.html`, dark default)
   An instrument cluster answering "are you cleared to book?" Readiness = a radial gauge
   with a needle and a 720 redline. Constellation = a radar sky-map scope with a slow
   sweep. Pass-trend = an approach glideslope climbing to the 72% pass line. Domains = a
   row of dials. Signature: the readiness needle spools up and settles, HOLD lamp blinking on.

5. **Editorial briefing** (`mockup-5-editorial-briefing.html`, light default)
   A designed report. A large Fraunces verdict headline, a by-the-numbers strip, the
   constellation as a full-bleed feature plate, and the pass-trend as an annotated headline
   chart. Signature: after the chart draws, a leader line annotates the exact point where
   accuracy crosses the pass line.

## Passes applied
- Build: layout + both keepers, dual theme, anti-slop rules.
- Motion (emil-design-eng): strong custom easing, entrance and scroll-reveal, count-ups,
  gauge and bar fills, constellation twinkle/pulsar/flare, pass-trend draw-in, hover
  micro-interactions, one signature moment each. All gated under prefers-reduced-motion.
- Copy (humanizer): plain, concrete, no em-dashes, no AI tells.
