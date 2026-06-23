# Progress page redesign mockups

Five distinct redesigns of the cert-app Progress page, built to kill the "long boring
list" feel of the current `.topic-grid` (a flat `flex-direction:column` of ~50 topics).

All five share one production-true dataset (`_sample-data.js`): the real 50 Network+
(N10-009) topics across the 5 official domains, with mastery, accuracy, attempts, recency,
and status (weak / untouched / strong / developing). Summary: 80% coverage, 38% avg mastery,
18 weak, 10 untouched, 10 strong. Each mockup is self-contained, dual-theme (light + dark
toggle, top-right), and keeps the real controls working: search, filters
(All / Weak only / Untouched / Strong), sort (Worst first / Most recent / Most studied / A-Z),
the highest-leverage drill recommendation, and per-topic drill-in. Motion is baked in
(staggered entrance, count-ups, animated fills, hover micro-interactions, drill toast) and
collapses under `prefers-reduced-motion`.

## The five directions

1. **mockup-1-command-center.html** — Domain Command Center. A control-room dashboard:
   readiness gauge + drill recommendation up top, then five weight-sized domain panels with
   radial gauges and topic sparklines that expand in place. Topics always live under a domain.

2. **mockup-2-blueprint-timeline.html** — Blueprint Journey. A horizontal track of the five
   domains in official blueprint order (1.0 to 5.0), each a station with a mastery ring and
   drillable topic nodes along the path. Collapses to a vertical stepper on mobile.

3. **mockup-3-bento.html** — Bento Grid. Asymmetric mixed-size tiles: a large "drill this next"
   spotlight, a coverage/standing stat tile, per-domain mastery bars, plus weakest / untouched /
   mastered / recent clusters. The list reframed as a scannable board.

4. **mockup-4-heatmap.html** — Mastery Heatmap. The most anti-list option: all 50 topics as one
   color-encoded matrix, five domain rows, cells ramping bronze to a green pass, hatched cells
   for untouched. The whole picture at a glance; hover for detail, click to drill.

5. **mockup-5-editorial-ledger.html** — Editorial Ledger. The most brand-true option: a "start
   here" focus band with the recommendation and the ranked weakest topics, then topics grouped
   under domain headers with per-domain summaries and hairline ledger rows. Designed and ranked,
   not a flat scroll.

## View locally

```
cd networkplus-quiz
python3 -m http.server 3131
# then open http://localhost:3131/mockups/progress/mockup-1-command-center.html  (1..5)
```

Nothing in production (`index.html` / `app.js` / `styles.css` / `dg-system.css`) is touched.
Production bake happens after the founder picks a direction.
