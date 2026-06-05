# Cert Home Page — redesign mockups

Five standalone redesigns of the Cert Home Page (the screen a user lands on the
instant they click a cert). The founder picks one; nothing here is baked into
production. The hero Exam Readiness card (`#readiness-card-v2`) is the one KEEPER,
reproduced faithfully and unchanged in all five, including its v7.12.0 motion
(score count-up, bar fill, pass stamp, ring, confetti). Everything around it (the
session picker and the custom-quiz configurator) is redesigned per direction.

## Serve locally
```bash
cd "/Users/simioremosu/Desktop/Dev Projects/networkplus-quiz"
python3 -m http.server 3131
# then open http://localhost:3131/mockups/home/mockup-1-command-deck.html  (etc.)
```
Each mockup is a self-contained dual-theme file (light + dark toggle, top-right).

## Shared assets (loaded by every mockup, identical data + identical hero)
- `_sample-data.js` — production-true fixture (`window.HOME_SAMPLE`): cert + code,
  readiness (553 of 900, 5% pass probability, +/- 96, range 457-649, pass mark 720,
  18 days out, "167 pts to pass"), today + streak, the session presets, the 5
  N10-009 domains with exam weights + mastery, and the custom-quiz configurator.
- `_readiness-hero.js` — the keeper hero motion, lifted faithfully from the live
  `app.js` (`renderReadinessHero` + count-up + pass-celebration branch). Do not
  edit per mockup; all five share it so the hero is byte-identical.
- `_HERO-REFERENCE.md` — the keeper spec (markup + CSS + JS) the mockups paste in.

## The five directions

1. **Command Deck / Launchpad** (`mockup-1-command-deck.html`)
   A mission-control console. The readiness hero is the status panel on the left;
   session presets are bold launch controls grouped Quick / Practice / Exam on the
   right, with one recommended run primed at the top and a tactical 5-domain grid
   below. Custom quiz is a right-side slide-over drawer configurator.

2. **Editorial Cover** (`mockup-2-editorial-cover.html`)
   A magazine cover. Big Fraunces masthead, a "your next move" verdict headline
   driven by the data, and the session board as a numbered editorial running-order
   list (not cards). The readiness hero is the feature panel beside it; the domain
   pick is an editorial index. Custom quiz is a centered designed modal.

3. **Bento Board** (`mockup-3-bento.html`)
   An Apple-style tile grid. The readiness hero is the featured tall tile; around
   it sit mixed-size tiles for recommended-next, today's momentum, quick-start,
   practice, exam-sim, the domain quick-pick, and a custom-quiz launcher, with real
   background variation. Custom quiz is a modal that springs open from its tile.

4. **Focused Today Flow** (`mockup-4-today-flow.html`)
   A calm guided single column with coach energy. A warm greeting and a one-line
   verdict sit above the readiness hero, then one primary "next session" button,
   then the session ladder as a quiet grouped list and a simple domain row. Custom
   quiz is a calm centered popup. The least busy of the five.

5. **Mission Select / Arcade** (`mockup-5-mission-select.html`)
   A game-style mission-select screen. The readiness hero is the HUD status panel
   with player-stat readouts beside it; session presets become bold mission cards
   with a primed featured run, standard runs, and darker boss-tier exam sims (with
   labelled difficulty meters). Domains are side missions. Custom quiz is a full
   configurator modal.

## How each was built
Three passes, in order:
1. **Design** (`design-taste-frontend`) — layout, brand, anti-slop, dual theme.
2. **Motion** (`emil-design-eng`) — custom easing, press feedback, hover gating,
   spring modals, one signature moment per direction. The hero keeps its own motion.
3. **Copy** (`humanizer`) — plain, concrete copy; no jargon, no filler.

All five honor `prefers-reduced-motion`, target WCAG AA in both themes, use no
emoji, no em-dashes, no decorative dots, and no left-edge accent rails.
