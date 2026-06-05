# Readiness Hero — KEEPER reference (paste verbatim into every mockup)

The Exam Readiness card (`#readiness-card-v2`) is the one component kept **unchanged**
across all five mockups, including its v7.12.0 motion. Do NOT restyle its internals, rename
its ids, or rewrite its animation. Compose your layout *around* it. Each mockup pastes the
three blocks below verbatim and calls `renderReadinessHero(window.HOME_SAMPLE)` on load.

Faithful to live source: `index.html` ~341 (markup), `dg-system.css` 227-248 + 2704-2724
(CSS), `app.js` 8155/8265/8280/8293/8294 + 18085 (count-up, animate, ring, stamp, confetti,
render). Bar geometry: `barPct = ((predicted-420)/450)*100`; pass tick at `((720-420)/450)*100`
= 66.67%. Default data (553) is the non-pass state → stamp reads "167 pts to pass"; flip
predicted ≥ 720 and the ring + "Exam ready" stamp + confetti fire.

Required CSS tokens the host mockup must define (both themes): `--bg --surface --text
--text-mid --text-dim --border --accent --green --yellow`. The hero block also needs
`--dgh-ease` (define `--dgh-ease: cubic-bezier(.2,.8,.2,1);` if not already set).

---

## 1. MARKUP  (place this `.readiness-card` wherever your layout wants the hero)

```html
<div class="card readiness-card" id="readiness-card-v2">
  <div class="readiness-eyebrow">Exam readiness &middot; scaled 100&ndash;900</div>
  <div class="readiness-score"><span class="rc-v2-numwrap"><span class="rc-v2-glow" aria-hidden="true"></span><svg class="rc-v2-ring" viewBox="0 0 600 320" preserveAspectRatio="none" aria-hidden="true"><path d="M306,26 C470,16 590,86 582,164 C574,250 432,300 292,296 C150,292 20,232 24,156 C28,78 152,30 318,32" fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"></path></svg><span id="rc-v2-num">&mdash;</span></span><span>out of 900</span></div>
  <div class="readiness-prob" id="rc-v2-prediction" hidden></div>
  <div class="readiness-bar-track"><span class="readiness-bar-fill" id="rc-v2-bar-fill" style="width:0%"></span><span class="rc-v2-bar-fill-green" id="rc-v2-bar-fill-green" style="width:0%"></span><div class="readiness-bar-mark" aria-hidden="true" style="left:66.67%"></div></div>
  <div class="readiness-range"><span id="rc-v2-delta">&mdash;</span><span>pass mark <b id="rc-v2-passmark">720</b></span></div>
  <div class="readiness-traj" id="rc-v2-trajectory" hidden></div>
  <div class="rc-v2-stamp" aria-hidden="true"><span class="txt">Exam ready</span><svg width="120" height="12" viewBox="0 0 120 12" preserveAspectRatio="none"><path d="M3,7 Q18,2 33,7 Q48,12 63,6 Q78,1 93,7 Q108,12 117,6" fill="none" stroke-width="3" stroke-linecap="round"></path></svg></div>
  <div class="rc-v2-confetti" aria-hidden="true"></div>
</div>
```

Optional: the what-if chips (`HOME_SAMPLE.readiness.whatIf`) are hero-derived data you MAY
render in your layout as "drill these to move your score". Markup the JS targets:
`<div id="rc-v2-whatif" hidden><div id="rc-v2-whatif-row"></div></div>`.

---

## 2. CSS  (paste verbatim; base rules first, then `#readiness-card-v2` overrides)

