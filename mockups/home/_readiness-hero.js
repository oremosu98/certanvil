/* ============================================================
   CertAnvil · Cert Home — Readiness Hero KEEPER (shared)
   ------------------------------------------------------------
   Faithful lift of the live v7.12.0 motion (app.js 8155/8265/8280/
   8293/8294 + 18085). Do NOT edit per-mockup; all five share this
   so the hero is byte-identical. Exposes window.renderReadinessHero.
   Call renderReadinessHero(window.HOME_SAMPLE) after the DOM and
   _sample-data.js have loaded. Default data (553) is the non-pass
   state -> "167 pts to pass" stamp; flip predicted >= 720 and the
   ring + "Exam ready" stamp + confetti fire. Reduced-motion gated;
   settle() forces the final score so headless screenshots settle.
   ============================================================ */
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
      const n = document.getElementById('rc-v2-num'); if (n) n.textContent = scaled; // headless-safe
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
