---
up: "[[Mobile MOC]]"
type: spec
status: approved
cert: all
updated: 2026-10-30
tags: [spec, mobile]
---
# Honest copy, and "Start practising" that starts

From [[2026-10-30-persona-cert-stacker-gaps]] gap 9 and [[2026-10-30-persona-adhd-gaps]] gap 5. The
founder approved it on 30 Oct. It ships in the same bundle as the streak and quiz resume.

## Copy fixes (phone)
| Where | Today | New |
|---|---|---|
| Sign-in welcome | "Real exam questions and a readiness score…" | "Original exam-style questions and a readiness score…" |
| Free, done for today | "Daily Review still moves your readiness, and 15 fresh questions unlock…" | "Daily Review keeps what you've learned sharp, and 15 new questions unlock…" |
| Home, 60-Question SIM | "Closest to the real thing. No timer." | "A long set at exam level. No timer." |
| Progress, drill next | "Drilling here moves your readiness fastest per minute." | "A good place to drill next." |

Why each one is changing:
- **"Real exam questions":** it reads as either a false claim or leaked exam content.
- **"Moves your readiness":** Daily Review doesn't feed readiness.
- **"Closest to the real thing":** the untimed set isn't closest to the real exam; the timed simulator is.
- **"Fastest per minute":** the phone picks the weakest topic, not the topic with the biggest
  readiness impact.

## "Start practising"
After the 30-second check, "Start practising" opens the first question of today's set: 15 for Free,
the recommended quiz for Pro. It works the way the day-0 "Start" button already does. Today it just
returns to Home.

## Rejected approaches
- **Making Daily Review feed readiness** so the old line becomes true: a readiness change, held for
  #139.
- **Switching the phone's drill pick to the readiness-impact ranking:** a bigger change. The honest
  wording is enough for now.

## Related
[[2026-10-30-persona-adhd-gaps]] · [[2026-10-30-persona-cert-stacker-gaps]] · [[Mobile MOC]]