```css
/* ── Readiness hero · base (dg-system.css 227-248, rescoped) ── */
.readiness-card{position:relative;overflow:hidden;background:linear-gradient(180deg,var(--surface),color-mix(in oklab,var(--surface) 84%,var(--bg)));border:1px solid color-mix(in oklab,var(--accent) 26%,var(--border));border-radius:20px;padding:24px 24px 26px;box-shadow:none;}
.readiness-card::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 80% at 100% 0%,color-mix(in oklab,var(--accent) 9%,transparent),transparent 60%);pointer-events:none;}
.readiness-eyebrow{position:relative;font-size:10.5px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;}
.readiness-score{position:relative;display:flex;flex-direction:column;align-items:baseline;gap:0;font-variant-numeric:tabular-nums;}
.readiness-score #rc-v2-num{display:block;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(94px,11.5vw,140px);line-height:1;letter-spacing:-0.03em;color:var(--text);font-variant-numeric:lining-nums tabular-nums;font-feature-settings:"lnum","tnum";}
.readiness-score span:not(#rc-v2-num){display:block;margin-top:14px;font-family:Inter,-apple-system,sans-serif;font-weight:600;font-size:13.5px;line-height:1;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);}
.readiness-prob{position:relative;font-size:13px;color:var(--text-mid);margin:12px 0 0;line-height:1.5;font-variant-numeric:tabular-nums;}
.readiness-prob b,.readiness-prob strong{color:var(--text);font-weight:700;}
.readiness-prob .prob{font-weight:700;color:var(--text);}
.readiness-prob .prob.low{color:var(--yellow);}
.readiness-prob .prob.med{color:var(--accent);}
.readiness-prob .prob.high{color:var(--green);}
.readiness-prob .ci{color:var(--text-dim);margin-left:8px;}
.readiness-bar-track{position:relative;height:12px;border-radius:99px;background:color-mix(in oklab,var(--text) 12%,transparent);overflow:visible;margin-top:34px;}
.readiness-bar-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),color-mix(in oklab,var(--accent) 64%,var(--yellow)));width:0;transition:width 1.1s var(--dgh-ease,cubic-bezier(.2,.8,.2,1));}
.readiness-bar-mark{position:absolute;top:-7px;bottom:-7px;height:auto;width:2px;background:var(--text-mid);border-radius:1px;}
.readiness-bar-mark::after{content:"PASS 720";position:absolute;top:-17px;left:50%;transform:translateX(-50%);font:800 8px/1 Inter,-apple-system,sans-serif;letter-spacing:0.09em;color:var(--text-mid);white-space:nowrap;}
.readiness-range{display:flex;justify-content:space-between;align-items:baseline;margin-top:24px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;color:var(--text-dim);font-variant-numeric:tabular-nums;}
.readiness-range #rc-v2-delta{font-weight:650;color:var(--text-mid);}
.readiness-range b{color:var(--text);font-weight:700;}
.readiness-traj{position:relative;margin-top:12px;font-size:12px;color:var(--text-dim);line-height:1.5;}
.readiness-traj strong{color:var(--text);font-weight:700;}

/* ── Readiness hero · #readiness-card-v2 celebration overrides (dg-system.css 2704-2724) ── */
#readiness-card-v2{position:relative;overflow:hidden}
#readiness-card-v2 .readiness-score{position:relative}
#readiness-card-v2 #rc-v2-num{position:relative;z-index:2;transition:color .45s ease}
#readiness-card-v2.is-pass .readiness-score #rc-v2-num{color:var(--green)}
#readiness-card-v2 .rc-v2-numwrap{position:relative;display:inline-block;width:fit-content;align-self:flex-start}
#readiness-card-v2 .rc-v2-numwrap #rc-v2-num{display:inline-block!important}
#readiness-card-v2 .rc-v2-glow{position:absolute;left:50%;top:50%;width:150%;height:150%;transform:translate(-50%,-50%);z-index:0;pointer-events:none;opacity:0;background:radial-gradient(50% 50% at 50% 50%,color-mix(in oklab,var(--green) 50%,transparent),transparent 70%);transition:opacity .5s ease}
#readiness-card-v2.is-pass .rc-v2-glow{opacity:1}
#readiness-card-v2 .rc-v2-ring{position:absolute;left:0;top:0;z-index:3;pointer-events:none;overflow:visible;opacity:0;transform-origin:center;transition:opacity .3s ease}
#readiness-card-v2.is-pass .rc-v2-ring{opacity:1}
#readiness-card-v2 .rc-v2-ring path{stroke:var(--green)}
#readiness-card-v2 .readiness-bar-track{position:relative}
#readiness-card-v2 .rc-v2-bar-fill-green{position:absolute;left:0;top:0;height:100%;width:0%;border-radius:99px;z-index:2;opacity:0;background:linear-gradient(90deg,color-mix(in oklab,var(--green) 72%,#000),var(--green));transition:width .8s cubic-bezier(.2,.8,.2,1),opacity .4s ease}
#readiness-card-v2.is-pass .rc-v2-bar-fill-green{opacity:1}
#readiness-card-v2.is-pass .readiness-bar-mark{background:var(--green)}
#readiness-card-v2 .rc-v2-stamp{position:absolute;top:46px;right:16px;z-index:5;pointer-events:none;display:inline-flex;flex-direction:column;align-items:center;gap:4px;padding:6px 12px 8px;border:2px solid var(--green);border-radius:10px;background:color-mix(in oklab,var(--green) 12%,transparent);opacity:0;transform:scale(1.4) rotate(-14deg);transform-origin:center}
#readiness-card-v2 .rc-v2-stamp .txt{font:800 13px/1 'Inter',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--green);white-space:nowrap}
#readiness-card-v2 .rc-v2-stamp svg path{stroke:var(--green)}
#readiness-card-v2 .rc-v2-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:4;border-radius:inherit}
#readiness-card-v2 .rc-v2-confetti i{position:absolute;width:8px;height:12px;border-radius:2px;opacity:0;will-change:transform,opacity}
@media (prefers-reduced-motion:reduce){#readiness-card-v2 #rc-v2-num,#readiness-card-v2 .rc-v2-bar-fill-green,#readiness-card-v2 .rc-v2-glow,#readiness-card-v2 .rc-v2-ring{transition:none}}

/* optional what-if chips (hero-derived) */
#rc-v2-whatif-row{display:flex;flex-wrap:wrap;gap:8px;}
.rc-v2-whatif-chip{display:inline-flex;align-items:center;gap:7px;background:none;border:1px solid color-mix(in oklab,var(--accent) 36%,transparent);color:var(--accent);border-radius:999px;padding:7px 14px;font:600 11px Inter,sans-serif;cursor:pointer;transition:background .18s,border-color .18s,transform .18s;}
.rc-v2-whatif-chip:hover{background:color-mix(in oklab,var(--accent) 9%,transparent);border-color:var(--accent);transform:translateY(-1px);}
@media (prefers-reduced-motion:reduce){.rc-v2-whatif-chip{transition:none;}.rc-v2-whatif-chip:hover{transform:none;}}
```

