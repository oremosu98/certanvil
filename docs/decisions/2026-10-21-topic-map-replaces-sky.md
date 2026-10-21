---
up: "[[Decisions MOC]]"
type: decision
status: active
cert: all
updated: 2026-10-21
tags: [decision, mobile, design]
---
# The topic Map replaces the Sky constellation on phone Analytics

## Context
Reviewing the Lift B1 E2E on 21 Oct, the founder found the Analytics "Sky" (Knowledge Constellation) too small to read on a phone, said its fixed navy card fitted neither theme, and no longer liked it. It also broke three BRAND.md rules: gradient chrome, hardcoded hex, and an Analytics card that drives no action.

## Decision
On phones, the Sky page becomes a **topic Map**: one row per exam domain with its share of the exam, a tappable square per topic coloured by status from theme tokens (mastered, proficient, developing, weak, untouched), a "Your N weakest topics" action that quizzes exactly the topics it names, and a sheet per topic with mastery, answered, last seen and Drill this topic. Shipped in v8.185.0. Desktop keeps the constellation for now.

## Why
Every topic is readable and tappable at phone size (40px targets, 44pt on the device), the colours follow both themes, and the card leads to an action. The status colours reuse the constellation tiers, so no new data layer.

## Affects
`features/ios-analytics.js` (`_iosMapModel`, `_iosAnalyticsHtml`), `features/analytics.js` (`_computeConstellationData` exported, `_startTopicsQuiz`), `lift-ios.css` (in- section). [[2026-10-21-ios-lift-b1-design]] · [[2026-10-21-ios-lift-b1]]

## Rejected alternatives
- Keep the constellation and make it bigger: still decorative, still off-theme, still no action.
- Coverage bars per domain only: loses the per-topic view and the tap-to-drill.
- A list of weakest topics only: duplicates Progress Insights.

## Related
[[2026-10-19-ios-launch-june-design]] · [[Mobile MOC]] · [[BRAND]]
