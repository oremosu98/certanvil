#!/usr/bin/env node
// scripts/readiness-calibrate.js — measure the difficulty-band offsets that
// readiness v3 uses (features/readiness.js BAND_OFFSET), from a student's own
// answers. Readiness v3 treats each answer as evidence of exam-level ability
// given how hard the question was (one-parameter logistic / Rasch model):
//   P(right | ability θ, band b) = σ(θ − β_b),   β_ExamLevel = 0.
// The offset of a band is how much harder (+) or easier (−) it is than Exam
// Level, in logits. We estimate it from the gap between the band's accuracy and
// Exam Level accuracy, then shrink toward a default prior, weighting the data
// by how many answers back it (inverse-variance).
//
// Usage:  node scripts/readiness-calibrate.js <certanvil-*-backup-*.json>
// Input:  an Export Data file (history rows; v8.149.0+ rows carry byDiff with
//         per-question labels, older rows only the quiz's difficulty setting).
//
// First run (2026-10-11, founder backup, 200 rows): Exam Level 81 answers at
// 92.6%, Hard 20 at 75.0%, Mixed 180 at 88.3%, Foundational none. Result:
// F −1.00 (prior only), H +1.15, M +0.26. Re-run after the exam with more data.
'use strict';
const fs = require('fs');

const PRIOR = { F: -1.0, E: 0, H: 1.0, M: 0 };   // defaults when there is no data
const PRIOR_SD = 0.5;                            // how firmly we hold the defaults

function band(label) {
  const s = String(label || '').toLowerCase();
  if (s.includes('found')) return 'F';
  if (s.includes('hard') || s.includes('tricky')) return 'H';
  if (s.includes('exam')) return 'E';
  return null;
}
const logit = (p) => { p = Math.min(0.995, Math.max(0.005, p)); return Math.log(p / (1 - p)); };

function calibrate(history) {
  const acc = { F: [0, 0], E: [0, 0], H: [0, 0], M: [0, 0] };
  (history || []).forEach(r => {
    if (!r || /^Mixed —|^Exam Simulation/.test(r.topic || '')) return;   // summary rows
    if (r.byDiff && typeof r.byDiff === 'object') {
      Object.keys(r.byDiff).forEach(b => { const v = r.byDiff[b]; const k = acc[b] ? b : 'M'; acc[k][0] += v[0]; acc[k][1] += v[1]; });
    } else {
      const k = band(r.difficulty) || 'M';
      acc[k][0] += r.score || 0; acc[k][1] += r.total || 0;
    }
  });
  const [cE, nE] = acc.E;
  const out = { counts: acc, offsets: { E: 0 } };
  ['F', 'H', 'M'].forEach(b => {
    const [c, n] = acc[b];
    if (!n || !nE) { out.offsets[b] = PRIOR[b]; return; }
    const pB = c / n, pE = cE / nE;
    const obs = logit(pE) - logit(pB);                                    // + = harder than Exam Level
    const se2 = 1 / (n * Math.max(0.01, pB * (1 - pB))) + 1 / (nE * Math.max(0.01, pE * (1 - pE)));
    const wP = 1 / (PRIOR_SD * PRIOR_SD), wO = 1 / se2;
    out.offsets[b] = +((PRIOR[b] * wP + obs * wO) / (wP + wO)).toFixed(2);
    out[b + '_observed'] = +obs.toFixed(2);
  });
  return out;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/readiness-calibrate.js <backup.json>'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const r = calibrate(data.history || data);
  const pct = ([c, n]) => (n ? (100 * c / n).toFixed(1) + '%' : 'n/a');
  ['F', 'E', 'H', 'M'].forEach(b => console.log(b.padEnd(2), String(Math.round(r.counts[b][1])).padStart(5), 'answers', pct(r.counts[b]).padStart(7),
    ' offset', String(r.offsets[b]).padStart(5), r[b + '_observed'] !== undefined ? '(observed ' + r[b + '_observed'] + ')' : ''));
}
module.exports = { calibrate };