---

## 3. JS  (paste verbatim; faithful lift of the live functions, wired to HOME_SAMPLE)

```js
/* Readiness hero — faithful lift of app.js v7.12.0 motion.
   animateCount / queueReadinessAnimation / animateReadinessCardV2 /
   drawReadinessRing / showReadinessStamp / fireReadinessConfetti. */
(function () {
  function animateCount(elId, from, to, duration, suffix) {
    const el = document.getElementById(elId); const sfx = suffix || '';
    if (!el || from === to) { if (el) el.textContent = to + sfx; return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * ease) + sfx;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function showReadinessStamp(card, text, warn) {
    const stamp = card.querySelector('.rc-v2-stamp'); if (!stamp) return;
    const t = stamp.querySelector('.txt'); if (t) t.textContent = text;
    const col = warn ? 'var(--yellow)' : 'var(--green)';
    stamp.style.borderColor = col; if (t) t.style.color = col;
    const p = stamp.querySelector('svg path'); if (p) p.style.stroke = col;
    stamp.animate([{ opacity: 0, transform: 'scale(1.4) rotate(-14deg)' }, { opacity: 1, transform: 'scale(1) rotate(-6deg)' }], { duration: 500, delay: 120, easing: 'cubic-bezier(.34,1.8,.64,1)', fill: 'forwards' });
  }
  function fireReadinessConfetti(card) {
    const host = card.querySelector('.rc-v2-confetti'); if (!host) return; host.innerHTML = '';
    const r = host.getBoundingClientRect(); const ox = r.width * 0.3, oy = r.height * 0.4;
    const colors = ['var(--green)', 'var(--accent)', 'var(--text)'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('i'); p.style.left = ox + 'px'; p.style.top = oy + 'px';
      p.style.background = colors[(Math.random() * colors.length) | 0]; host.appendChild(p);
      const ang = (-90 + (Math.random() * 150 - 75)) * Math.PI / 180, dist = 120 + Math.random() * 200;
      const px = Math.cos(ang) * dist, py = Math.sin(ang) * dist;
      const fall = r.height - oy + 60 + Math.random() * 80, rot = Math.random() * 720 - 360;
      p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1, offset: 0 }, { transform: `translate(${px}px,${py}px) rotate(${rot * .5}deg)`, opacity: 1, offset: .35 }, { transform: `translate(${px * 1.3}px,${fall}px) rotate(${rot}deg)`, opacity: 0, offset: 1 }], { duration: 1500 + Math.random() * 900, delay: Math.random() * 160, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    }
  }
  function drawReadinessRing(card) {
    const ring = card.querySelector('.rc-v2-ring'); const num = document.getElementById('rc-v2-num'); const path = ring && ring.querySelector('path');
    if (!ring || !num || !path) return;
    const w = num.offsetWidth, h = num.offsetHeight, l = num.offsetLeft, t = num.offsetTop;
    const rw = w * 1.34, rh = h * 1.06;
    ring.style.width = rw + 'px'; ring.style.height = rh + 'px';
    ring.style.left = (l + w / 2 - rw / 2) + 'px'; ring.style.top = (t + h * 0.46 - rh / 2) + 'px';
    const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
    ring.animate([{ transform: 'rotate(-7deg) scale(.86)' }, { transform: 'rotate(-3deg) scale(1)' }], { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
  }
  function animateReadinessCardV2(pending) {
    const card = document.getElementById('readiness-card-v2'); if (!card || !pending) return;
    if (card.dataset.animated === '1') return; card.dataset.animated = '1';
    const scaled = pending.scaled, barPct = pending.barPct, passLine = pending.passLine || 720;
    const passed = scaled >= passLine;
    const fill = document.getElementById('rc-v2-bar-fill'), green = document.getElementById('rc-v2-bar-fill-green');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const settle = () => {
      const n = document.getElementById('rc-v2-num'); if (n) n.textContent = scaled; // headless-safe: force settled score
      if (green) green.style.width = barPct + '%'; card.classList.toggle('is-pass', passed);
      if (passed) { drawReadinessRing(card); showReadinessStamp(card, 'Exam ready', false); try { fireReadinessConfetti(card); } catch (_) {} }
      else { showReadinessStamp(card, (passLine - scaled) + ' pts to pass', true); }
    };
    if (reduce) { const n = document.getElementById('rc-v2-num'); if (n) n.textContent = scaled; if (fill) fill.style.width = barPct + '%'; if (green) green.style.width = barPct + '%'; settle(); return; }
    if (fill) fill.style.width = barPct + '%'; if (green) green.style.width = barPct + '%';
    animateCount('rc-v2-num', 100, scaled, 1100); setTimeout(settle, 1150);
  }
  function queueReadinessAnimation(scaled, barPct, passLine) {
    const card = document.getElementById('readiness-card-v2'); if (!card) return;
    card._rcPending = { scaled, barPct, passLine };
    if (card.dataset.ioBound === '1') return; card.dataset.ioBound = '1';
    if (!('IntersectionObserver' in window)) { animateReadinessCardV2(card._rcPending); return; }
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) animateReadinessCardV2(card._rcPending); }); }, { threshold: 0.4 });
    io.observe(card);
  }
  // public: render hero text + queue the keeper animation
  window.renderReadinessHero = function (S) {
    const r = (S && S.readiness) || {}; const card = document.getElementById('readiness-card-v2'); if (!card) return;
    card.dataset.animated = '';
    const pm = document.getElementById('rc-v2-passmark'); if (pm) pm.textContent = r.passScore;
    const predEl = document.getElementById('rc-v2-prediction');
    if (predEl && typeof r.passProbability === 'number') {
      const probPct = Math.round(r.passProbability * 100);
      let probClass = 'high'; if (probPct < 50) probClass = 'low'; else if (probPct < 80) probClass = 'med';
      predEl.innerHTML = '<span class="prob ' + probClass + '">' + probPct + '% pass probability</span><span class="ci">&plusmn; ' + r.ciHalfWidth + ' pts</span>';
      predEl.hidden = false;
    }
    const deltaEl = document.getElementById('rc-v2-delta');
    if (deltaEl) deltaEl.textContent = 'range ' + r.lowerBound + '–' + r.upperBound;
    const trajEl = document.getElementById('rc-v2-trajectory');
    if (trajEl && typeof r.daysToExam === 'number') {
      trajEl.innerHTML = '<strong>' + r.daysToExam + ' days</strong> to exam, need <strong>+' + r.targetGap + ' pts</strong> for a confident pass';
      trajEl.hidden = false;
    }
    const whatRow = document.getElementById('rc-v2-whatif-row'), whatWrap = document.getElementById('rc-v2-whatif');
    if (whatRow && Array.isArray(r.whatIf)) {
      whatRow.innerHTML = r.whatIf.map(w => '<button type="button" class="rc-v2-whatif-chip"><span class="pts">+' + w.deltaPredicted + ' pts</span><span class="topic">' + w.topic + '</span></button>').join('');
      if (whatWrap) whatWrap.hidden = false;
    }
    queueReadinessAnimation(r.predicted, r.barPct, r.passScore);
  };
})();
```

Call `renderReadinessHero(window.HOME_SAMPLE)` after the DOM and `_sample-data.js` have loaded.
Re-run it on theme toggle is NOT needed (CSS tokens handle theme); the count-up runs once.
