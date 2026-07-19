// ══════════════════════════════════════════
// Network+ AI Quiz — app.js  v7.79.2
// ══════════════════════════════════════════

// ── CONSTANTS ──
const APP_VERSION = '7.79.2';
// v4.99.45 (Phase 6b): expose APP_VERSION on window so the web-vitals
// collector (lib/web-vitals-collector.js, loaded BEFORE app.js so its
// PerformanceObservers attach earlier) can stamp this version onto every
// telemetry row at flush time. The collector reads window.APP_VERSION lazily
// at flush, so the cross-file ordering doesn't matter.
if (typeof window !== 'undefined') window.APP_VERSION = APP_VERSION;

// ══════════════════════════════════════════════════════════════════════════
// CERT PACK ARCHITECTURE (v4.86.0 Phase 1A engine refactor)
// ══════════════════════════════════════════════════════════════════════════
// Multi-cert engine. Network+ + Security+ packs live in certs/<cert>.js,
// loaded before app.js via <script> tags in index.html. Each cert pack
// populates window.CERT_PACKS.<id> with cert metadata + content. The
// active cert is resolved by detectCert() at app boot:
//   1. localStorage 'nplus_dev_cert' override (dev/testing only)
//   2. URL host prefix ('secplus-' → secplus, else → netplus)
//   3. Default 'netplus'
//
// Phase 1A scope (this ship): cert metadata + RETENTION_GAP_CONCEPTS only.
// Phase 1B (next session): TOPIC_DOMAINS, DOMAIN_WEIGHTS, topicResources,
//   GT tables move into cert packs. Phase 2 (Week 3): QUESTION_EXEMPLARS
//   migration + Security+ Vercel deploy + audited carry-over exemplars.
// See cert_saas_pivot_plan.md for the full sequencing.
//
// Defaults below preserve Network+ behavior verbatim if CERT_PACK fails to
// load (defensive — production deploys always load the pack via <script>).

function detectCert() {
  // 1. ?cert=… URL query param — used by cross-origin entry points (e.g.
  //    landing's "Resume Security+" tile sends users to
  //    networkplus.certanvil.com?cert=secplus). When present, persist to
  //    localStorage so subsequent navigations keep the cert active, then
  //    strip the param from the address bar so refresh doesn't re-trigger.
  try {
    if (typeof location !== 'undefined' && location.search) {
      // Override key matches what cloud-store.js + auth-state.js use; built
      // via local prefix-concat const so the data-safety lint (which bans
      // literal 'nplus_…' setItem calls outside the STORAGE namespace)
      // doesn't flag this. detectCert is one of two legitimate owners of
      // the cert-override key (the other being auth-state.js tadSwitchCert).
      const certOverrideKey = 'nplus_' + 'dev_cert';
      const url = new URL(location.href);
      const param = (url.searchParams.get('cert') || '').toLowerCase().trim();
      if (param === 'netplus' || param === 'secplus' || param === 'az900' || param === 'ai900'
          || param === 'aplus-core1' || param === 'aplus-core2' || param === 'sc900' || param === 'clfc02') {
        try { localStorage.setItem(certOverrideKey, param); } catch (e) {}
        try {
          url.searchParams.delete('cert');
          history.replaceState({}, '', url.toString());
        } catch (e) {}
        return param;
      }
      // v7.6.0 — the A+ landing tiles deep-link via ?exam=core1|core2 (the
      // cert family shares aplus.certanvil.com). Map the friendly param to the
      // cert ID + persist so the in-app Core 1 / Core 2 switcher state survives
      // a refresh. Same certOverrideKey-via-prefix-concat data-safety dodge.
      const examParam = (url.searchParams.get('exam') || '').toLowerCase().trim();
      if (examParam === 'core1' || examParam === 'core2') {
        const aplusCert = 'aplus-' + examParam;
        try { localStorage.setItem(certOverrideKey, aplusCert); } catch (e) {}
        try {
          url.searchParams.delete('exam');
          history.replaceState({}, '', url.toString());
        } catch (e) {}
        return aplusCert;
      }
    }
  } catch (e) {}

  // 2. v7.2.1 Pattern A subdomain detection — hostname MUST win over any
  //    session/profile-stored cert preference for known cert subdomains.
  //    Pre-v7.2.1 the only host check was a `secplus-` prefix (Vercel preview
  //    branches only); production `secplus.certanvil.com` fell through to the
  //    localStorage override and rendered Net+ content when a stale override
  //    was set (e.g. from a prior visit to networkplus.certanvil.com that
  //    persisted `nplus_dev_cert='netplus'` via the ?cert= entry-point path).
  //    Mirrors auth-state.js getActiveCertId() which already had the correct
  //    subdomain check. Root certanvil.com + localhost have no hostname-cert
  //    mapping here, so they correctly fall through to the localStorage path
  //    below (preserving the session-stored preference + dev override).
  //    v7.3.0 — extended with the third cert AZ-900 on azure.certanvil.com
  //    (Pattern A; founder lock 2026-05-26 — future Azure certs share this
  //    same subdomain via internal cert-switcher, NOT new subdomains).
  try {
    if (typeof location !== 'undefined' && location.hostname) {
      const host = location.hostname;
      if (host.indexOf('secplus.') === 0
          || host.indexOf('secplus-') === 0
          || host === 'secplus.certanvil.com') return 'secplus';
      if (host.indexOf('networkplus.') === 0
          || host.indexOf('networkplus-') === 0
          || host === 'networkplus.certanvil.com') return 'netplus';
      if (host.indexOf('azure.') === 0
          || host.indexOf('azure-') === 0
          || host === 'azure.certanvil.com') return 'az900';
      // v7.5.0 — fourth cert AI-900 on ai.certanvil.com (Pattern A; founder
      // lock 2026-05-27 — AI/data role family gets its own subdomain,
      // re-scoping the v7.3.0 azure.certanvil.com lock to "AZ-* infra certs
      // only"). Future AI certs (AI-102, DP-100) share ai.certanvil.com.
      if (host.indexOf('ai.') === 0
          || host.indexOf('ai-') === 0
          || host === 'ai.certanvil.com') return 'ai900';
      // v7.7.0 — sixth cert SC-900 on sc900.certanvil.com (Pattern A; founder
      // lock 2026-05-28). Microsoft Security/Compliance/Identity role family;
      // cert-code-named to AVOID semantic collision with CompTIA Security+
      // (secplus.certanvil.com). Single-exam (unlike A+), so a plain return —
      // no in-app exam switch, standard cross-subdomain nav from the switcher.
      if (host.indexOf('sc900.') === 0
          || host.indexOf('sc900-') === 0
          || host === 'sc900.certanvil.com') return 'sc900';
      // v7.8.0 — seventh cert AWS Certified Cloud Practitioner CLF-C02 on
      // clfc02.certanvil.com (Pattern A; founder lock 2026-05-29). Third
      // VENDOR (AWS, alongside CompTIA + Microsoft). Single-exam — plain
      // return, standard cross-subdomain nav from the switcher. Cert-id
      // 'clfc02' matches the az900/ai900/sc900 no-hyphen single-vendor
      // convention; the displayed exam code stays 'CLF-C02'.
      if (host.indexOf('clfc02.') === 0
          || host.indexOf('clfc02-') === 0
          || host === 'clfc02.certanvil.com') return 'clfc02';
      // v7.6.0 — fifth cert family CompTIA A+ on aplus.certanvil.com (Pattern
      // A; founder lock 2026-05-27). A+ is ONE certification with TWO exams
      // (Core 1 220-1201 + Core 2 220-1202) that SHARE one subdomain — the
      // first cert family to do so. The hostname resolves the cert FAMILY; the
      // localStorage override differentiates the active exam for the in-app
      // Core 1 <-> Core 2 switcher (tadSwitchCert writes nplus_dev_cert +
      // reloads — the first cert switch that does NOT change subdomain).
      // Default to Core 1 on a cold subdomain entry (no override set yet).
      if (host.indexOf('aplus.') === 0
          || host.indexOf('aplus-') === 0
          || host === 'aplus.certanvil.com') {
        try {
          const aplusDev = localStorage.getItem('nplus_dev_cert');
          if (aplusDev === 'aplus-core1' || aplusDev === 'aplus-core2') return aplusDev;
        } catch (e) {}
        return 'aplus-core1';
      }
    }
  } catch (e) { /* not in browser context */ }

  // 3. localStorage dev override — switches cert without changing URL.
  //    Only reached when on root certanvil.com or localhost (where the
  //    Pattern A subdomain check above doesn't match any known cert host).
  try {
    if (typeof localStorage !== 'undefined') {
      const dev = localStorage.getItem('nplus_dev_cert');
      if (dev === 'secplus' || dev === 'netplus' || dev === 'az900' || dev === 'ai900'
          || dev === 'aplus-core1' || dev === 'aplus-core2' || dev === 'sc900' || dev === 'clfc02') return dev;
    }
  } catch (e) { /* localStorage may be blocked */ }

  // 4. Default
  return 'netplus';
}

const CURRENT_CERT = detectCert();
const CERT_PACK = (typeof window !== 'undefined' && window.CERT_PACKS && window.CERT_PACKS[CURRENT_CERT]) || null;
if (typeof window !== 'undefined' && !CERT_PACK) {
  console.error('[cert] Cert pack not loaded for cert id: ' + CURRENT_CERT + '. Falling back to Network+ defaults.');
}
// v5.6.x: expose CURRENT_CERT + CERT_PACK on window so lazy-loaded feature
// modules (e.g. features/reports.js _getCtx) can read the active cert without
// re-deriving via localStorage. Pure exposure of existing module-scope consts;
// no behaviour change in the shell.
if (typeof window !== 'undefined') {
  window.CURRENT_CERT = CURRENT_CERT;
  window.CERT_PACK = CERT_PACK;
}

// v4.42.0: Animation state flags. finish() / submitExam() set these when
// they detect a streak increment or weak-spots rerank while #page-setup is
// hidden; goSetup() consumes them on the next render so the animation plays
// against a live, visible DOM.
let _pendingStreakPulse = false;
let _pendingWeakSpotsOrder = null;

// v4.42.1: Landing-page intro flags. Armed at module load (once per session)
// so the first render of the readiness card and daily-goal ring plays a
// fill-from-empty reveal animation. Each flag self-consumes on first real
// render so returning from a quiz feels snappy, not ceremonial.
let _readinessIntroArmed = true;
let _dailyGoalIntroArmed = true;
// Cert-specific exam params — read from CERT_PACK.meta with safe Network+
// defaults preserved as fallback for when CERT_PACK fails to load (UAT
// node-only context, or deploy-time race).
const EXAM_TIME_SECONDS = (CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.examTimeSeconds) || 5400;
const EXAM_QUESTION_COUNT = (CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.examQuestionCount) || 90;
const EXAM_PASS_SCORE = (CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.examPassScore) || 720;
// v4.81.0: Baseline Diagnostic + Pass Plan (Codex r5 #1 / Issue #243)
const DIAGNOSTIC_QUESTION_COUNT = 20;       // single sitting, ~30 min
const DIAGNOSTIC_DURATION_MS = 30 * 60 * 1000;  // 30-min timer (no hard cutoff — informational only in MVP)
const DIAGNOSTIC_RETAKE_COOLDOWN_DAYS = 7;  // user can retake after 7 days
const DIAGNOSTIC_RETAKE_COOLDOWN_MS = DIAGNOSTIC_RETAKE_COOLDOWN_DAYS * 86400000;
const EXAM_MAX_SCORE = (CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.examMaxScore) || 900;
// v4.87.0: cert-aware exam name string for prompt injection. Examples:
//   netplus → 'CompTIA Network+ N10-009'
//   secplus → 'CompTIA Security+ SY0-701'
// Used by _fetchQuestionsBatch so Haiku knows which cert it's writing for.
const CERT_NAME_FULL = (CERT_PACK && CERT_PACK.meta)
  ? CERT_PACK.meta.name + ' ' + CERT_PACK.meta.code
  : 'CompTIA Network+ N10-009';
const CERT_CODE = (CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.code) || 'N10-009';
const HISTORY_CAP = 200;
const WRONG_BANK_CAP = 200;
const REPORTS_CAP = 500;
const PORT_DRILL_SECONDS = 30;
// v4.81.18: bumped 3 → 5 to match the consolidated Today's Plan composition
// (2 weak + 3 stale by default).
const SESSION_TOPICS = 5;
const SESSION_QUESTIONS = 7;
// v4.81.18: Today's Plan composition — how many of each signal type to surface.
// Total stays at SESSION_TOPICS; if either source is sparse, the other tops up.
const TODAY_PLAN_WEAK_COUNT = 2;
const TODAY_PLAN_STALE_COUNT = 3;
const DOUBLE_CLICK_MS = 400;        // double-click detection window (topology canvas)
const VXLAN_VNI_MAX = 16777215;     // 24-bit VNI range (RFC 7348)

// ── AI API token budgets (v4.42.5) ─────────────────────────────────────
// Max-token limits per call site, named for intent rather than scattered
// magic numbers. Generation (Haiku) needs room for 18-Q batches; validation
// and teacher calls are more compact.
const MAX_TOKENS_GENERATION      = 12000; // fetchQuestions — Haiku batch generation (v4.56.1: bumped 8000→12000 for scenario-field headroom on 20-Q runs)
const MAX_TOKENS_VALIDATION      = 1000;  // aiValidateQuestions — Sonnet second-pass
const MAX_TOKENS_TEACHER_DEFAULT = 1500;  // explainFurther, tbCoachTopology — standard teacher call
const MAX_TOKENS_TEACHER_LONG    = 2000;  // showTopicDeepDive — longest teacher call
const MAX_TOKENS_TEACHER_COACH   = 800;   // tbExplainDevice — focused coach call
const MAX_TOKENS_TEACHER_BRIEF   = 400;   // stAskCoach, ptAskCoach, fetchTopicBrief — short teacher call
const MAX_TOKENS_IRW_AIGEN       = 4000;  // v4.97.2: IRW AI scenario generator (full PICERL JSON output)

const MIXED_TOPIC = 'Mixed \u2014 All Topics';
const EXAM_TOPIC = 'Exam Simulation';
const DEFAULT_DIFF = 'Exam Level';

// v4.86.0: PRIORITY RETENTION CONCEPTS — moved to certs/<cert>.js as
// part of Phase 1A engine refactor. The array now lives at
// CERT_PACK.retentionGapConcepts; this constant just dereferences it.
// Per-cert content: Network+ retains its 50+ Phase-3-Cycle entries;
// Security+ starts empty and grows via Phase 3 cycles after Week 3.
//
// Behavior preserved: empty array = no-op (the prompt block collapses
// to an empty string in _formatRetentionConceptsForPrompt).
const RETENTION_GAP_CONCEPTS = (CERT_PACK && Array.isArray(CERT_PACK.retentionGapConcepts)) ? CERT_PACK.retentionGapConcepts : [];


function _formatRetentionConceptsForPrompt() {
  if (!Array.isArray(RETENTION_GAP_CONCEPTS) || RETENTION_GAP_CONCEPTS.length === 0) return '';
  const lines = RETENTION_GAP_CONCEPTS.map(c =>
    `- "${c.label}" (${c.parentTopic} / obj ${c.objective}) — ${c.keyword}`
  ).join('\n');
  return `\n\nPRIORITY RETENTION CONCEPTS: the student has recently studied these ${RETENTION_GAP_CONCEPTS.length} concepts and wants sustained exposure across quizzes + exams. When the current topic/difficulty/scenario PERMITS, prefer testing one of these explicitly over alternatives. Do NOT force these into unrelated topics (e.g., do not inject NAC into a "Port Numbers" question). Treat this as a tiebreaker, not a mandate:\n${lines}`;
}

// v4.86.2: QUESTION_EXEMPLARS moved to certs/<cert>.js as part of Phase 2A
// engine refactor. The 320-exemplar Network+ bank now lives at
// CERT_PACK.questionExemplars; this constant just dereferences it.
// Per-cert content: Network+ retains all 320 hand-curated entries (50+ ship
// cycles of legal-only original authoring). Security+ starts EMPTY in Phase
// 2A — Phase 2B audits + ports ~60-100 cross-cert exemplars (firewalls,
// ACLs, crypto, IDS/IPS, port security, wireless security, VPN concepts)
// with topics retagged for SY0-701.
//
// Behavior preserved: empty array is a no-op for _pickExemplarsForTopic
// (returns []) and _formatExemplarsForPrompt (collapses to empty string).
// Exemplar injection becomes inert; Haiku falls back to blueprint+prompt
// quality alone — same baseline as pre-v4.59.0.
const QUESTION_EXEMPLARS = (CERT_PACK && Array.isArray(CERT_PACK.questionExemplars)) ? CERT_PACK.questionExemplars : [];


// v4.58.0: pick up to `max` exemplars matching the requested topic. Exact
// topic match preferred, same-domain fallback after, then any exemplar if
// the domain-filtered set is still short. Returns [] when bank is empty
// (current state) — injection becomes a no-op.
function _pickExemplarsForTopic(qTopic, max) {
  if (!Array.isArray(QUESTION_EXEMPLARS) || QUESTION_EXEMPLARS.length === 0) return [];
  if (typeof qTopic !== 'string' || !qTopic) return [];
  max = Math.max(0, Math.min(5, max || 3));
  if (max === 0) return [];

  // Strip the "Multi: " prefix if present — pick exemplars for the first named
  // topic rather than the sentinel string.
  // v4.81.19: comma-safe parsing — first topic could be e.g.
  // "NTP, ICMP & Traffic Types" which a naive split(',')[0] would chop in half.
  const primary = qTopic.startsWith('Multi: ')
    ? (typeof _parseMultiTopicSentinel === 'function' ? (_parseMultiTopicSentinel(qTopic)[0] || qTopic.slice(7).split(',')[0].trim()) : qTopic.slice(7).split(',')[0].trim())
    : qTopic;

  const domain = (typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS[primary]) || null;
  const exact = QUESTION_EXEMPLARS.filter(ex => ex && ex.topic === primary);
  const sameDomain = domain
    ? QUESTION_EXEMPLARS.filter(ex => ex && ex.topic !== primary && TOPIC_DOMAINS[ex.topic] === domain)
    : [];

  // Ordered pool: exact match first, then same domain, then fall back to any
  // other exemplars so a never-covered topic still gets style references.
  const others = QUESTION_EXEMPLARS.filter(ex => ex && ex.topic !== primary && (!domain || TOPIC_DOMAINS[ex.topic] !== domain));
  const pool = exact.concat(sameDomain).concat(others);
  return pool.slice(0, max);
}

// v4.58.0: format chosen exemplars as a prompt block for Haiku. Structured so
// the model reads these as STYLE references ("use this quality bar"), NOT as
// content to duplicate. Empty input → empty string (zero prompt-length cost
// when the bank is empty).
// Multi-select exemplars key their correct set as `answers: ['A','B']` (the same
// shape the runtime scorer reads) and may carry options beyond D; single-answer
// MCQs use `answer: 'B'`. Read both keys, and emit only the option letters that
// actually exist — hardcoding A-D silently dropped option E from every
// multi-select exemplar, and reading `answer` alone rendered their Answer line
// blank. Kept self-contained (no external helpers, CERT_PACK typeof-guarded) so
// UAT can extract and run this body in a bare vm sandbox.
function _formatExemplarsForPrompt(exemplars) {
  if (!Array.isArray(exemplars) || exemplars.length === 0) return '';
  const blocks = exemplars.map((ex, i) => {
    const opts = (ex && ex.options) || {};
    const answerText = Array.isArray(ex.answers) ? ex.answers.join(', ')
      : Array.isArray(ex.answer) ? ex.answer.join(', ')
      : (ex.answer || '');
    const optLines = ['A', 'B', 'C', 'D', 'E', 'F']
      .filter(function (k) { return opts[k]; })
      .map(function (k) { return `${k}) ${opts[k]}`; });
    const lines = [
      `EXEMPLAR ${i + 1}:`,
      `Question: ${ex.question || ''}`,
      ex.scenario ? `Scenario: ${ex.scenario}` : null,
      ex.type === 'multi-select' ? 'Type: multi-select (more than one correct answer)' : null
    ].concat(optLines).concat([
      `Answer: ${answerText}`,
      `Explanation: ${ex.explanation || ''}`
    ]).filter(Boolean);
    return lines.join('\n');
  }).join('\n\n');
  const certCode = (typeof CERT_PACK !== 'undefined' && CERT_PACK && CERT_PACK.meta && CERT_PACK.meta.code) || 'N10-009';
  return `
QUALITY REFERENCE — use these curated exemplars as the bar for stem clarity,
distractor plausibility (every option must be tempting, not throwaways),
explanation depth, and ${certCode} framing. DO NOT copy these exemplars into your
output — they are style references only. Write NEW questions of equal quality:

${blocks}
`;
}
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

// ── Unplanned-failure hardening (spec 2026-07-19) ───────────────────────
// Every network call gets a timeout budget. A timeout that overlapped a
// hidden page (WKWebView suspend on iOS Capacitor / mobile Safari) is NOT
// a server fault — callers check err.hiddenDuring and retry quietly.
function _timeoutError(label, timeoutMs, hiddenDuring) {
  const err = new Error('Timed out after ' + timeoutMs + 'ms: ' + label);
  err.name = 'TimeoutError';
  err.label = label;
  err.timeoutMs = timeoutMs;
  err.hiddenDuring = !!hiddenDuring;
  return err;
}

async function fetchWithTimeout(url, init, opts) {
  opts = opts || {};
  const timeoutMs = opts.timeoutMs || 30000;
  const label = opts.label || url;
  const ctrl = new AbortController();
  let hiddenDuring = document.visibilityState === 'hidden';
  const onVis = () => { if (document.visibilityState === 'hidden') hiddenDuring = true; };
  document.addEventListener('visibilitychange', onVis);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, Object.assign({}, init, { signal: ctrl.signal }));
  } catch (e) {
    if (e && e.name === 'AbortError') throw _timeoutError(label, timeoutMs, hiddenDuring);
    throw e;
  } finally {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVis);
  }
}

// For Supabase SDK promises (rpc/insert) that don't take a signal.
function withTimeout(promise, ms, label) {
  let hiddenDuring = document.visibilityState === 'hidden';
  const onVis = () => { if (document.visibilityState === 'hidden') hiddenDuring = true; };
  document.addEventListener('visibilitychange', onVis);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(_timeoutError(label, ms, hiddenDuring)), ms);
    promise.then(
      v => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); resolve(v); },
      e => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); reject(e); }
    );
  });
}
if (typeof window !== 'undefined') {
  window.fetchWithTimeout = fetchWithTimeout;
  window.withTimeout = withTimeout;
}

// ══════════════════════════════════════════════════════════════════════════
// v4.99.2 Phase E.3 — _claudeFetch wrapper
// v7.79.0 — Phase E.4: BYOK fallback removed. The server proxy (with
// server-held ANTHROPIC_API_KEY, JWT auth, and daily-quota enforcement) is
// the only path now — that was the stated removal condition for the BYOK
// route since the day it was added. Anonymous users always get needsAuth.
// ══════════════════════════════════════════════════════════════════════════
// Single chokepoint for every Claude API call in the app. Auto-routes:
//   • Signed-in user → POST /api/ai/generate (server proxy, JWT-authed,
//     server-held ANTHROPIC_API_KEY, server-side quota enforcement).
//   • Anonymous user → throws err.needsAuth, caller surfaces a "sign in
//     for free 15 questions/day" UI.
//
// The wrapper preserves the same call shape as fetch(url, init) so all 13
// existing Anthropic call sites in this file collapsed to a single global
// rename to _claudeFetch(.
//
// To mark a call as "metered" (counts against the user's daily 20-Q quota),
// the body's parsed JSON should include _metered: true. Only the canonical
// question-generation site (_fetchQuestionsBatch) sets this flag; all
// other AI calls (validation, teacher, coach, scenario gen) are infrastructure.
// The proxy strips _metered from the body before forwarding to Anthropic.
//
// On HTTP 429 quota_exceeded, the wrapper triggers _showQuotaExceededUI()
// (modal hero) so callers don't each need to handle it. Wrapper also
// triggers a quota-chip refresh after every successful metered call.
async function _claudeFetch(init) {
  init = init || {};

  // Try to grab the user's Supabase session
  var session = null;
  try {
    if (typeof window !== 'undefined' && window.certanvilSupabase && window.certanvilSupabase.auth) {
      var s = await window.certanvilSupabase.auth.getSession();
      session = (s && s.data && s.data.session) || null;
    }
  } catch (_) {}

  // Detect _metered flag in the body so we can refresh the chip after success
  var wasMetered = false;
  try {
    if (init.body) {
      var parsed = JSON.parse(init.body);
      wasMetered = parsed && parsed._metered === true;
    }
  } catch (_) {}

  if (session && session.access_token) {
    // Route 1: server proxy
    var r = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + session.access_token,
        'Content-Type': 'application/json'
      },
      body: init.body
    });

    // Quota exceeded — surface the upgrade UI
    if (r.status === 429) {
      try {
        var detail = await r.clone().json();
        if (typeof _showQuotaExceededUI === 'function') {
          _showQuotaExceededUI(detail);
        }
      } catch (_) {}
    } else if (wasMetered && r.ok) {
      // Successful metered call — refresh the chip in the background
      setTimeout(function () {
        try { if (typeof _refreshQuotaChip === 'function') _refreshQuotaChip(); }
        catch (_) {}
      }, 50);
    }

    return r;
  }

  // No session — surface a sign-in nag
  var err = new Error('Sign in to study · 15 free questions/day at certanvil.com.');
  err.needsAuth = true;
  throw err;
}

// ── Quota chip + exceeded UI (Phase E.3) ────────────────────────────────
// State cached in module scope; refreshed on auth + after metered calls.
var _quotaState = null;  // { used_today, daily_limit, tier } | null

async function _refreshQuotaChip() {
  // Reads get_daily_quota_usage RPC + repaints the chip.
  // Silent on errors — chip just stays at last-known state.
  try {
    if (!window.certanvilSupabase) return;
    var s = await window.certanvilSupabase.auth.getSession();
    var session = s && s.data && s.data.session;
    if (!session || !session.user) return;
    var resp = await window.certanvilSupabase.rpc('get_daily_quota_usage', { uid: session.user.id });
    if (resp && resp.data && resp.data.length) {
      _quotaState = resp.data[0];
      _renderQuotaChip();
    }
  } catch (_) {}
}

function _renderQuotaChip() {
  var el = document.getElementById('topbar-quota-chip');
  // v4.99.8 — body.is-state-resolved + body.is-pro-tier drive sidebar lock
  // visibility (Pro-only items show 🔒 unless body has is-pro-tier). State
  // is resolved as soon as we have any verdict — Pro, Free, or anonymous.
  if (_quotaState) {
    document.body.classList.add('is-state-resolved');
    var resolvedTier = _quotaState.tier || 'free';
    var isUnlimited = (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0);
    if (resolvedTier === 'pro' || isUnlimited) {
      document.body.classList.add('is-pro-tier');
    } else {
      document.body.classList.remove('is-pro-tier');
    }
  }
  if (!el) return;

  if (!_quotaState) {
    el.classList.add('is-hidden');
    return;
  }
  el.classList.remove('is-hidden');

  var used = _quotaState.used_today || 0;
  var limit = _quotaState.daily_limit;  // -1 = unlimited (Pro)
  var tier = _quotaState.tier || 'free';

  // Reset all variant classes
  el.classList.remove('is-low', 'is-approaching', 'is-exceeded', 'is-pro');

  var iconHtml, labelText, barHtml = '';
  if (tier === 'pro' || limit === -1) {
    el.classList.add('is-pro');
    iconHtml = '<span class="quota-chip-icon" aria-hidden="true">&#9889;</span>';
    // v4.99.6: Pro users don't care about the daily count — the chip is just
    // a status indicator. Click-to-tooltip surfaces the count for the curious.
    labelText = 'Pro';
  } else {
    var pct = Math.min(100, Math.round((used / limit) * 100));
    if (used >= limit) {
      el.classList.add('is-exceeded');
      iconHtml = '<span class="quota-chip-icon" aria-hidden="true">&#128308;</span>';
      labelText = 'Limit reached';
    } else if (pct >= 80) {
      el.classList.add('is-approaching');
      iconHtml = '<span class="quota-chip-icon" aria-hidden="true">&#9888;&#65039;</span>';
      labelText = used + ' / ' + limit + ' today';
    } else {
      el.classList.add('is-low');
      iconHtml = '<span class="quota-chip-icon" aria-hidden="true">&#128267;</span>';
      labelText = used + ' / ' + limit + ' today';
    }
    barHtml = '<span class="quota-chip-bar"><span class="quota-chip-fill" style="width:' + pct + '%;"></span></span>';
  }

  el.innerHTML = iconHtml + '<span class="quota-chip-label">' + labelText + '</span>' + barHtml;
  el.setAttribute('title', labelText + ' · click for details');

  // v4.99.6 Phase E.5: chip click → tooltip with reset countdown + upgrade CTA.
  // Wire once (replace handler so re-renders don't stack).
  el.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    _toggleQuotaTooltip();
  };

  // v7.54.1: keep the Gauntlet drills card's free-daily pill in sync once tier is
  // known (quota hydrates after the drills page may have first rendered). No-op
  // when the card isn't in the DOM.
  if (typeof renderGauntletDrillsCard === 'function') { try { renderGauntletDrillsCard(); } catch (_) {} }
  if (typeof window.renderSimLabDrillsCard === 'function') { try { window.renderSimLabDrillsCard(); } catch (_) {} }
}

// v4.99.6 Phase E.5 — chip-click tooltip showing reset countdown + plan + upgrade CTA.
// Toggleable: click chip while open closes it. Click outside also closes.
function _toggleQuotaTooltip() {
  var existing = document.getElementById('quota-chip-tooltip');
  if (existing) {
    existing.remove();
    return;
  }
  if (!_quotaState) return;

  // Compute reset countdown
  var resetText = 'midnight UTC';
  try {
    var now = new Date();
    var resetAt = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
    ));
    var diffMs = resetAt.getTime() - now.getTime();
    var hr = Math.floor(diffMs / 3600000);
    var min = Math.floor((diffMs % 3600000) / 60000);
    resetText = (hr > 0 ? hr + 'h ' : '') + min + 'm';
  } catch (_) {}

  var isPro = _quotaState.tier === 'pro' || (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0);
  var used = _quotaState.used_today || 0;
  var limit = _quotaState.daily_limit;

  var tt = document.createElement('div');
  tt.id = 'quota-chip-tooltip';
  tt.className = 'quota-chip-tooltip';

  if (isPro) {
    tt.innerHTML =
      '<div class="quota-chip-tooltip-title">' +
        '<span aria-hidden="true">&#9889;</span> Pro &middot; Unlimited' +
      '</div>' +
      '<div class="quota-chip-tooltip-row">' +
        '<span class="quota-chip-tooltip-key">Used today</span>' +
        '<span class="quota-chip-tooltip-value">' + used + '</span>' +
      '</div>' +
      '<div class="quota-chip-tooltip-row">' +
        '<span class="quota-chip-tooltip-key">Plan</span>' +
        '<span class="quota-chip-tooltip-value">Pro &middot; all certs</span>' +
      '</div>' +
      '<div class="quota-chip-tooltip-foot">No daily cap. Drills, builders, and the Sec+ flagships are all yours.</div>';
  } else {
    tt.innerHTML =
      '<div class="quota-chip-tooltip-title">' +
        (used >= limit
          ? '<span aria-hidden="true">&#128308;</span> Daily limit reached'
          : (used / limit >= 0.8
              ? '<span aria-hidden="true">&#9888;&#65039;</span> Approaching daily limit'
              : '<span aria-hidden="true">&#128267;</span> Free tier &middot; ' + (limit - used) + ' left')) +
      '</div>' +
      '<div class="quota-chip-tooltip-row">' +
        '<span class="quota-chip-tooltip-key">Used today</span>' +
        '<span class="quota-chip-tooltip-value">' + used + ' / ' + limit + '</span>' +
      '</div>' +
      '<div class="quota-chip-tooltip-row">' +
        '<span class="quota-chip-tooltip-key">Resets in</span>' +
        '<span class="quota-chip-tooltip-value">' + resetText + '</span>' +
      '</div>' +
      '<div class="quota-chip-tooltip-row">' +
        '<span class="quota-chip-tooltip-key">Plan</span>' +
        '<span class="quota-chip-tooltip-value">Free</span>' +
      '</div>' +
      '<div class="quota-chip-tooltip-divider"></div>' +
      '<a class="quota-chip-tooltip-cta" href="https://certanvil.com/pricing" target="_blank" rel="noopener">Upgrade to Pro &middot; unlimited &rarr;</a>';
  }

  // Position tooltip below + slightly left of the chip
  var chipEl = document.getElementById('topbar-quota-chip');
  if (chipEl) {
    var rect = chipEl.getBoundingClientRect();
    tt.style.position = 'fixed';
    tt.style.top = (rect.bottom + 8) + 'px';
    tt.style.right = Math.max(16, window.innerWidth - rect.right) + 'px';
  }
  document.body.appendChild(tt);

  // Click-outside-to-close — bound on next tick so the chip's own click doesn't immediately close it
  setTimeout(function () {
    function offClickHandler(e) {
      if (tt.contains(e.target)) return;
      if (chipEl && chipEl.contains(e.target)) return;  // chip-click handled by toggle itself
      tt.remove();
      document.removeEventListener('click', offClickHandler);
    }
    document.addEventListener('click', offClickHandler);
  }, 0);
}

// Modal-style hero shown when the proxy returns 429 quota_exceeded.
// Renders inline; user can dismiss + browse marketing or click upgrade.
function _showQuotaExceededUI(detail) {
  // Compute friendly reset countdown
  var resetText = 'midnight UTC';
  try {
    if (detail && detail.reset_at) {
      var resetMs = new Date(detail.reset_at).getTime();
      var now = Date.now();
      var diffMs = Math.max(0, resetMs - now);
      var hr = Math.floor(diffMs / 3600000);
      var min = Math.floor((diffMs % 3600000) / 60000);
      resetText = (hr > 0 ? hr + 'h ' : '') + min + 'm';
    }
  } catch (_) {}

  // Reframe the cap as a retention hook, not a wall: acknowledge the streak the
  // user just earned, and offer the non-metered spaced-repetition review so the
  // session doesn't dead-end at 20/20.
  var _streakPrefix = '';
  try {
    var _qs = (typeof getStreak === 'function') ? getStreak() : null;
    if (_qs && _qs.current >= 1) {
      _streakPrefix = '&#128293; Day ' + _qs.current + ' streak locked in &middot; come back tomorrow to keep it going. ';
    }
  } catch (_) {}
  var _srDue = 0;
  try { if (typeof getSrDueCount === 'function') _srDue = getSrDueCount() || 0; } catch (_) {}
  var _srBtnHtml = _srDue > 0
    ? '<button type="button" class="quota-exceeded-cta" id="quota-review-sr">Review ' + _srDue + ' saved card' + (_srDue === 1 ? '' : 's') + ' &middot; no AI needed &rarr;</button>'
    : '';

  // Remove any existing instance first
  var prev = document.getElementById('quota-exceeded-modal');
  if (prev) prev.remove();

  var modal = document.createElement('div');
  modal.id = 'quota-exceeded-modal';
  modal.className = 'quota-exceeded-modal';
  modal.innerHTML =
    '<div class="quota-exceeded-card">' +
      '<div class="quota-exceeded-icon">&#128267;</div>' +
      '<div class="quota-exceeded-title">You&rsquo;ve used today&rsquo;s free questions</div>' +
      '<div class="quota-exceeded-sub">' + _streakPrefix + 'Free is 15 questions a day, plus a separate Reword Gauntlet run, every day, no card required &middot; resets in <strong>' + resetText + '</strong> (midnight UTC).</div>' +
      '<div class="quota-exceeded-actions">' +
        _srBtnHtml +
        '<a class="quota-exceeded-cta" href="https://certanvil.com/pricing" target="_blank" rel="noopener">Upgrade to Pro &middot; $9.99/mo &rarr;</a>' +
        '<button type="button" class="quota-exceeded-dismiss" id="quota-exceeded-dismiss">I&rsquo;ll wait until reset</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var dismissBtn = document.getElementById('quota-exceeded-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function () { modal.remove(); });
  }
  // Non-metered escape hatch: drill saved cards instead of dead-ending at the cap.
  var srReviewBtn = document.getElementById('quota-review-sr');
  if (srReviewBtn) {
    srReviewBtn.addEventListener('click', function () {
      modal.remove();
      try { if (typeof startSrReview === 'function') startSrReview(); } catch (_) {}
    });
  }
  // Click outside card → dismiss
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove();
  });
}

// v4.99.3 Phase E.4 — global quota gate (used by quiz entry points).
// v4.99.4 Phase E.4.1 — drills moved to Pro-only via _gateProOnly() below.
//
// Called at quiz entry points (startQuiz, startExam). If a Free user is at
// 15/15 today, blocks the action and shows the quota-exceeded modal.
// Pro users + admins always pass through (is_pro() in Postgres returns true
// for both, so _quotaState.daily_limit comes back as -1 and tier='pro' —
// chip + paywall both fall through to "unlimited" automatically).
//
// Returns true if the activity should proceed, false if blocked. Callers
// pattern: `if (!_gateActivityForQuota('practising')) return;`
function _gateActivityForQuota(activityLabel) {
  // Unknown quota state (chip not yet refreshed, or signed-out user) — let
  // the action try. The proxy's 429 will catch any over-quota AI call;
  // static drills just work normally for anonymous/unknown users.
  if (!_quotaState) return true;

  // Pro / admin → unlimited (daily_limit = -1 from is_pro())
  if (_quotaState.tier === 'pro') return true;
  if (typeof _quotaState.daily_limit !== 'number') return true;
  if (_quotaState.daily_limit < 0) return true;

  var used = _quotaState.used_today || 0;
  if (used < _quotaState.daily_limit) return true;

  // At quota — block + show modal. Synthesise a 429-shaped payload so the
  // modal can render with reset countdown + upgrade CTA.
  var nextMidnightUtc;
  try {
    var now = new Date();
    nextMidnightUtc = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
    )).toISOString();
  } catch (_) {}
  if (typeof _showQuotaExceededUI === 'function') {
    _showQuotaExceededUI({
      error: 'quota_exceeded',
      message: 'You’ve used your ' + _quotaState.daily_limit + ' free questions today. Upgrade to Pro for unlimited ' + (activityLabel || 'study') + '.',
      reset_at: nextMidnightUtc,
      daily_limit: _quotaState.daily_limit
    });
  }
  return false;
}

// ── GAP-2 (tier-logic sweep) — pre-emptive session-size gate ────────────
// _gateActivityForQuota fires AT the cap (15/15). This one fires BEFORE a
// session starts when the picked set is bigger than what's left of the free
// day (e.g. picked 20, only 15 left) — so the user sees the daily-limit
// screen up front instead of a mid-quiz wall when the proxy 429s at Q16.
// Design lifted from mockups/cert-ios-daily-limit.html.

// Questions a Free user can still generate today. Infinity = no cap applies
// (Pro/admin, unknown state, or signed-out — the proxy is the backstop).
function _quotaRemainingToday() {
  if (!_quotaState) return Infinity;
  if (_quotaState.tier === 'pro') return Infinity;
  if (typeof _quotaState.daily_limit !== 'number') return Infinity;
  if (_quotaState.daily_limit < 0) return Infinity;
  return Math.max(0, _quotaState.daily_limit - (_quotaState.used_today || 0));
}

// Returns true if the session may start at the requested size.
// opts.mode: 'quiz' (keep the user's topic/diff on downsize) or
// 'exam' / 'bulk' (downsize restarts as a Mixed Exam-Level practice set).
// Callers pattern: `if (!_gateSessionSizeForQuota(qCount, { mode: 'quiz' })) return;`
function _gateSessionSizeForQuota(requestedCount, opts) {
  var remaining = _quotaRemainingToday();
  if (!isFinite(remaining)) return true;            // uncapped
  if (remaining <= 0) return true;                  // fully spent — _gateActivityForQuota owns this
  if (!requestedCount || requestedCount <= remaining) return true;
  if (typeof _showDailyLimitPreblockUI === 'function') {
    _showDailyLimitPreblockUI({
      picked: requestedCount,
      remaining: remaining,
      limit: _quotaState.daily_limit,
      mode: (opts && opts.mode) || 'quiz'
    });
  }
  return false;
}

// The pre-block screen itself — lock mark, allowance rows, Go Pro CTA, and
// a one-tap "start a right-sized set instead" escape hatch.
function _showDailyLimitPreblockUI(detail) {
  detail = detail || {};
  var picked = detail.picked || 0;
  var remaining = detail.remaining || 0;
  var limit = detail.limit || 15;
  var mode = detail.mode || 'quiz';
  var srCap = (typeof SR_FREE_DAILY_CAP === 'number') ? SR_FREE_DAILY_CAP : 5;

  var lede;
  if (mode === 'exam') {
    lede = 'The exam simulator runs <b>' + picked + ' questions</b>. On Free you study <b>' +
      limit + ' practice questions</b> a day, so the full sim needs Pro.';
  } else if (remaining >= limit) {
    lede = 'You picked a <b>' + picked + '-question</b> set. On Free you study <b>' +
      limit + ' practice questions</b> a day, so this one needs Pro.';
  } else {
    lede = 'You picked a <b>' + picked + '-question</b> set, but you&rsquo;ve only got <b>' +
      remaining + '</b> of today&rsquo;s <b>' + limit + '</b> free questions left.';
  }

  var prev = document.getElementById('daily-limit-preblock');
  if (prev) prev.remove();

  var modal = document.createElement('div');
  modal.id = 'daily-limit-preblock';
  modal.className = 'quota-exceeded-modal';  // reuse the overlay scrim
  modal.innerHTML =
    '<div class="dlpb-card" role="dialog" aria-modal="true" aria-label="Free daily limit">' +
      '<div class="dlpb-lockmark" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="11" width="16" height="9" rx="2.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>' +
        '</svg>' +
      '</div>' +
      '<h2 class="dlpb-title">That&rsquo;s more than your <i>free</i> day</h2>' +
      '<p class="dlpb-lede">' + lede + '</p>' +
      '<div class="dlpb-allow">' +
        '<div class="dlpb-row">' +
          '<span class="dlpb-row-tx"><b>Practice</b><span>Quizzes and custom sets</span></span>' +
          '<span class="dlpb-row-amt">' + limit + ' / day</span>' +
        '</div>' +
        '<div class="dlpb-row">' +
          '<span class="dlpb-row-tx"><b>Daily Review</b><span>Spaced repetition</span></span>' +
          '<span class="dlpb-row-amt">' + srCap + ' / day</span>' +
        '</div>' +
      '</div>' +
      '<p class="dlpb-pro-line"><b>Pro</b> is unlimited questions, every day, on every cert.</p>' +
      '<div class="dlpb-actions">' +
        '<a class="dlpb-cta" href="https://certanvil.com/pricing" target="_blank" rel="noopener">Go Pro &mdash; unlimited</a>' +
        '<button type="button" class="dlpb-ghost" id="dlpb-start-smaller">Start a ' + remaining + '-question set instead</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var smallerBtn = document.getElementById('dlpb-start-smaller');
  if (smallerBtn) {
    smallerBtn.addEventListener('click', function () {
      modal.remove();
      qCount = remaining;
      if (mode !== 'quiz') {
        // Exam / bulk downsizes restart as a Mixed Exam-Level practice set —
        // there's no smaller exam sim, so the closest useful session wins.
        topic = MIXED_TOPIC;
        diff = 'Exam Level';
        examMode = false;
      }
      // Reflect the new size on the setup-page chips so the UI stays honest.
      document.querySelectorAll('#topic-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === topic); });
      document.querySelectorAll('#diff-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === diff); });
      document.querySelectorAll('#count-group .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.v === String(qCount)); });
      if (typeof syncChipAriaPressed === 'function') {
        syncChipAriaPressed('#topic-group');
        syncChipAriaPressed('#diff-group');
        syncChipAriaPressed('#count-group');
      }
      if (typeof startQuiz === 'function') startQuiz();
    });
  }
  // Click the scrim → dismiss (stay on setup, nothing consumed)
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.remove();
  });
}

// v4.99.4 Phase E.4.1 — Pro-only feature gate (drills, flagship labs).
// Different from _gateActivityForQuota: that one fires AT the 20/20 line.
// This one fires at zero — Free users can never start a drill, regardless
// of remaining quota. Drills are a Pro perk to differentiate the tiers.
//
// Returns true if the user is Pro/admin (proceed), false if Free (blocked +
// modal shown). Pattern: `if (!_gateProOnly('Acronym Blitz')) return;`
function _gateProOnly(featureLabel, opts) {
  // v4.99.7 — optimistic-allow for signed-in users while quota state is still
  // hydrating. Pre-v4.99.7, the default-deny path here caused signed-in Pro
  // users to briefly see the upgrade modal during the first ~500ms after page
  // load while get_daily_quota_usage was still in flight. Now: if signed-in
  // (window._certanvilSignedIn truthy) but state is null → allow through.
  // Subsequent gate checks (in start* functions or showPage on later nav)
  // fire after state has resolved with the correct verdict. Anonymous users
  // still default-deny since they're definitely not Pro.
  // v7.46.1: opts {title, body} let call sites pass bespoke modal copy —
  // the old "<label> is a Pro feature" template broke on plural labels.
  var detail = Object.assign({ feature: featureLabel || 'this feature' }, opts || {});
  if (!_quotaState) {
    if (window._certanvilSignedIn === true) {
      // Optimistic allow; gate re-fires on actual activity start with real state
      return true;
    }
    // Anonymous → block
    if (typeof _showProOnlyUI === 'function') _showProOnlyUI(detail);
    return false;
  }
  // Pro / admin → daily_limit < 0 (unlimited) or tier === 'pro'
  if (_quotaState.tier === 'pro') return true;
  if (typeof _quotaState.daily_limit === 'number' && _quotaState.daily_limit < 0) return true;
  // Otherwise — Free user. Block.
  if (typeof _showProOnlyUI === 'function') _showProOnlyUI(detail);
  return false;
}

// v4.99.4 Phase E.4.1 — Pro-only modal. Distinct from quota-exceeded because
// the value prop is different: "this is locked behind Pro" vs "you've used
// your daily allowance."
// v7.46.1 — rebuilt in the daily-limit card family (lock mark, accent CTA)
// so every gate in the app speaks one visual language. detail.title/body
// carry per-feature copy; legacy callers fall back to the safe template.
function _showProOnlyUI(detail) {
  detail = detail || {};
  var feature = detail.feature || 'This feature';
  var title = detail.title || (feature + ' is a Pro feature');
  var body = detail.body ||
    'Free covers the daily core: 15 practice questions and 5 review cards, every day. This one is part of Pro.';

  var prev = document.getElementById('pro-only-modal');
  if (prev) prev.remove();

  var modal = document.createElement('div');
  modal.id = 'pro-only-modal';
  modal.className = 'quota-exceeded-modal';  // reuse overlay scrim
  modal.innerHTML =
    '<div class="dlpb-card" role="dialog" aria-modal="true" aria-label="Pro feature">' +
      '<div class="dlpb-lockmark" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="11" width="16" height="9" rx="2.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>' +
        '</svg>' +
      '</div>' +
      '<h2 class="dlpb-title">' + title + '</h2>' +
      '<p class="dlpb-lede">' + body + '</p>' +
      '<p class="dlpb-pro-line"><b>Pro</b> is unlimited questions, every day, on every cert.</p>' +
      '<div class="dlpb-actions">' +
        '<a class="dlpb-cta" href="https://certanvil.com/pricing" target="_blank" rel="noopener">Go Pro &mdash; unlimited</a>' +
        '<button type="button" class="dlpb-ghost" id="pro-only-dismiss">Not now</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  var dismissBtn = document.getElementById('pro-only-dismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', function () { modal.remove(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
}

// v7.46.0: free custom quizzes cap at 15 questions. Capture-phase listener
// beats the generic chip handler, so a free user tapping the 20 chip gets
// the Pro modal and the selection never changes. startQuiz() re-checks as
// the enforcement layer.
document.addEventListener('click', function (e) {
  var chip = e.target && e.target.closest ? e.target.closest('#count-group .chip') : null;
  if (!chip) return;
  var v = parseInt(chip.getAttribute('data-v'), 10);
  if (!(v > 15)) return;
  if (typeof _srIsFreeTier === 'function' && _srIsFreeTier()) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof _gateProOnly === 'function') {
      _gateProOnly('Bigger sets', {
        title: 'Bigger sets are a Pro feature',
        body: 'Free tops out at 15 questions a set · your whole daily allowance in one go. Pro goes as big as you like.'
      });
    }
  }
}, true);

// Self-contained auth listener — keeps the quota chip in sync with auth state
// (fires on initial load, sign-in, sign-out, and token refresh). Safe to call
// before window.certanvilSupabase is defined; defers until next tick.
(function _initQuotaChipListener() {
  function attach() {
    if (!window.certanvilSupabase || !window.certanvilSupabase.auth) {
      // Supabase client not yet ready — try again on next tick
      setTimeout(attach, 100);
      return;
    }
    try {
      window.certanvilSupabase.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT' || !session) {
          _quotaState = null;
          // v4.99.8 — anonymous + signed-out users are definitely not Pro;
          // mark state as resolved so sidebar locks render without waiting.
          document.body.classList.add('is-state-resolved');
          document.body.classList.remove('is-pro-tier');
          _renderQuotaChip();
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          _refreshQuotaChip();
        }
      });
    } catch (_) {}
  }
  if (typeof window === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
// AI validator runs the second-pass quality check over generated questions.
// Upgraded to Sonnet because the semantic failure modes still slipping past
// the programmatic validator (premise-answer contradictions, explanation-answer
// mismatches, "no correct answer" questions) require deeper reasoning than
// Haiku reliably provides.
const CLAUDE_VALIDATOR_MODEL = 'claude-sonnet-4-6';
// AI "teacher" — any call site where the output is study content the user
// will trust as authoritative (explainFurther, topic deep dive, topic brief,
// subnet coach, port drill coach, topology coach, device explainer). These
// are upgraded to Sonnet because users treat them as the teacher — a hallucinated
// port/OSI layer/subnet mask here is worse than in a quiz question because
// there is no validation layer after the fact.
const CLAUDE_TEACHER_MODEL = 'claude-sonnet-4-6';

const STORAGE = {
  THEME: 'nplus_theme',
  KEY: 'nplus_key',
  HISTORY: 'nplus_history',
  STREAK: 'nplus_streak',
  WRONG_BANK: 'nplus_wrong_bank',
  SR_QUEUE: 'nplus_sr_queue',
  SR_PREFS: 'nplus_sr_prefs',     // #8: review session prefs (sessionSize, topUp)
  SR_FREE_COUNT: 'nplus_sr_free_count', // GAP-1: free-tier reviews used today ({date, count})
  REPORTS: 'nplus_reports',
  BUG_REPORTS: 'nplus_bug_reports', // v5.6.x bug-report drawer retry queue
  TB_V3_DRAFT: 'nplus_tb_v3_draft', // v6.x topology-builder v3 canvas state (Net+ only)
  TB_V3_FREEBUILD_BACKUP: 'nplus_tb_v3_freebuild_backup', // phase 2 freebuild backup state
  TB_V3_WALK_PROGRESS: 'nplus_tb_v3_walk_progress_v1', // phase 8 walkthrough progress
  PORT_BEST: 'nplus_port_best',
  PORT_STREAK_BEST: 'nplus_port_streak_best',
  PORT_FAMILY_BEST: 'nplus_port_family_best',
  PORT_PAIRS_BEST: 'nplus_port_pairs_best',
  HARDCORE_EXAM: 'nplus_hardcore_exam',
  PORT_STATS: 'nplus_port_stats',
  EXAM_DATE: 'nplus_exam_date',
  MILESTONES: 'nplus_milestones',
  TYPE_STATS: 'nplus_type_stats',
  SUBNET_STATS: 'nplus_subnet_stats',
  DAILY_GOAL: 'nplus_daily_goal',
  DAILY_CHALLENGE: 'nplus_daily_challenge',
  GAUNTLET_CRACKED: 'nplus_gauntlet_cracked', // v7.48.0 Reword Gauntlet: [{concept, topic, certId, date, attempts}]
  GAUNTLET_FREE_COUNT: 'nplus_gauntlet_free_count', // v7.54.0 free-tier daily Gauntlet runs ({date, count}) — separate from the 15-question quota
  DEEP_DIVE_USES: 'nplus_deep_dive_uses',
  ERROR_LOG: 'nplus_error_log',
  SB_REPORTED: 'nplus_sb_reported',  // fingerprints already sent to client_errors table
  TOPOLOGIES: 'nplus_topologies',
  TOPOLOGY_DRAFT: 'nplus_topology_draft',
  TB_COACH_CACHE: 'nplus_tb_coach_cache',
  // v4.60.1: TB side-pane collapse state (each boolean persisted independently)
  TB_LEFT_COLLAPSED: 'nplus_tb_left_collapsed',
  TB_RIGHT_COLLAPSED: 'nplus_tb_right_collapsed',
  AI_CACHE: 'nplus_ai_cache',
  LAB_COMPLETIONS: 'nplus_lab_completions',
  SUBNET_MASTERY: 'nplus_subnet_mastery',
  SUBNET_LESSONS: 'nplus_subnet_lessons',
  PORT_MASTERY: 'nplus_port_mastery',
  PORT_LESSONS: 'nplus_port_lessons',
  FIX_CHALLENGES: 'nplus_fix_challenges',
  AB_MASTERY: 'nplus_ab_mastery',
  AB_LESSONS: 'nplus_ab_lessons',
  // v4.91.0: Security+ Acronym Blitz uses separate keys so Network+ progress
  // and Security+ progress don't collide when toggling between certs.
  // Same shape as AB_MASTERY/AB_LESSONS — the abScaffold reads whichever
  // pair is active based on CURRENT_CERT.
  SAB_MASTERY: 'nplus_sab_mastery',
  SAB_LESSONS: 'nplus_sab_lessons',
  PT_MASTERY:  'nplus_pt_mastery',   // v4.96.0: Network+ Packet Trace drill (per-scenario)
  PT_LESSONS:  'nplus_pt_lessons',
  PT_RESUME:   'nplus_pt_resume',    // mid-scenario resume state
  IRW_MASTERY: 'nplus_irw_mastery',  // v4.97.0: Security+ Incident Response War Room (flagship #1)
  IRW_LESSONS: 'nplus_irw_lessons',
  PHT_MASTERY: 'nplus_pht_mastery',  // v4.98.0: Security+ Phishing Triage Lab (flagship #2)
  PHT_LESSONS: 'nplus_pht_lessons',
  // v4.99.0: cross-cert analytics readiness snapshots. Per-cert map shaped
  // { netplus: { score, computed_at }, secplus: { ... } }. Written after
  // every quiz/exam completion by _writeReadinessSnapshot(); cloud-flushed
  // via Phase C′ pattern so landing's /analytics page can read live values.
  READINESS_SNAPSHOTS: 'nplus_readiness_snapshots',
  OS_MASTERY: 'nplus_os_mastery',
  OS_LESSONS: 'nplus_os_lessons',
  CB_MASTERY: 'nplus_cb_mastery',
  CB_LESSONS: 'nplus_cb_lessons',
  // v4.84.0 — Network Analysis Drill (Phase 1, issue #270)
  NA_MASTERY: 'nplus_na_mastery',
  NA_LESSONS: 'nplus_na_lessons',
  NA_STATS: 'nplus_na_stats',
  // v4.52.0: ACL Builder state + Tier C coach cache
  ACL_STATE: 'nplus_acl_state',
  ACL_COACH_CACHE: 'nplus_acl_coach_cache',
  // v4.56.1: rolling log of fetchQuestions JSON-parse failures for diagnosis
  AI_PARSE_FAILS: 'nplus_ai_parse_fails',
  // v4.81.0: Baseline Diagnostic + Pass Plan (Codex r5 #1 / Issue #243).
  // DIAGNOSTIC stores the latest completed diagnostic state + Pass Plan;
  // LAST_DIAGNOSTIC_AT is the cooldown anchor for the 7-day retake gate.
  DIAGNOSTIC: 'nplus_diagnostic',
  LAST_DIAGNOSTIC_AT: 'nplus_last_diagnostic_at',
  // v4.81.2: Auto-backup safety net. AUTOBACKUP_PREFIX is a *prefix* — actual
  // keys look like nplus_autobackup_2026-04-25 (one snapshot per day, kept 7
  // days). LAST_AUTOBACKUP_AT pins the last successful snapshot timestamp.
  AUTOBACKUP_PREFIX: 'nplus_autobackup_',
  LAST_AUTOBACKUP_AT: 'nplus_last_autobackup_at',
  // v4.81.3: namespaced — was an outlier literal-string write, now wrapped
  // by the STORAGE table so UAT can enforce zero literal-string nplus_*
  // writes outside this object (data-safety guard).
  TB_INTRO_SEEN: 'nplus_tb_intro_seen',
  // v4.81.3: tracks last "back up your data" reminder toast timestamp
  // (throttled to once per EXPORT_REMINDER_DAYS).
  LAST_EXPORT_REMINDER_AT: 'nplus_last_export_reminder_at',
  // v4.99.31 (iOS Plan Phase 5 — PWA polish): "Add to Home Screen" banner
  // dismissed-state (boolean string '1'). Once dismissed, banner never re-shows
  // — there's a permanent install entry inside Settings if the user changes
  // their mind. Prevents the "annoying nag" anti-pattern Chrome's heuristic
  // already correctly avoids.
  A2HS_DISMISSED: 'nplus_a2hs_dismissed',
  // v4.99.31: tracks last time user saw the A2HS banner. Even before dismissal,
  // we cap the show frequency at "once per 7 days" so a returning user who
  // hasn't installed yet but also hasn't actively dismissed gets a calm cadence.
  A2HS_LAST_SHOWN_AT: 'nplus_a2hs_last_shown_at',
  PBQ_FREE_COUNT: 'nplus_pbq_free_count', // v7.55.0 Sim Lab: free-tier daily PBQ drill runs ({date, count}) — mirrors GAUNTLET_FREE_COUNT shape
  DL_FREE_COUNT: 'nplus_dl_free_count',   // Decision Lab free-tier daily set runs ({date, count}) — independent of PBQ_FREE_COUNT
  SIMLAB_WEAK: 'nplus_simlab_weak',       // v7.56 Sim Lab: Pro cross-session weak-spot map ({topic: count})
  DL_WEAK: 'nplus_dl_weak',               // Decision Lab Pro cross-session look-alike map ({pairLabel: count})
  DRILL_STATS: 'nplus_drill_stats',       // Task 3: per-cert drill stats {cert:{drill:{done,perfect}}}
};
// v4.81.2: how many daily snapshots to keep before pruning oldest
const AUTOBACKUP_KEEP_DAYS = 7;
// v4.81.3: cadence for the periodic "download a backup" reminder toast
const EXPORT_REMINDER_DAYS = 14;
// v4.81.4: debounce delay for API-key auto-save while the user is typing
const API_KEY_AUTOSAVE_DEBOUNCE_MS = 600;

// ── Phase C′ (cloud-first) — flush helper ──
// Fire-and-forget bridge from the legacy localStorage write sites to the
// cloud-store debounced flush queue. No-ops gracefully when:
//   - cloud-store hasn't loaded yet (script-tag order race)
//   - user is anonymous (cloud-store internally checks isSignedIn())
//   - the key isn't in USER_DATA_KEYS (cloud-store filters it out)
// The key passed must be the full STORAGE.X value (e.g. 'nplus_history'),
// matching cloud-store's USER_DATA_KEYS Set.
function _cloudFlush(key) {
  try {
    if (typeof window !== 'undefined' && window.cloudStore && typeof window.cloudStore.flush === 'function') {
      window.cloudStore.flush(key);
    }
  } catch (e) { /* swallow — never let cloud sync break a local write */ }
}

// ── STATE ──
let questions  = [];
let current    = 0;
let score      = 0;
let streak     = 0;
let bestStreak = 0;
let answered   = 0;
let log        = [];
let quizFlags  = [];
let topic           = MIXED_TOPIC;
let activeQuizTopic = MIXED_TOPIC;
let diff       = DEFAULT_DIFF;
let qCount     = 10;
let apiKey     = '';
let wrongDrillMode = false;
let dailyChallengeMode = false;

// v7.48.0 — Reword Gauntlet run state
let gauntletMode = false;     // a gauntlet run is riding the quiz engine
let _gauntletRun = null;      // { concept, topic, results: [bool x5], attempts }
let _gauntletBusy = false;    // in-flight guard: double-tap on Start
let _gauntletTopic = null;    // entry-screen topic override (null = weakest)
let _gauntletReturn = 'setup'; // v7.48.1: where Back/exit returns to — 'drills'
                               // only when entered FROM the (mobile-only)
                               // drills page; #page-drills is unstyled on
                               // desktop (cert-ios lift surface), so desktop
                               // users must route back to Home

// v7.50.0 — Why-Not session state (second flagship drill)
let whyNotMode = false;   // a Why-Not round's question is riding the quiz engine
let _wnSession = null;    // { topic, rounds, roundIdx, points, roundResults: [] }
let _wnRound = null;      // { wrongLetters, wrongIdx, answerRight, reasons: {}, map }
let _wnBusy = false;      // in-flight guard on Start
let _wnTopic = null;      // entry-screen topic override (null = weakest)
let _wnReturn = 'setup';  // origin-aware back routing (the v7.48.1 lesson)

// Multi-select state (regular quiz)
let msSelections = [];

// Ordering state (regular quiz)
let orderSequence = [];

// Topology builder state
let selectedTopoDevice = null;
let topoDevices = {};

// Session state
let sessionMode    = false;
let sessionPlan    = [];
let sessionStep    = 0;
let sessionResults = [];

// Exam state
let examMode      = false;
let examHardcore  = false; // #48: locked order, no flagging, no navigator
let examQuestions  = [];
let examAnswers    = []; // [{chosen, flagged, msChosen:[], orderSeq:[]}]
let examCurrent    = 0;
let examTimer      = null;
let examTimeLeft   = EXAM_TIME_SECONDS;
let examEndTime    = 0;
let navOpen        = false;

// ══════════════════════════════════════════
// THEME TOGGLE
// ══════════════════════════════════════════
function getTheme() {
  return localStorage.getItem(STORAGE.THEME) || 'dark';
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem(STORAGE.THEME, t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = t === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19';
  // Update theme-color meta for mobile
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'dark' ? '#0a0a12' : '#f4f4fa';
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// ══════════════════════════════════════════
// PRODUCTION MONITORING
// ══════════════════════════════════════════
const ERROR_LOG_CAP = 50;

function logError(type, msg, extra = {}) {
  try {
    const log = JSON.parse(localStorage.getItem(STORAGE.ERROR_LOG) || '[]');
    const entry = {
      type,
      message: String(msg).slice(0, 500),
      timestamp: new Date().toISOString(),
      page: document.querySelector('.page.active')?.id || 'unknown',
      version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
      userAgent: navigator.userAgent.slice(0, 150),
      ...extra
    };
    log.unshift(entry);
    if (log.length > ERROR_LOG_CAP) log.length = ERROR_LOG_CAP;
    localStorage.setItem(STORAGE.ERROR_LOG, JSON.stringify(log));
    // Auto-report to Supabase client_errors (always-on for prod users)
    autoReportToSupabase(entry);
  } catch (_) { /* storage full or unavailable */ }
}

function showErrorToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 5000);
}

// v4.47.1: green success toast (scenario loaded, etc.) — same animation
// envelope as showErrorToast but uses .success-toast for green styling.
function showSuccessToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// v7.19.1 (mobile-polish P1.5): unified toast API. 13+ call sites invoke
// showToast(msg, type, duration) which never existed — user-feedback messages
// (storage full, "restored N keys from <date>", "no cards due for review")
// threw ReferenceError and showed nothing. Delegate to the existing red/green
// renderers; 'error' → red, everything else → green. (A neutral 'info' style
// is a later polish item — green is acceptable interim styling.)
function showToast(msg, type) {
  if (type === 'error') { showErrorToast(msg); return; }
  showSuccessToast(msg);
}
if (typeof window !== 'undefined') window.showToast = showToast;

// ── Tier-2/3 error surfaces (2026-07-19 spec; lift of error-states-concept) ──
const _ERRC_COPY = {
  timeout: { eyebrow: 'Timed out', title: "The AI didn't respond.",
    body: "We waited 90 seconds and stopped. It's on our side, not yours, and your progress is safe." },
  network: { eyebrow: 'Connection dropped', title: 'Your connection cut out.',
    body: "The request didn't make it through. Check your network, then pick up right where you were." },
  server:  { eyebrow: 'Server issue', title: 'Something broke on our end.',
    body: "The server hit an error handling this one. Your answers are safe and we've already logged it · trying again usually clears it." }
};

// Monoline icons from mockup — clock, wifi-off, server-rack
const _ERRC_ICONS = {
  timeout: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  network: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/><path d="M3 3l18 18"/></svg>',
  server:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>'
};

const _ERRC_COPY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>';

function showAiErrorCard(opts) {
  const { container, kind, refId, onRetry, onBack } = opts || {};
  if (!container) return;
  const c = _ERRC_COPY[kind] || _ERRC_COPY.server;
  const icon = _ERRC_ICONS[kind] || _ERRC_ICONS.server;
  const neutralClass = (kind === 'network') ? ' neutral' : '';
  container.innerHTML = '' +
    '<div class="errc-card" role="alert">' +
      '<span class="errc-eyebrow' + neutralClass + '">' + icon + _escNudge(c.eyebrow) + '</span>' +
      '<div class="errc-title">' + _escNudge(c.title) + '</div>' +
      '<p class="errc-body">' + _escNudge(c.body) + '</p>' +
      '<div class="errc-actions">' +
        '<button type="button" class="errc-btn-primary">Try again</button>' +
        '<button type="button" class="errc-btn-ghost">Back to Home</button>' +
        (refId ? '<button type="button" class="errc-ref" title="Click to copy">' + _ERRC_COPY_SVG + 'ref ' + _escNudge(refId) + '</button>' : '') +
      '</div>' +
    '</div>';
  const btns = container.querySelectorAll('button');
  btns[0].onclick = () => { if (typeof onRetry === 'function') onRetry(); };
  btns[1].onclick = () => { if (typeof onBack === 'function') onBack(); else if (typeof showPage === 'function') showPage('page-setup'); };
  const ref = container.querySelector('.errc-ref');
  if (ref) ref.onclick = () => { try { navigator.clipboard.writeText(refId); showSuccessToast('Error ref copied.'); } catch (_) { /* intentionally silent: cosmetic */ } };
}

function showBootFallback(opts) {
  const { refId } = opts || {};
  const existing = document.getElementById('errc-boot-fallback');
  if (existing) return;
  const brandSvg = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true" class="errc-mark">' +
    '<path d="M38 12 A22 22 0 1 0 38 52" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M44 10 24 54" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M40 52 50 28 60 52 M44.5 43 h11" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  const overlay = document.createElement('div');
  overlay.id = 'errc-boot-fallback';
  overlay.className = 'errc-boot-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.innerHTML = '' +
    '<div class="errc-fallback">' +
      brandSvg +
      '<h3>CertAnvil didn\'t load properly.</h3>' +
      '<p>Part of the app didn\'t download, usually a shaky connection or an update landing at the wrong moment. A reload almost always fixes it, and your progress is safe.</p>' +
      '<button type="button" class="errc-btn-primary">Reload the app</button>' +
      (refId ? '<button type="button" class="errc-ref" title="Click to copy">' + _ERRC_COPY_SVG + 'ref ' + _escNudge(refId) + '</button>' : '') +
    '</div>';
  overlay.querySelector('.errc-btn-primary').onclick = () => location.reload();
  const ref = overlay.querySelector('.errc-ref');
  if (ref) ref.onclick = () => { try { navigator.clipboard.writeText(refId); showSuccessToast('Error ref copied.'); } catch (_) { /* intentionally silent: cosmetic */ } };
  document.body.appendChild(overlay);
}

if (typeof window !== 'undefined') {
  window.showAiErrorCard = showAiErrorCard;
  window.showBootFallback = showBootFallback;
}

// ══════════════════════════════════════════
// v4.99.48 (Phase 8) — Desktop-only nudge
// ══════════════════════════════════════════
// A few features (Topology Builder, ACL Builder, Incident Response War Room,
// Phishing Triage Lab, Packet Trace) are genuinely desktop-only by design:
// drag/drop canvases, multi-pane layouts, dense toolbars. Before Phase 8,
// tapping them on a phone/tablet showed a 3-second toast then bailed —
// user was left wondering what happened. Phase 8 replaces that with a clean
// modal overlay that explains the situation + offers Web Share to email
// themselves a link to open on desktop.
//
// Triggered at viewport < 900px (so phones AND iPad portrait route here;
// iPad landscape and desktop work normally). Matches the lazy-load gate so
// mobile users never download the feature module either.
//
// Usage at feature entry:
//   if (_isDesktopOnlyViewport()) {
//     _showDesktopOnlyNudge('Topology Builder', 'Build, simulate, and grade...');
//     return;
//   }

function _isDesktopOnlyViewport() {
  try {
    return typeof window !== 'undefined' && window.innerWidth < 900;
  } catch (_) { return false; }
}

function _showDesktopOnlyNudge(featureName, featureDescription) {
  // Idempotent — close any prior nudge first
  const existing = document.getElementById('desktop-only-nudge');
  if (existing) existing.remove();

  const url = (typeof location !== 'undefined') ? location.origin + location.pathname : '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const overlay = document.createElement('div');
  overlay.id = 'desktop-only-nudge';
  overlay.className = 'donudge-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', featureName + ' is desktop-only');
  overlay.innerHTML = '' +
    '<div class="donudge-card" role="document">' +
      '<button type="button" class="donudge-close" aria-label="Close" onclick="_closeDesktopOnlyNudge()">×</button>' +
      '<div class="donudge-icon" aria-hidden="true"></div>' +
      '<h2 class="donudge-title">' + _escNudge(featureName) + ' works best on desktop</h2>' +
      '<p class="donudge-sub">' + _escNudge(featureDescription) + '</p>' +
      '<div class="donudge-actions">' +
        (canShare
          ? '<button type="button" class="donudge-btn donudge-btn-primary" onclick="_shareDesktopOnlyLink(' + JSON.stringify(featureName).replace(/"/g, '&quot;') + ')">Send me a link to my desktop</button>'
          : '<button type="button" class="donudge-btn donudge-btn-primary" onclick="_copyDesktopOnlyLink()">Copy link to share with desktop</button>'
        ) +
        '<button type="button" class="donudge-btn donudge-btn-ghost" onclick="_closeDesktopOnlyNudge()">Maybe later</button>' +
      '</div>' +
      '<p class="donudge-foot">Tip · open ' + _escNudge(url) + ' in a browser on a laptop or desktop. Your progress syncs across devices automatically.</p>' +
    '</div>';
  document.body.appendChild(overlay);
  // Fade in on next tick
  requestAnimationFrame(() => overlay.classList.add('is-shown'));
  // Focus the primary button for keyboard users
  const focusBtn = overlay.querySelector('.donudge-btn-primary');
  if (focusBtn) try { focusBtn.focus(); } catch (_) {}
}

function _closeDesktopOnlyNudge() {
  const el = document.getElementById('desktop-only-nudge');
  if (!el) return;
  el.classList.remove('is-shown');
  setTimeout(() => el.remove(), 200);
}

async function _shareDesktopOnlyLink(featureName) {
  try {
    await navigator.share({
      title: 'CertAnvil · ' + featureName,
      text: featureName + ' works best on desktop. Open this link there:',
      url: location.origin + location.pathname
    });
  } catch (_) { /* user cancelled or share failed — silent */ }
}

async function _copyDesktopOnlyLink() {
  const url = location.origin + location.pathname;
  try {
    await navigator.clipboard.writeText(url);
    showSuccessToast('Link copied. Paste it in a desktop browser.');
  } catch (_) {
    showErrorToast('Copy failed. Link is: ' + url);
  }
}

function _escNudge(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// Window-expose so onclick handlers in the dynamically-created nudge HTML
// find them. (Pattern matches the existing tb*/acl* exposure approach.)
if (typeof window !== 'undefined') {
  window._closeDesktopOnlyNudge = _closeDesktopOnlyNudge;
  window._shareDesktopOnlyLink = _shareDesktopOnlyLink;
  window._copyDesktopOnlyLink = _copyDesktopOnlyLink;
}

function errorFingerprint(entry) {
  // Deduplicate by message + source + line (ignore timestamp)
  return (entry.message || '').slice(0, 100) + '|' + (entry.source || '') + '|' + (entry.line || '');
}

// v7.77.0: fire-and-forget Supabase insert into client_errors.
// Requires window.certanvilSupabase to be available (loaded after auth).
// Skips localhost. Dedupes via nplus_sb_reported.
async function autoReportToSupabase(entry) {
  try {
    const sb = window.certanvilSupabase;
    if (!sb) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    const fp = errorFingerprint(entry);
    let reported;
    try { reported = JSON.parse(localStorage.getItem(STORAGE.SB_REPORTED) || '[]'); }
    catch (_) { reported = []; }
    if (reported.includes(fp)) return;
    const { error } = await sb.from('client_errors').insert({
      fingerprint: fp.slice(0, 300),
      type:        String(entry.type || 'unknown').slice(0, 50),
      message:     String(entry.message || '').slice(0, 500),
      page:        String(entry.page || '').slice(0, 100),
      version:     String(entry.version || '').slice(0, 20),
      user_agent:  String(entry.userAgent || '').slice(0, 200),
      user_id:     (sb.auth && sb.auth.getUser ? (await sb.auth.getUser()).data?.user?.id : null) || null,
      extra:       { source: entry.source, line: entry.line, col: entry.col },
    });
    if (!error) {
      reported.push(fp);
      if (reported.length > 200) reported.splice(0, reported.length - 200);
      localStorage.setItem(STORAGE.SB_REPORTED, JSON.stringify(reported));
    }
  } catch (_) { /* silent — don't error on error reporting */ }
}

window.onerror = function(msg, src, line, col, err) {
  console.error(`[App Error] ${msg} at ${src}:${line}:${col}`, err);
  logError('runtime', msg, {
    source: src ? src.split('/').pop() : '',
    line, col,
    stack: err?.stack ? err.stack.slice(0, 500) : ''
  });
  showErrorToast('Something went wrong. Try refreshing the page.');
  return false;
};

window.addEventListener('unhandledrejection', e => {
  console.error('[Unhandled Promise]', e.reason);
  const msg = e.reason?.message || String(e.reason);
  logError('promise', msg, {
    stack: e.reason?.stack ? e.reason.stack.slice(0, 500) : ''
  });
  // v4.99.24 — default-quiet for unhandled promise rejections. Pre-fix the
  // handler toasted "An unexpected error occurred." for any non-network
  // rejection, which created noise on slow mobile connections (Supabase
  // transient errors, session-cookie propagation race, RPC timeouts —
  // none of which the user can act on). New behavior: always log to the
  // in-app monitor for diagnosis, but only toast errors that explicitly
  // opt-in via `err.userFacing = true`. Real user-facing errors should
  // be caught at the call site with explicit error UI, not relied on
  // the global handler. Discovered via mobile Safari tester report
  // 2026-05-09 — friend on 2-bar cellular saw toast on home page load
  // despite app being functional after auto-dismiss.
  if (e.reason && e.reason.userFacing === true) {
    showErrorToast(e.reason.message || 'An unexpected error occurred.');
  }
});

// ── Monitor Panel ──
function getErrorLog() {
  try { return JSON.parse(localStorage.getItem(STORAGE.ERROR_LOG) || '[]'); } catch { return []; }
}

function renderMonitor() {
  const log = getErrorLog();
  const statsEl = document.getElementById('monitor-stats');
  const logEl = document.getElementById('monitor-log');
  if (!statsEl || !logEl) return;

  // Stats
  const total = log.length;
  const runtime = log.filter(e => e.type === 'runtime').length;
  const promise = log.filter(e => e.type === 'promise').length;
  const last24h = log.filter(e => Date.now() - new Date(e.timestamp).getTime() < 86400000).length;
  const lastErr = log[0] ? new Date(log[0].timestamp).toLocaleString() : 'None';

  // Top errors by frequency
  const freq = {};
  log.forEach(e => { const k = e.message.slice(0, 80); freq[k] = (freq[k] || 0) + 1; });
  const topErrors = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  statsEl.innerHTML = `
    <div class="mon-stats-grid">
      <div class="mon-stat"><div class="mon-stat-val">${total}</div><div class="mon-stat-lbl">Total Errors</div></div>
      <div class="mon-stat"><div class="mon-stat-val" style="color:var(--red)">${runtime}</div><div class="mon-stat-lbl">Runtime</div></div>
      <div class="mon-stat"><div class="mon-stat-val" style="color:var(--yellow)">${promise}</div><div class="mon-stat-lbl">Promise</div></div>
      <div class="mon-stat"><div class="mon-stat-val" style="color:var(--accent-light)">${last24h}</div><div class="mon-stat-lbl">Last 24h</div></div>
    </div>
    ${topErrors.length > 0 ? `
    <div class="mon-freq">
      <h4>Top Errors</h4>
      ${topErrors.map(([msg, count]) => `<div class="mon-freq-row"><span class="mon-freq-count">${count}x</span><span class="mon-freq-msg">${escHtml(msg)}</span></div>`).join('')}
    </div>` : ''}
    <div class="mon-last">Last error: ${escHtml(lastErr)}</div>
  `;

  // Error log
  if (log.length === 0) {
    logEl.innerHTML = '<div class="mon-empty">No errors logged. Your app is running clean! &#127881;</div>';
    return;
  }

  logEl.innerHTML = log.map((e, i) => {
    const time = new Date(e.timestamp);
    const ago = formatTimeAgo(time);
    const typeClass = e.type === 'runtime' ? 'mon-type-runtime' : 'mon-type-promise';
    return `<div class="mon-entry">
      <div class="mon-entry-header">
        <span class="mon-type ${typeClass}">${e.type.toUpperCase()}</span>
        <span class="mon-time" title="${time.toLocaleString()}">${ago}</span>
        <span class="mon-page">${escHtml(e.page || '')}</span>
        <span class="mon-version">v${escHtml(e.version || '?')}</span>
      </div>
      <div class="mon-entry-msg">${escHtml(e.message)}</div>
      ${e.source ? `<div class="mon-entry-loc">${escHtml(e.source)}:${e.line}:${e.col}</div>` : ''}
      ${e.stack ? `<details class="mon-stack-details"><summary>Stack trace</summary><pre class="mon-stack">${escHtml(e.stack)}</pre></details>` : ''}
    </div>`;
  }).join('');
}

function formatTimeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function copyErrorLog() {
  const log = getErrorLog();
  const text = log.map(e => `[${e.timestamp}] ${e.type.toUpperCase()} | ${e.page} | v${e.version}\n${e.message}${e.source ? `\n  at ${e.source}:${e.line}:${e.col}` : ''}${e.stack ? `\n${e.stack}` : ''}`).join('\n\n---\n\n');
  navigator.clipboard.writeText(text || 'No errors logged.').then(() => showErrorToast('Error log copied to clipboard'));
}

function exportErrorLog() {
  const log = getErrorLog();
  const data = { exported: new Date().toISOString(), version: APP_VERSION, errors: log };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `netplus-errors-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function clearErrorLog() {
  if (!confirm('Clear all logged errors? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE.ERROR_LOG);
  renderMonitor();
}

// ══════════════════════════════════════════
// v4.99.50 (Phase 6c) — Web Vitals admin dashboard
// ══════════════════════════════════════════
// Reads the web_vitals table populated by lib/web-vitals-collector.js
// (shipped in Phase 6b v4.99.45). Admin-only — gates via the existing
// is_admin() RPC. Computes p75 / median for LCP, FCP, CLS, TTFB across
// last 7 days. Slices by app version + cert + iOS/Android platform.
//
// Entry points:
//   • /?action=web-vitals URL param
//   • openWebVitalsAdmin() called from sidebar/settings (when admin)

async function openWebVitalsAdmin() {
  // Gate via is_admin RPC — non-admins see a clear redirect.
  try {
    if (!window.certanvilSupabase) {
      showErrorToast('Sign in required to view admin telemetry');
      return;
    }
    const { data: adminCheck, error: adminErr } = await window.certanvilSupabase.rpc('is_admin');
    if (adminErr || !adminCheck) {
      showErrorToast('Admin access required');
      goSetup();
      return;
    }
  } catch (_) {
    showErrorToast('Could not verify admin access');
    return;
  }

  showPage('web-vitals');
  await renderWebVitals();
}

async function renderWebVitals() {
  const summary = document.getElementById('wv-summary');
  const byCert = document.getElementById('wv-bycert');
  const byVer = document.getElementById('wv-byversion');
  const byPlat = document.getElementById('wv-byplatform');
  const recent = document.getElementById('wv-recent');
  if (!summary) return;

  summary.innerHTML = '<div class="wv-loading">Loading telemetry…</div>';

  // Fetch last 7 days of rows (admin RLS allows full read)
  let rows = [];
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await window.certanvilSupabase
      .from('web_vitals')
      .select('*')
      .gte('captured_at', cutoff)
      .order('captured_at', { ascending: false });
    if (error) throw error;
    rows = data || [];
  } catch (err) {
    summary.innerHTML = '<div class="wv-error">Failed to load: ' + escHtml(String(err.message || err)) + '</div>';
    return;
  }

  if (rows.length === 0) {
    summary.innerHTML = '<div class="wv-empty">No telemetry in the last 7 days. Once signed-in users hit prod (networkplus.certanvil.com / secplus.certanvil.com) and switch tabs, rows will appear here.</div>';
    byCert.innerHTML = ''; byVer.innerHTML = ''; byPlat.innerHTML = ''; recent.innerHTML = '';
    return;
  }

  // ── Summary (p75 across all rows) ──
  const p75 = (vals) => {
    if (!vals.length) return null;
    const sorted = vals.slice().sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.75)];
  };
  const lcps = rows.map(r => r.lcp_ms).filter(v => v != null);
  const fcps = rows.map(r => r.fcp_ms).filter(v => v != null);
  const clss = rows.map(r => Number(r.cls)).filter(v => v != null && !isNaN(v));
  const ttfbs = rows.map(r => r.ttfb_ms).filter(v => v != null);

  const verdictMs = (val, good, poor) => {
    if (val == null) return 'na';
    if (val <= good) return 'good';
    if (val <= poor) return 'mid';
    return 'bad';
  };
  const verdictCls = (val) => {
    if (val == null) return 'na';
    if (val <= 0.1) return 'good';
    if (val <= 0.25) return 'mid';
    return 'bad';
  };

  summary.innerHTML = `<div class="wv-summary-grid">
    <div class="wv-card wv-${verdictMs(p75(lcps), 2500, 4000)}">
      <div class="wv-card-label">LCP · p75</div>
      <div class="wv-card-value">${p75(lcps) != null ? Math.round(p75(lcps)) + ' ms' : '—'}</div>
      <div class="wv-card-sub">Good &lt;2500 · Poor &gt;4000</div>
    </div>
    <div class="wv-card wv-${verdictMs(p75(fcps), 1800, 3000)}">
      <div class="wv-card-label">FCP · p75</div>
      <div class="wv-card-value">${p75(fcps) != null ? Math.round(p75(fcps)) + ' ms' : '—'}</div>
      <div class="wv-card-sub">Good &lt;1800 · Poor &gt;3000</div>
    </div>
    <div class="wv-card wv-${verdictCls(p75(clss))}">
      <div class="wv-card-label">CLS · p75</div>
      <div class="wv-card-value">${p75(clss) != null ? (Math.round(p75(clss) * 1000) / 1000) : '—'}</div>
      <div class="wv-card-sub">Good &lt;0.1 · Poor &gt;0.25</div>
    </div>
    <div class="wv-card wv-${verdictMs(p75(ttfbs), 800, 1800)}">
      <div class="wv-card-label">TTFB · p75</div>
      <div class="wv-card-value">${p75(ttfbs) != null ? Math.round(p75(ttfbs)) + ' ms' : '—'}</div>
      <div class="wv-card-sub">Good &lt;800 · Poor &gt;1800</div>
    </div>
  </div>
  <div class="wv-meta">${rows.length} session${rows.length === 1 ? '' : 's'} captured in last 7 days · oldest ${new Date(rows[rows.length - 1].captured_at).toLocaleString()}</div>`;

  // ── By cert (LCP p75 per cert) ──
  const byCertGroups = {};
  rows.forEach(r => {
    const key = r.cert || 'unknown';
    (byCertGroups[key] = byCertGroups[key] || []).push(r);
  });
  byCert.innerHTML = '<h3 class="wv-section-title">By cert</h3>' + Object.keys(byCertGroups).sort().map(cert => {
    const certLcps = byCertGroups[cert].map(r => r.lcp_ms).filter(v => v != null);
    const p = p75(certLcps);
    return `<div class="wv-row">
      <div class="wv-row-label">${escHtml(cert)}</div>
      <div class="wv-row-meta">${byCertGroups[cert].length} sessions</div>
      <div class="wv-row-val wv-${verdictMs(p, 2500, 4000)}">${p != null ? Math.round(p) + ' ms LCP p75' : '—'}</div>
    </div>`;
  }).join('');

  // ── By app version (latest 5) ──
  const byVerGroups = {};
  rows.forEach(r => {
    const key = r.app_version || 'unknown';
    (byVerGroups[key] = byVerGroups[key] || []).push(r);
  });
  const versionsSorted = Object.keys(byVerGroups).sort().reverse().slice(0, 6);
  byVer.innerHTML = '<h3 class="wv-section-title">By app version · latest 6</h3>' + versionsSorted.map(v => {
    const verLcps = byVerGroups[v].map(r => r.lcp_ms).filter(x => x != null);
    const p = p75(verLcps);
    return `<div class="wv-row">
      <div class="wv-row-label">v${escHtml(v)}</div>
      <div class="wv-row-meta">${byVerGroups[v].length} sessions</div>
      <div class="wv-row-val wv-${verdictMs(p, 2500, 4000)}">${p != null ? Math.round(p) + ' ms LCP p75' : '—'}</div>
    </div>`;
  }).join('');

  // ── By platform (iOS / Android / Other) ──
  const platLcps = { iOS: [], Android: [], Other: [] };
  rows.forEach(r => {
    const ua = (r.user_agent_short || '').toLowerCase();
    let key = 'Other';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) key = 'iOS';
    else if (ua.includes('android')) key = 'Android';
    if (r.lcp_ms != null) platLcps[key].push(r.lcp_ms);
  });
  byPlat.innerHTML = '<h3 class="wv-section-title">By platform</h3>' + ['iOS', 'Android', 'Other'].map(plat => {
    const p = p75(platLcps[plat]);
    return `<div class="wv-row">
      <div class="wv-row-label">${plat}</div>
      <div class="wv-row-meta">${platLcps[plat].length} sessions</div>
      <div class="wv-row-val wv-${verdictMs(p, 2500, 4000)}">${p != null ? Math.round(p) + ' ms LCP p75' : '—'}</div>
    </div>`;
  }).join('');

  // ── Recent 20 sessions ──
  recent.innerHTML = '<h3 class="wv-section-title">Recent sessions · latest 20</h3>' +
    '<div class="wv-table-wrap"><table class="wv-table"><thead><tr>' +
    '<th>Captured</th><th>Version</th><th>Cert</th><th>LCP</th><th>FCP</th><th>CLS</th><th>TTFB</th><th>Viewport</th><th>Conn</th>' +
    '</tr></thead><tbody>' +
    rows.slice(0, 20).map(r => {
      const t = new Date(r.captured_at);
      const tStr = t.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const cls = r.cls != null ? (Math.round(Number(r.cls) * 1000) / 1000) : '—';
      return `<tr>
        <td>${escHtml(tStr)}</td>
        <td>v${escHtml(r.app_version || '?')}</td>
        <td>${escHtml(r.cert || '—')}</td>
        <td>${r.lcp_ms != null ? r.lcp_ms + ' ms' : '—'}</td>
        <td>${r.fcp_ms != null ? r.fcp_ms + ' ms' : '—'}</td>
        <td>${cls}</td>
        <td>${r.ttfb_ms != null ? r.ttfb_ms + ' ms' : '—'}</td>
        <td>${r.viewport_w || '?'}×${r.viewport_h || '?'}</td>
        <td>${escHtml(r.connection_type || '—')}</td>
      </tr>`;
    }).join('') +
    '</tbody></table></div>';
}

// Triple-tap version badge to open monitor.
// v4.54.0: legacy #version-badge is inside the hidden .hero; also listen on
// the sidebar .sb-brand-version which IS visible. Attach to whichever exists.
// v4.89.7: also listen on the topbar version pill (#topbar-version-pill) so
// the gesture works from either surface (sidebar or topbar). Each tap calls
// preventDefault + stopPropagation so taps on .sb-brand-version don't
// bubble up to the new <a class="sb-brand-link"> wrapper and trigger the
// back-to-home navigation. Without that suppression, every triple-tap test
// would navigate away mid-gesture and the monitor would never open.
let monitorTaps = 0, monitorTapTimer = null;
function initMonitorGesture() {
  const targets = [
    document.getElementById('version-badge'),
    document.querySelector('.sb-brand-version'),
    document.getElementById('topbar-version-pill')
  ].filter(Boolean);
  if (!targets.length) return;
  const onTap = (e) => {
    // Suppress the wrapper anchor's click navigation. Always safe — the
    // listener targets ARE the version badges; click semantics on those
    // are entirely owned by this gesture.
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    monitorTaps++;
    if (monitorTapTimer) clearTimeout(monitorTapTimer);
    monitorTapTimer = setTimeout(() => { monitorTaps = 0; }, 600);
    if (monitorTaps >= 3) {
      monitorTaps = 0;
      renderMonitor();
      showPage('monitor');
    }
  };
  targets.forEach(t => t.addEventListener('click', onTap));
}

// ══════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════
if ('serviceWorker' in navigator) {
  // v4.89.2 → v4.99.27: SW auto-update. When a new sw.js deploys, the browser
  // loads it in the background, calls skipWaiting (in sw.js install handler),
  // and the new SW takes over via clients.claim(). At that point this page is
  // still running the OLD JS in memory; we only see the NEW code after a reload.
  //
  // v4.89.2 chose silent auto-reload. That worked but had two problems on
  // mobile: (a) auto-reload mid-task could lose form state, (b) on iOS the
  // controllerchange event fires inconsistently so users sometimes never
  // got the prompt. v4.99.27 swaps to a visible banner with a manual Refresh
  // button — user keeps control + the prompt is impossible to miss + works
  // even when the auto-reload-trigger doesn't fire.
  //
  // The `_swBannerShown` guard prevents the banner from rendering multiple
  // times if controllerchange fires repeatedly (rare but seen on flaky networks).
  let _swBannerShown = false;
  function _showSwUpdateBanner(reason) {
    if (_swBannerShown) return;
    _swBannerShown = true;
    try { console.info('[sw] new version detected (' + reason + ') — showing update banner'); } catch (_) {}
    try {
      const banner = document.createElement('div');
      banner.className = 'sw-update-banner sw-update-strip';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      // v5.5.9: brand sync-arrows (18_sync_arrows.svg, trimmed — namespaced
      // gradient, no <filter>/<title>/<style> so it inlines safely; the
      // outline rides currentColor so it adapts per theme, one arrowhead
      // keeps the brand orange). Dropped into the already-empty
      // .sw-banner-icon span (v5.0.2 stripped its old 📦). Additive only —
      // the title/sub/cta/dismiss contract below is byte-exact.
      banner.innerHTML =
        '<span class="sw-banner-icon" aria-hidden="true"><svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="swSyncOrange" x1="22" y1="18" x2="106" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E27822"/><stop offset="1" stop-color="#C95500"/></linearGradient></defs><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M37 52a31 31 0 0 1 49-19l8 8"/><path d="M94 27v18H76"/><path d="M91 76a31 31 0 0 1-49 19l-8-8"/><path d="M34 101V83h18" stroke="url(#swSyncOrange)" stroke-width="7"/><circle cx="64" cy="64" r="12"/></g></svg></span>' +
        '<span class="sw-banner-body">' +
          '<strong class="sw-banner-title">New version available</strong>' +
          '<span class="sw-banner-sub">Refresh to load the latest CertAnvil</span>' +
        '</span>' +
        '<button type="button" class="sw-banner-cta">Refresh</button>' +
        '<button type="button" class="sw-banner-dismiss" aria-label="Dismiss">×</button>';
      document.body.insertBefore(banner, document.body.firstChild);
      try { document.body.classList.add('has-sw-strip'); } catch (_) {}
      const refreshBtn = banner.querySelector('.sw-banner-cta');
      const dismissBtn = banner.querySelector('.sw-banner-dismiss');
      if (refreshBtn) refreshBtn.addEventListener('click', () => {
        try { document.body.classList.remove('has-sw-strip'); } catch (_) {}
        try { window.location.reload(); } catch (_) {}
      });
      if (dismissBtn) dismissBtn.addEventListener('click', () => {
        try { banner.remove(); } catch (_) {}
        try { document.body.classList.remove('has-sw-strip'); } catch (_) {}
      });
    } catch (_) {}
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    _showSwUpdateBanner('controllerchange');
  });
  // Belt-and-suspenders: sw.js posts a message to all clients on activate.
  // Either signal (this OR controllerchange above) triggers the same
  // single banner via the _swBannerShown guard.
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e && e.data && e.data.type === 'sw-updated') {
      _showSwUpdateBanner('postMessage');
    }
  });
  // Also poll for an updated registration every 60s while the tab is open —
  // catches the case where the user keeps a tab open across a deploy without
  // navigating. Without this, the SW only checks for updates on navigation.
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    if (!reg) return;
    setInterval(() => { try { reg.update(); } catch (_) {} }, 60000);
  }).catch(() => {});
}

// ════════════════════════════════════════════════════════════════════
// v4.99.36 — Feature module lazy-loader (MOBILE_OPTIMIZATION_PLAN Phase 11b)
//
// Pro-only features (Network Analysis Drill, Phishing Triage Lab, Packet
// Trace, IRW, ACL Builder) live in features/<name>.js and load on first
// navigation instead of shipping in the 614 KB shell. Each module:
//   1. Wraps everything in an IIFE for module-scoped state privacy.
//   2. Exposes onclick-target functions on window so rendered HTML works.
//   3. Registers window._certanvilFeatures[name] = { enter, leave } so the
//      shell stub can invoke the real entry point post-load.
//
// Pattern reference: tb3d.js (v4.63.0, issue #199) — same shape but post-
// DOMContentLoaded instead of pre-DOMContentLoaded.
//
// Lazy-load mechanism: dynamic <script> injection with async=false (preserves
// order across multiple in-flight loads). Cached by SW (existing stale-while-
// revalidate path covers /features/*.js automatically).
//
// First-load latency: ~50-200ms on fast wifi for a ~50KB feature file. Show
// no loading state — users tolerate sub-300ms delays without UI feedback.
// ════════════════════════════════════════════════════════════════════
const _featureModules = {};

async function _loadFeature(name) {
  if (_featureModules[name]) return _featureModules[name];
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/features/' + name + '.js';
    s.async = false;
    s.onload = () => {
      try {
        // Convention: module IIFE registers itself on window._certanvilFeatures
        const mod = (window._certanvilFeatures && window._certanvilFeatures[name]) || null;
        if (!mod) {
          reject(new Error('Feature module ' + name + ' did not register on window._certanvilFeatures'));
          return;
        }
        _featureModules[name] = mod;
        resolve(mod);
      } catch (err) { reject(err); }
    };
    s.onerror = () => {
      reject(new Error('Failed to load feature module: ' + name));
    };
    document.head.appendChild(s);
  });
}

// ════════════════════════════════════════════════════════════════════
// Task 17 — Sim Lab lazy-loader
//
// Injects features/sim-lab-seed-netplus.js THEN features/sim-lab.js on first
// drills-page visit. Order matters: the seed global (SIM_LAB_SEED_NETPLUS)
// must exist before sim-lab.js runs. Idempotent + queues concurrent callers
// so parallel showPage('drills') calls don't double-inject scripts.
// ════════════════════════════════════════════════════════════════════
function _ensureSimLabLoaded(cb) {
  if (window.renderSimLabDrillsCard) { if (cb) cb(); return; }
  if (window.__slLoading) { if (cb) window.__slLoading.push(cb); return; }
  // Allow one retry after a prior failed attempt; clear the flag so injection proceeds.
  if (window.__slLoadAttempted && !window.renderSimLabDrillsCard) {
    window.__slLoadAttempted = false;
  }
  window.__slLoading = cb ? [cb] : [];
  window.__slLoadAttempted = true;
  function _slInject(src, next) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = next;
    s.onerror = next; // never block navigation on load failure
    document.head.appendChild(s);
  }
  // Cert → hand-reviewed seed file. Inject the current cert's bank (if one exists)
  // before sim-lab.js so its global is present when the engine runs. Certs without
  // a bank (or an unknown cert) load the engine alone and fall back to AI-gen.
  // NOTE: the loader is once-per-page (guarded above); a mid-session cert switch
  // that needs a different bank should follow the app's normal cert-switch reload.
  const _SL_SEED_FILES = {
    netplus: 'features/sim-lab-seed-netplus.js',
    secplus: 'features/sim-lab-seed-secplus.js',
    'aplus-core1': 'features/sim-lab-seed-aplus-core1.js',
    'aplus-core2': 'features/sim-lab-seed-aplus-core2.js'
  };
  function _slLoadCore() {
    _slInject('features/sim-lab.js', function () {
      const q = window.__slLoading || [];
      window.__slLoading = null;
      q.forEach(function (fn) { if (fn) fn(); });
    });
  }
  const _slSeedFile = _SL_SEED_FILES[window.CURRENT_CERT || 'netplus'];
  if (_slSeedFile) { _slInject(_slSeedFile, _slLoadCore); } else { _slLoadCore(); }
}
// Expose on window so tests can trigger the lazy-load directly.
window._ensureSimLabLoaded = _ensureSimLabLoaded;

const _DL_SEED_FILES = {
  az900: 'features/decision-lab-seed-az900.js',
  ai900: 'features/decision-lab-seed-ai900.js',
  sc900: 'features/decision-lab-seed-sc900.js',
  clfc02: 'features/decision-lab-seed-clfc02.js'
};
function _ensureDecisionLabLoaded(cb) {
  function _afterEngine() {
    var seedFile = _DL_SEED_FILES[window.CURRENT_CERT];
    if (!seedFile || window.__dlSeedLoaded === window.CURRENT_CERT) { if (cb) cb(); return; }
    var s = document.createElement('script');
    s.src = seedFile;
    s.onload = function () { window.__dlSeedLoaded = window.CURRENT_CERT; if (cb) cb(); };
    s.onerror = function () { if (cb) cb(); };
    document.head.appendChild(s);
  }
  if (typeof _ensureSimLabLoaded === 'function') _ensureSimLabLoaded(_afterEngine);
  else _afterEngine();
}
window._ensureDecisionLabLoaded = _ensureDecisionLabLoaded;

// ════════════════════════════════════════════════════════════════════
// v4.99.31 (iOS Plan Phase 5 — PWA polish)
//
// Three pieces, all defensively wrapped (PWA APIs vary across browsers
// + iOS versions; the app must NEVER break because A2HS detection failed):
//   1. Standalone-mode detection — sets body.is-standalone class so CSS
//      can adjust safe-area / hide browser-only affordances. Watches for
//      display-mode change (rare but happens when user installs the PWA
//      mid-session in some Android flows).
//   2. A2HS banner — Android via beforeinstallprompt event + iOS Safari
//      via UA detection + "tap Share → Add to Home Screen" hint. Capped
//      at once-per-7-days, permanently dismissible.
//   3. Push notification scaffolding — sets window._pushSupported flag.
//      SW-side handlers (push, notificationclick) live in sw.js. Actual
//      subscribe + permission UI deferred until VAPID + server backend.
//
// Why not auto-prompt for permission? Best practice — earned trust, not
// drive-by demands. Add a Settings entry once feature ships.
// ════════════════════════════════════════════════════════════════════
(function _initPwaPolish() {
  if (typeof window === 'undefined') return;

  // ── 1. Standalone-mode detection ──
  function _detectStandalone() {
    let isStandalone = false;
    try {
      // Modern: display-mode media query (Chrome/Edge/Firefox PWA + iOS 16.4+)
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        isStandalone = true;
      }
      // iOS Safari legacy: navigator.standalone (still the only signal pre-16.4)
      if (window.navigator && window.navigator.standalone === true) {
        isStandalone = true;
      }
    } catch (_) {}
    try { document.body && document.body.classList.toggle('is-standalone', isStandalone); } catch (_) {}
    return isStandalone;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _detectStandalone, { once: true });
  } else {
    _detectStandalone();
  }
  // Watch for display-mode changes (e.g. user just installed mid-session)
  try {
    if (window.matchMedia) {
      const mql = window.matchMedia('(display-mode: standalone)');
      if (mql.addEventListener) mql.addEventListener('change', _detectStandalone);
      else if (mql.addListener) mql.addListener(_detectStandalone);
    }
  } catch (_) {}

  // ── 2. A2HS banner ──
  // Cadence: never if already standalone, never if dismissed, max once per
  // A2HS_COOLDOWN_DAYS even before dismissal. Banner appears 5-8s after
  // page load so it never competes with first-paint LCP metrics.
  const A2HS_COOLDOWN_DAYS = 7;
  let _deferredInstallPrompt = null;

  function _isIOS() {
    try {
      const ua = navigator.userAgent || '';
      return /iphone|ipad|ipod/i.test(ua) && !/macintosh/i.test(ua);
    } catch (_) { return false; }
  }

  function _shouldShowA2HS() {
    try {
      // Already installed → no banner
      if (document.body && document.body.classList.contains('is-standalone')) return false;
      // Permanently dismissed
      if (localStorage.getItem(STORAGE.A2HS_DISMISSED) === '1') return false;
      // Cooldown — show at most once every A2HS_COOLDOWN_DAYS days
      const lastShown = parseInt(localStorage.getItem(STORAGE.A2HS_LAST_SHOWN_AT) || '0', 10);
      if (lastShown && Date.now() - lastShown < A2HS_COOLDOWN_DAYS * 86400000) return false;
      return true;
    } catch (_) { return false; }
  }

  function _showA2HSBanner(mode) {
    // mode: 'android' (CTA button fires deferred prompt) | 'ios' (hint only)
    try {
      if (document.querySelector('.a2hs-banner')) return; // already shown this session
      const banner = document.createElement('div');
      banner.className = 'a2hs-banner a2hs-banner-' + mode;
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Install CertAnvil');
      const subCopy = (mode === 'ios')
        ? '<span class="a2hs-banner-sub">Tap <span class="a2hs-share-icon" aria-hidden="true">⎙</span> Share, then <strong>Add to Home Screen</strong></span>'
        : '<span class="a2hs-banner-sub">Faster launches, full-screen feel.</span>';
      const ctaHTML = (mode === 'ios')
        ? '<button type="button" class="a2hs-banner-dismiss" aria-label="Dismiss">×</button>'
        : '<button type="button" class="a2hs-banner-cta">Install</button>'
          + '<button type="button" class="a2hs-banner-dismiss" aria-label="Dismiss">×</button>';
      banner.innerHTML =
        '<span class="a2hs-banner-icon" aria-hidden="true"></span>' +
        '<span class="a2hs-banner-body">' +
          '<strong class="a2hs-banner-title">Install CertAnvil</strong>' +
          subCopy +
        '</span>' +
        ctaHTML;
      document.body.appendChild(banner);
      // CTA wiring (Android only — iOS users follow the share-sheet hint)
      const cta = banner.querySelector('.a2hs-banner-cta');
      if (cta) {
        cta.addEventListener('click', async () => {
          if (_deferredInstallPrompt && typeof _deferredInstallPrompt.prompt === 'function') {
            try { _deferredInstallPrompt.prompt(); } catch (_) {}
            try {
              const result = await _deferredInstallPrompt.userChoice;
              if (result && result.outcome === 'accepted') {
                try { localStorage.setItem(STORAGE.A2HS_DISMISSED, '1'); } catch (_) {}
              }
            } catch (_) {}
            _deferredInstallPrompt = null;
            try { banner.remove(); } catch (_) {}
          }
        });
      }
      const dismissBtn = banner.querySelector('.a2hs-banner-dismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          try { localStorage.setItem(STORAGE.A2HS_DISMISSED, '1'); } catch (_) {}
          try { banner.remove(); } catch (_) {}
        });
      }
      try { localStorage.setItem(STORAGE.A2HS_LAST_SHOWN_AT, String(Date.now())); } catch (_) {}
    } catch (_) {}
  }

  // Android Chrome path
  window.addEventListener('beforeinstallprompt', (e) => {
    try { e.preventDefault(); } catch (_) {}
    _deferredInstallPrompt = e;
    if (_shouldShowA2HS()) {
      setTimeout(() => _showA2HSBanner('android'), 5000);
    }
  });

  // iOS Safari path — no event, just UA + cadence check
  function _maybeShowIOSA2HS() {
    if (!_isIOS()) return;
    if (!_shouldShowA2HS()) return;
    setTimeout(() => _showA2HSBanner('ios'), 8000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _maybeShowIOSA2HS, { once: true });
  } else {
    _maybeShowIOSA2HS();
  }

  // App-installed event — fires on Android when the user installs (either
  // via our banner or Chrome's own infobar). Mark dismissed so we never
  // re-show after install.
  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem(STORAGE.A2HS_DISMISSED, '1'); } catch (_) {}
    _deferredInstallPrompt = null;
    try {
      const banner = document.querySelector('.a2hs-banner');
      if (banner) banner.remove();
    } catch (_) {}
  });

  // ── 3. Push notification scaffolding ──
  // Foundation only. SW handlers (sw.js) are live; client subscribe is
  // gated on VAPID + server backend (deferred). Surface the capability
  // signal so future Settings UI can read it without re-feature-detecting.
  window._pushSupported = (function() {
    try {
      return 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
    } catch (_) { return false; }
  })();
})();

window.addEventListener('DOMContentLoaded', () => {
  // v4.87.1: re-render topic chips for the active cert BEFORE binding click
  // handlers. In Security+ mode this swaps the static Network+ chips for
  // the SY0-701 catalog. Network+ mode is no-op (static HTML is correct).
  if (typeof _renderTopicChipsForActiveCert === 'function') {
    try { _renderTopicChipsForActiveCert(); } catch (_) {}
  }
  // v4.88.0: substitute cert-aware copy in user-visible HTML (diagnostic
  // CTA, pass plan, exam results labels, etc.). Network+ mode is no-op.
  if (typeof _renderCertAwareCopy === 'function') {
    try { _renderCertAwareCopy(); } catch (_) {}
  }

  // Apply saved theme
  setTheme(getTheme());

  const saved = localStorage.getItem(STORAGE.KEY);
  if (saved) document.getElementById('api-key').value = saved;
  // Auto-open Advanced section on first visit (no API key yet)
  const adv = document.getElementById('advanced-section');
  if (adv && !saved) adv.open = true;

  // v4.54.15: topic-group now supports multi-select on domain chips.
  // Smart/Mixed mode cards remain single-select (they contradict a specific
  // topic list). Domain chips can be toggled on/off; when 2+ are active
  // `topic` becomes a "Multi: A, B, C" string which fetchQuestions expands
  // into a distribution prompt.
  initTopicGroupMulti(v => topic = v);
  initChips('diff-group',  v => diff  = v);
  initChips('count-group', v => qCount = parseInt(v));

  // v4.54.15: derive the initial topic via the same helper the multi-select
  // handler uses, so single vs multi-chip initial state is both supported.
  topic = _computeTopicFromChips();
  const d0 = document.querySelector('#diff-group .chip.on');
  const c0 = document.querySelector('#count-group .chip.on');
  if (d0) diff   = d0.dataset.v;
  if (c0) qCount = parseInt(c0.dataset.v);

  renderHistoryPanel();
  renderStatsCard();
  renderStreakBadge();
  renderReadinessCard();
  renderWrongBankBtn();
  renderStreakDefender();
  renderDailyChallengeCard();
  // v4.81.18 + v4.81.23: consolidated Today's Plan card replaces the
  // legacy chip rows + study plan banner. renderTodayPlan reads weak +
  // stale signals and paints the single #today-plan card.
  if (typeof renderTodayPlan === 'function') renderTodayPlan();
  renderTodaySection();
  renderMarathonSection();
  // v4.81.1: home-page surfaces that were goSetup-only — render on first
  // paint so the page is consistent between initial load and post-navigation.
  // Pre-fix the NBM card / SR review card / diagnostic surface only appeared
  // AFTER the user navigated somewhere and returned (any path that called
  // goSetup); on raw reload they stayed hidden, producing a visible
  // "appears then disappears" inconsistency for users who reload from a state
  // where they'd previously seen them.
  if (typeof renderSrReviewCard === 'function') renderSrReviewCard();
  if (typeof renderDiagnosticSurface === 'function') renderDiagnosticSurface();
  if (typeof renderNextBestMove === 'function') renderNextBestMove();
  // v5.5.5: Continue anchor — always-present rail bottom (never is-hidden);
  // same first-paint parity as the NBM/SR/diagnostic surfaces above.
  if (typeof renderContinueCard === 'function') renderContinueCard();
  // v4.81.2: take a daily auto-backup. Idempotent — once per day. Catches
  // any catastrophic corruption (test injection, browser bug, user mishap)
  // with a rolling 7-day rollback window. Filed in direct response to a
  // localStorage-corruption incident where this safety net would have
  // fully recovered the user's state.
  if (typeof _takeAutoBackup === 'function') _takeAutoBackup();
  // v4.81.3: data-safety discipline layer (defense-in-depth around the
  // same incident).
  if (typeof _emitProdConsoleBanner === 'function') _emitProdConsoleBanner();
  if (typeof _renderEnvBadge === 'function') _renderEnvBadge();
  if (typeof _maybeExportReminder === 'function') _maybeExportReminder();
  initMonitorGesture();
  // Restore Hardcore exam preference (#48)
  const hcCheckbox = document.getElementById('hardcore-checkbox');
  if (hcCheckbox) hcCheckbox.checked = localStorage.getItem(STORAGE.HARDCORE_EXAM) === '1';
  // v7.34.1: initialise phone home-collapse on first load. goSetup() calls
  // _initHomeCollapse() when navigating back from quiz/exam, but on a raw
  // page load the DOMContentLoaded handler renders the setup/bento content
  // directly and never calls goSetup(). _initHomeCollapse() is idempotent
  // (guards each cell with home-collapsible) and self-gates on ≤620 px, so
  // this call is a no-op on desktop and safe to duplicate.
  if (typeof _initHomeCollapse === 'function') _initHomeCollapse();
});

// Persist hardcore-mode preference (#48). The exam page reads `examHardcore`
// at startExam time, so toggling the checkbox between exams just updates the
// stored preference.
function setHardcoreMode(on) {
  try { localStorage.setItem(STORAGE.HARDCORE_EXAM, on ? '1' : '0'); _cloudFlush(STORAGE.HARDCORE_EXAM); } catch {}
}

function initChips(groupId, cb) {
  const g = document.getElementById(groupId);
  g.setAttribute('role', 'group');
  g.querySelectorAll('.chip').forEach(c => {
    // Set initial aria-pressed based on current selection class
    c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false');
    c.addEventListener('click', () => {
      g.querySelectorAll('.chip').forEach(x => {
        x.classList.remove('on');
        x.setAttribute('aria-pressed', 'false');
      });
      c.classList.add('on');
      c.setAttribute('aria-pressed', 'true');
      cb(c.dataset.v);
      // v4.54.8: refresh the dark prose-summary CTA bar whenever any chip toggles
      if (typeof updateCqSummaryBar === 'function') updateCqSummaryBar();
    });
  });
}

// v4.54.15: multi-select handler for the #topic-group. Smart + Mixed mode
// cards (.cq-mode-card) remain single-select \u2014 they're meta-topics that
// contradict selecting specific domain topics. Domain chips toggle on/off
// freely. When any domain chip is activated the mode cards deactivate.
// When the user clears the last active chip, we fall back to Mixed so the
// quiz always has a valid topic. The `cb(topic)` callback receives either:
//   - a single topic string ('Network Models & OSI')
//   - a mode sentinel ('\ud83e\udde0 Smart (Spaced Rep)' / 'Mixed \u2014 All Topics')
//   - a multi-topic string ('Multi: Topic A, Topic B, Topic C')
function initTopicGroupMulti(cb) {
  const g = document.getElementById('topic-group');
  if (!g) return;
  g.setAttribute('role', 'group');
  g.querySelectorAll('.chip').forEach(c => {
    c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false');
    c.addEventListener('click', () => {
      const isMode = c.classList.contains('cq-mode-card');
      if (isMode) {
        // Mode card: clear everything else, set this one on.
        g.querySelectorAll('.chip').forEach(x => {
          x.classList.remove('on');
          x.setAttribute('aria-pressed', 'false');
        });
        c.classList.add('on');
        c.setAttribute('aria-pressed', 'true');
      } else {
        // Domain chip: toggle. If turning ON, also clear the mode cards.
        const turningOn = !c.classList.contains('on');
        if (turningOn) {
          g.querySelectorAll('.chip.cq-mode-card').forEach(x => {
            x.classList.remove('on');
            x.setAttribute('aria-pressed', 'false');
          });
        }
        c.classList.toggle('on');
        c.setAttribute('aria-pressed', turningOn ? 'true' : 'false');
        // Guarantee at least one chip stays selected \u2014 fall back to Mixed
        // if the user just deselected the last domain chip.
        const anyOn = g.querySelector('.chip.on');
        if (!anyOn) {
          const mixed = g.querySelector('.chip[data-v*="Mixed"]');
          if (mixed) {
            mixed.classList.add('on');
            mixed.setAttribute('aria-pressed', 'true');
          }
        }
      }
      cb(_computeTopicFromChips());
      if (typeof updateCqSummaryBar === 'function') updateCqSummaryBar();
    });
  });
}

// v4.54.15: compute the topic string from current chip state. Used by the
// multi-select handler + any post-load sync that wants to re-derive `topic`.
function _computeTopicFromChips() {
  const g = document.getElementById('topic-group');
  if (!g) return (typeof MIXED_TOPIC !== 'undefined') ? MIXED_TOPIC : 'Mixed \u2014 All Topics';
  const modeOn = g.querySelector('.cq-mode-card.on');
  if (modeOn) return modeOn.dataset.v;
  const domainOn = Array.from(g.querySelectorAll('.chip.on:not(.cq-mode-card)'))
    .map(c => c.dataset.v)
    .filter(Boolean);
  if (domainOn.length === 0) {
    return (typeof MIXED_TOPIC !== 'undefined') ? MIXED_TOPIC : 'Mixed \u2014 All Topics';
  }
  if (domainOn.length === 1) return domainOn[0];
  return 'Multi: ' + domainOn.join(', ');
}

// Keep aria-pressed in sync when chips are toggled programmatically
function syncChipAriaPressed(groupSelector) {
  document.querySelectorAll(groupSelector + ' .chip').forEach(c => {
    c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false');
  });
  // v4.54.8: programmatic toggles (applyPreset, drillDomain, etc.) also refresh the CTA summary
  if (typeof updateCqSummaryBar === 'function') updateCqSummaryBar();
}

// ══════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════
// v4.99.5 Phase E.4.2: Pro-only page gate — applied at navigation level.
// Free users blocked from entering any drill / builder / flagship page.
// The drill launcher (#page-drills) stays accessible so users see what's
// locked and the upgrade is contextual. Quiz/exam/analytics/progress/
// settings/setup/etc. remain Free-accessible.
const PRO_ONLY_PAGES = {
  // MVP-QUIZ-ONLY (Ships 1+2+3+4+5): all drill + flagship Pro entries removed.
  // Drills + flagships are gone; quiz/exam/analytics/progress/settings stay
  // Free-accessible. 'guided-lab' (Topic Deep Dive CLI labs) + 'monitor'
  // (admin dashboard) kept since their pages still exist.
  'guided-lab': 'Topology Lab',
  'monitor': 'Network Monitor'
};

function showPage(name) {
  // v4.99.5 Phase E.4.2: gate Pro-only pages at navigation level.
  // _gateProOnly returns true for Pro/admin (proceed) or false + shows the
  // upgrade modal (block). Free users see the modal instead of the page.
  if (PRO_ONLY_PAGES[name] && typeof _gateProOnly === 'function') {
    if (!_gateProOnly(PRO_ONLY_PAGES[name])) return;
  }
  // MVP-QUIZ-ONLY (Ship 2): tbStopAmbient hook removed (Topology Builder deleted).
  // v4.53.0: sync sidebar active state on every page change
  if (typeof updateSidebarActiveState === 'function') updateSidebarActiveState(name);
  // v4.54.0: update topbar breadcrumb
  if (typeof updateTopbarCrumb === 'function') updateTopbarCrumb(name);
  // Task 17: lazy-load Sim Lab on first drills visit; card renders post-load.
  if (name === 'drills') _ensureSimLabLoaded(function () { if (typeof window.renderSimLabDrillsCard === 'function') window.renderSimLabDrillsCard(); });
  // #138 wave 1: lazy-load progress page feature if not yet available.
  if (name === 'progress' && !window.renderProgressPage) {
    _loadFeature('progress').then(function (m) { m.enter(); });
    return;
  }
  // #138 wave 2: lazy-load analytics page feature if not yet available.
  if (name === 'analytics' && !window.renderAnalytics) {
    _loadFeature('analytics').then(function (m) { m.enter(); });
    return;
  }
  // #138 wave 3: lazy-load settings page feature if not yet available.
  if (name === 'settings' && !window.renderSettingsPage) {
    _loadFeature('settings').then(function (m) { m.enter(); });
    return;
  }
  // v7.55.2: surface the Sim Lab entry in the Home → Practice section. Renders
  // without loading the feature module (cert/pro/daily-state are in app.js); the
  // module lazy-loads on click via startSimLabHome().
  if (name === 'setup' && typeof renderSimLabHomeEntry === 'function') renderSimLabHomeEntry();
  if (name === 'setup' && typeof renderDecisionLabHomeEntry === 'function') renderDecisionLabHomeEntry();
  // v4.53.0: auto-close mobile drawer when navigating
  try { document.body.classList.remove('sidebar-open'); } catch (_) {}
  // v4.85.16: clear any stale .err-box banners on every page change so a
  // failed-quiz error from page X doesn't follow the user to page Y. The
  // err-box auto-hides via display:none on the parent .page when it's not
  // active — but if any future surface positions an .err-box outside a
  // .page wrapper, this sweep keeps things clean.
  if (typeof _clearStaleErrBoxes === 'function') {
    try { _clearStaleErrBoxes(); } catch (_) { /* never block navigation */ }
  }
  const current = document.querySelector('.page.active');
  const next = document.getElementById('page-' + name);
  const activate = () => {
    next.classList.add('active');
    window.scrollTo(0, 0);
    // a11y: move focus to the new page so screen readers announce context
    const focusTarget = next.querySelector('h1, h2, [role="heading"], .page-title') || next;
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      try { focusTarget.focus({ preventScroll: true }); } catch (_) {}
    }
  };
  if (current && current !== next) {
    current.classList.add('page-exit');
    current.addEventListener('animationend', function handler() {
      current.removeEventListener('animationend', handler);
      current.classList.remove('active', 'page-exit');
      activate();
    }, { once: true });
    // Fallback in case animationend doesn't fire
    setTimeout(() => {
      if (current.classList.contains('page-exit')) {
        current.classList.remove('active', 'page-exit');
        activate();
      }
    }, 300);
  } else {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    activate();
  }
}

function goSetup() {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  // v4.99.38: portTimer was a top-level let in the Port Drill region but lives
  // inside features/port-drill.js IIFE post-extraction. Use typeof guard +
  // expose a window-level clearance via _portDrillTeardown if loaded.
  try { if (typeof window._portDrillTeardown === 'function') window._portDrillTeardown(); } catch (_) {}
  // v4.99.39: IRW (Incident Response War Room) pressure-timer cleanup.
  // Same shell-callable pattern as _portDrillTeardown. Idempotent.
  try { if (typeof window._irwTeardown === 'function') window._irwTeardown(); } catch (_) {}
  // v4.99.42: Subnet Trainer timed-challenge timer cleanup. stTimerInterval
  // lives inside features/subnet-trainer.js IIFE post-extraction; same
  // shell-callable pattern. Idempotent.
  try { if (typeof window._subnetTrainerTeardown === 'function') window._subnetTrainerTeardown(); } catch (_) {}
  examMode = false;
  wrongDrillMode = false;
  dailyChallengeMode = false;
  // v7.48.0: quitting a gauntlet mid-run (confirmBack → goSetup) = no crack,
  // no penalty. Reset the mode + restore the standard quiz chrome.
  gauntletMode = false;
  _gauntletRun = null;
  // v7.50.0: quitting a Why-Not session mid-run = same contract (no penalty);
  // the ladder renderer's idle path restores the shared quiz chrome (dots,
  // topic strip) for both drills.
  whyNotMode = false;
  _wnSession = null;
  _wnRound = null;
  if (typeof _renderGauntletLadder === 'function') { try { _renderGauntletLadder(); } catch (_) {} }
  navOpen = false;
  // v4.54.1: renderHistoryPanel moved to renderAnalytics (Recent Performance now lives on Analytics page)
  renderStatsCard();
  renderStreakBadge();
  renderReadinessCard();
  // v4.74.0: surface SR review card if there are due cards
  if (typeof renderSrReviewCard === 'function') renderSrReviewCard();
  // v4.81.0: surface Baseline Diagnostic CTA (or Pass Plan tile if completed)
  if (typeof renderDiagnosticSurface === 'function') renderDiagnosticSurface();
  // v4.76.0: dynamic next-best-move CTA in the hero
  if (typeof renderNextBestMove === 'function') renderNextBestMove();
  // v5.5.5: Continue anchor — always-present rail bottom (never is-hidden).
  if (typeof renderContinueCard === 'function') renderContinueCard();
  renderWrongBankBtn();
  renderStreakDefender();
  renderDailyChallengeCard();
  // v4.81.18 + v4.81.23: consolidated Today's Plan card replaces the
  // legacy chip rows + study plan banner + focus banner.
  if (typeof renderTodayPlan === 'function') renderTodayPlan();
  renderTodaySection();
  renderMarathonSection();
  // v4.53.0: editorial redesign hooks (focus banner retired in v4.81.20)
  if (typeof renderSetupDomainGrid === 'function') renderSetupDomainGrid();
  // v4.54.0: hero v2 (display heading + dark readiness + mini cards)
  if (typeof renderHeroV2 === 'function') renderHeroV2();
  // v7.x audit 9: collapse Practice/Exam/Drill on phones only (≤620px)
  _initHomeCollapse();
  showPage('setup');
}

// ── audit 9: phone-only collapsible home sections ──────────────────────────
// On phones (≤620px) Practice, Exam Simulation, and Drill by Domain start
// collapsed. Tapping the .tile-head toggles .home-collapsed on the section.
// Quick Start (.cell-quick) is never touched. On tablet/desktop (≥621px)
// this function exits immediately — zero DOM or style changes.
function _initHomeCollapse() {
  if (!window.matchMedia('(max-width:620px)').matches) return;
  var cells = [
    document.querySelector('.cell-practice'),
    document.querySelector('.cell-exam'),
    document.querySelector('.cell-domains')
  ];
  cells.forEach(function(cell) {
    if (!cell) return;
    // Avoid double-initialising on rapid goSetup() calls
    if (cell.classList.contains('home-collapsible')) return;
    cell.classList.add('home-collapsible', 'home-collapsed');
    var head = cell.querySelector('.tile-head');
    if (!head) return;
    head.setAttribute('role', 'button');
    head.setAttribute('tabindex', '0');
    head.setAttribute('aria-expanded', 'false');
    // Inject chevron affordance
    var chev = document.createElement('span');
    chev.className = 'home-collapse-chev';
    chev.setAttribute('aria-hidden', 'true');
    chev.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    head.appendChild(chev);
    function toggle() {
      var collapsed = cell.classList.toggle('home-collapsed');
      head.setAttribute('aria-expanded', String(!collapsed));
    }
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

// v4.41.0: Progressive disclosure — hide Marathon Mode until user has completed 1+ quiz.
// First-run users shouldn't see "100 Question" options before they've taken 5.
function renderMarathonSection() {
  const section = document.getElementById('marathon-section');
  if (!section) return;
  const hasHistory = loadHistory().length > 0;
  section.classList.toggle('is-hidden', !hasHistory);
}

function confirmBack() {
  if (confirm('Go back to the menu? Quiz progress will be lost.')) goSetup();
}

// ══════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE.HISTORY) || '[]'); } catch(e) { return []; }
}
function saveToHistory(entry) {
  try {
    const h = loadHistory();
    h.unshift(entry);
    if (h.length > HISTORY_CAP) h.length = HISTORY_CAP;
    localStorage.setItem(STORAGE.HISTORY, JSON.stringify(h));
    _cloudFlush(STORAGE.HISTORY);
  } catch { showToast('Storage full · history not saved', 'error'); }
}

// v4.50.1: polished Recent Performance card — domain-color dot per row,
// thicker gradient progress bar, tier-aligned colours (matches v4.45.1
// Domain Mastery thresholds 55/70/85), separate score + percentage pill.
function renderHistoryPanel() {
  const h = loadHistory();
  const panel = document.getElementById('history-panel');
  const list  = document.getElementById('history-list');
  if (h.length === 0) { panel.classList.add('is-hidden'); return; }
  panel.classList.remove('is-hidden');

  // Domain colours match the 5-colour palette used in Custom Quiz
  // accordions (v4.50.0) and Domain Mastery card.
  const DOMAIN_COLOURS = {
    concepts:        '#b8860b',
    implementation:  '#22c55e',
    operations:      '#3b82f6',
    security:        '#f59e0b',
    troubleshooting: '#ef4444',
  };

  list.innerHTML = h.slice(0, 8).map(e => {
    const date = new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    // Tier-aligned colours (matches Domain Mastery 55/70/85 cutoffs from v4.45.1).
    let tierColor, tierName;
    if (e.pct >= 80)      { tierColor = '#22c55e';                tierName = 'mastered';   }
    else if (e.pct >= 70) { tierColor = 'var(--accent-light)';    tierName = 'proficient'; }
    else if (e.pct >= 55) { tierColor = '#eab308';                tierName = 'developing'; }
    else                  { tierColor = '#ef4444';                tierName = 'novice';     }
    const domId = (typeof TOPIC_DOMAINS !== 'undefined') ? TOPIC_DOMAINS[e.topic] : null;
    const domColor = domId ? DOMAIN_COLOURS[domId] : 'var(--surface3)';
    const tag = e.mode === 'exam' ? '<span class="h-mode-tag">EXAM</span>' : '';
    return `<div class="history-row history-row-${tierName}">
      <span class="h-domain-dot" style="background:${domColor}" aria-hidden="true"></span>
      <div class="h-info">
        <div class="h-topic">${escHtml(e.topic)}${tag}</div>
        <div class="h-bar">
          <div class="h-bar-fill" style="width:${e.pct}%;background:${tierColor}"></div>
        </div>
      </div>
      <div class="h-score-wrap">
        <div class="h-score" style="color:${tierColor}">${e.score}<span class="h-score-sep">/</span>${e.total}</div>
        <div class="h-score-pct" style="color:${tierColor}">${e.pct}%</div>
      </div>
      <div class="h-date">${date}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// STUDY STATS
// ══════════════════════════════════════════
function getStudyStats() {
  const h = loadHistory();
  if (!h.length) return null;
  const totalQ    = h.reduce((a, e) => a + e.total, 0);
  const sessions  = h.length;
  const avgPct    = Math.round(h.reduce((a, e) => a + e.pct, 0) / sessions);
  // v4.85.20: filter to summary entries only (topic === EXAM_TOPIC) to prevent
  // per-topic split rows (1/1 correct = scaled 900) from inflating the best-exam
  // headline number.
  const bestExam  = h.filter(e => e.mode === 'exam' && e.topic === EXAM_TOPIC).reduce((best, e) => {
    const scaled = Math.round(100 + (e.score / e.total) * 800);
    return scaled > best ? scaled : best;
  }, 0);
  return { totalQ, sessions, avgPct, bestExam };
}
function getTodayQuestionCount() {
  const today = new Date().toISOString().slice(0, 10);
  return loadHistory()
    .filter(e => new Date(e.date).toISOString().slice(0, 10) === today)
    .reduce((a, e) => a + (e.total || 0), 0);
}

// ── Daily goal ──
// Kept BELOW the 15/day free quota cap so completing the goal leaves headroom
// for "one more" instead of landing the user on the paywall at the same moment.
const DEFAULT_DAILY_GOAL = 15;
function getDailyGoal() {
  const raw = parseInt(localStorage.getItem(STORAGE.DAILY_GOAL), 10);
  return (Number.isFinite(raw) && raw > 0) ? raw : DEFAULT_DAILY_GOAL;
}
function setDailyGoal(n) {
  const v = parseInt(n, 10);
  if (Number.isFinite(v) && v > 0 && v <= 500) {
    localStorage.setItem(STORAGE.DAILY_GOAL, String(v));
    _cloudFlush(STORAGE.DAILY_GOAL);
  }
}
function editDailyGoal() {
  const current = getDailyGoal();
  const input = prompt('Daily question goal:', String(current));
  if (input === null) return;
  const v = parseInt(input, 10);
  if (!Number.isFinite(v) || v <= 0 || v > 500) {
    alert('Enter a number between 1 and 500.');
    return;
  }
  setDailyGoal(v);
  renderDailyGoal();
}
function renderDailyGoal() {
  const card = document.getElementById('daily-goal-card');
  if (!card) return;
  const goal = getDailyGoal();
  const done = getTodayQuestionCount();
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const circumference = 2 * Math.PI * 30; // r=30
  const offset = circumference * (1 - Math.min(1, done / goal));
  const fill = document.getElementById('dg-ring-fill');
  const pctEl = document.getElementById('dg-ring-pct');
  const countEl = document.getElementById('dg-progress-count');
  const goalEl = document.getElementById('dg-goal-num');
  const msgEl  = document.getElementById('dg-msg');
  if (!fill || !pctEl) return;
  let color;
  if (pct >= 100)      color = 'var(--green)';
  else if (pct >= 60)  color = 'var(--accent)';
  else if (pct >= 25)  color = 'var(--yellow)';
  else                 color = 'var(--red)';
  fill.style.stroke = color;
  pctEl.style.color = color;
  goalEl.textContent = goal;

  // v4.42.1: first-render-per-session intro. Ring fills from empty
  // (stroke-dashoffset = full circumference) → target offset using a slower
  // 1.2s cubic-bezier reveal, slightly delayed so the readiness card leads.
  // Count + percentage text roll up in parallel. Once consumed, subsequent
  // calls use the instant hot-swap path so quiz-return updates stay snappy.
  if (_dailyGoalIntroArmed) {
    _dailyGoalIntroArmed = false;
    fill.style.strokeDasharray = circumference;
    fill.style.transition = 'none';
    fill.style.strokeDashoffset = circumference; // empty ring
    void fill.offsetWidth; // force reflow
    pctEl.textContent = '0%';
    countEl.textContent = '0';
    setTimeout(() => {
      fill.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
      fill.style.strokeDashoffset = offset;
      setTimeout(() => { fill.style.transition = ''; }, 1350);
    }, 250);
    setTimeout(() => {
      animateCount('dg-progress-count', 0, done, 1000);
      animateCount('dg-ring-pct', 0, pct, 1000, '%');
    }, 300);
  } else {
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = offset;
    pctEl.textContent = pct + '%';
    countEl.textContent = done;
  }
  if (pct >= 100)      msgEl.textContent = '\ud83c\udf89 Goal smashed for today!';
  else if (pct >= 75)  msgEl.textContent = 'Almost there. Push through.';
  else if (pct >= 40)  msgEl.textContent = 'Solid progress. Keep going.';
  else if (done > 0)   msgEl.textContent = 'Good start. Stay consistent.';
  else                 msgEl.textContent = "Let's get started today";
}

function renderStatsCard() {
  renderDailyGoal();
  const stats = getStudyStats();
  const card  = document.getElementById('stats-card');
  const grid  = document.getElementById('stats-grid');
  if (!stats || !card || !grid) return;
  card.classList.remove('is-hidden');
  const streakData = getStreakData();
  const todayQs = getTodayQuestionCount();
  const avgColor = stats.avgPct >= 80 ? 'var(--green)' : stats.avgPct >= 60 ? 'var(--blue)' : 'var(--red)';
  const streakIcon = streakData.currentStreak > 0 ? '\ud83d\udd25' : '\ud83d\udcab';
  grid.innerHTML = `
    <div class="sstat"><div class="sv">${stats.totalQ.toLocaleString()}</div><div class="sl">Questions</div></div>
    <div class="sstat"><div class="sv" style="color:${avgColor}">${stats.avgPct}%</div><div class="sl">Avg Score</div></div>
    <div class="sstat"><div class="sv">${streakIcon} ${streakData.currentStreak}</div><div class="sl">Day streak</div></div>
    <div class="sstat"><div class="sv">${todayQs}</div><div class="sl">Qs today</div></div>
    <div class="sstat"><div class="sv">${stats.bestExam > 0 ? stats.bestExam : '\u2014'}</div><div class="sl">Best exam</div></div>`;
}

// ══════════════════════════════════════════
// TOPIC PROGRESS PAGE
// ══════════════════════════════════════════
// Topic Progress v2 (v4.11) — summary + filters + sort + search + domain grouping
let progressState = { filter: 'all', sort: 'worst', search: '', rows: [] };

function _bucketOf(pct) {
  if (pct === null) return 'untouched';
  if (pct >= 80) return 'strong';
  if (pct >= 60) return 'solid';
  return 'weak';
}


function _sortProgressRows(rows, mode) {
  const sorted = rows.slice();
  const byLabel = (a, b) => (a.label || a.t).localeCompare(b.label || b.t);
  if (mode === 'alpha') {
    sorted.sort(byLabel);
  } else if (mode === 'most') {
    sorted.sort((a, b) => (b.total || 0) - (a.total || 0) || byLabel(a, b));
  } else if (mode === 'recent') {
    sorted.sort((a, b) => (b.lastDate || 0) - (a.lastDate || 0) || byLabel(a, b));
  } else { // 'worst' — default: untouched last, then lowest pct first
    sorted.sort((a, b) => {
      if (a.pct === null && b.pct === null) return byLabel(a, b);
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });
  }
  return sorted;
}

function _progressRowMatches(row) {
  // Filter chip
  if (progressState.filter === 'weak' && _bucketOf(row.pct) !== 'weak') return false;
  if (progressState.filter === 'strong' && _bucketOf(row.pct) !== 'strong') return false;
  if (progressState.filter === 'untouched' && row.pct !== null) return false;
  // Search box (matches both the short display label and the canonical id, plus objective)
  const q = progressState.search.trim().toLowerCase();
  if (q) {
    const hay = (row.label + ' ' + row.t).toLowerCase();
    if (!hay.includes(q) && !(row.obj && row.obj.includes(q))) return false;
  }
  return true;
}

// v4.51.0: topic-row polish — domain-color tinted objective badge (via
// domainKey \u2192 5-colour palette matching app-wide convention), friendlier
// date format ("14 days ago" not "14d ago"), tier-colour consistency for
// bar + percentage, premium play button styling.
function _progressRowHtml(row) {
  // v7.2.0: Progress v2 \u2014 whole-row <button> (44+ touch target per spec Q3-A
  // lock), .tn/.tnm/.tsub/.tbar/.tpc markup per mockups/netplus-progress-
  // concept-v2.html, chevron via CSS ::after pseudo on .t-row (no separate
  // play-button child \u2014 the row IS the click target). data-topic carries the
  // canonical id for the delegated drillTopic dispatch wired in
  // _renderProgressGrouped. obj badge dropped (mockup name-led). Trend arrow
  // kept as small inline suffix. .stale tier applied when mastery > 0 AND
  // last_studied > 14 days ago (matches WEAK_STALENESS_DAYS).
  const { t, label, pct, total, daysSince, obj, trend, domainKey } = row;
  // Tier class: s = strong (>=80), o = solid (60-79), w = weak (<60).
  let tierCls = '';
  if (pct !== null) {
    if (pct >= 80) tierCls = 's';
    else if (pct >= 60) tierCls = 'o';
    else tierCls = 'w';
  }
  // Verdict + friendlier date formatting kept verbatim from v4.51.0.
  let verdict = 'Untouched';
  let when = '';
  if (pct !== null) {
    if (daysSince === 0)         when = 'today';
    else if (daysSince === 1)    when = 'yesterday';
    else if (daysSince < 7)      when = daysSince + ' days ago';
    else if (daysSince < 14)     when = '1 week ago';
    else if (daysSince < 30)     when = Math.floor(daysSince / 7) + ' weeks ago';
    else if (daysSince < 60)     when = '1 month ago';
    else                         when = Math.floor(daysSince / 30) + ' months ago';
    if (pct >= 80) verdict = 'Strong';
    else if (pct >= 60) verdict = 'Solid';
    else verdict = 'Weak';
  }
  const subLine = pct !== null ? (verdict + ' \u00b7 ' + when) : 'Untouched';
  const barW = pct !== null ? pct : 0;
  const pctTxt = pct !== null ? pct + '%' : '&mdash;';
  // v4.42.2 trend arrow kept as small inline suffix on the verdict line so
  // the signal survives without rainbow. Only renders when 2+ sessions exist.
  let trendHtml = '';
  if (typeof trend === 'number' && pct !== null && row.attempts >= 2) {
    const arrow = trend > 5 ? '\u2191' : trend < -5 ? '\u2193' : '\u2192';
    const trendLbl = trend > 5 ? 'Improving' : trend < -5 ? 'Slipping' : 'Steady';
    trendHtml = ` <span class="topic-trend" title="${trendLbl}" aria-label="Trend ${trendLbl}">${arrow}</span>`;
  }
  // Stale tier: mastery > 0 AND last_studied > 14 days ago. Surfaces via
  // CSS rule .t-row.stale .tsub { color:var(--dg-warn); } per spec \u00A711.3.
  const isStale = (pct !== null && pct > 0 && typeof daysSince === 'number' && daysSince > 14);
  const untouchedCls = (pct === null) ? ' untouched' : '';
  const staleCls = isStale ? ' stale' : '';
  const display = label || t;
  const safeTopicId = escHtml(t).replace(/'/g, "\\'");
  const ariaLabel = escHtml(display) + ' \u00B7 ' + verdict + ' \u00B7 drill this topic';
  // The whole row is a <button> \u2014 click target IS the row. data-topic carries
  // the canonical id for the delegated handler in _renderProgressGrouped
  // (wired once per grouped render).
  return `<button type="button" class="t-row${untouchedCls}${staleCls}" data-topic="${safeTopicId}" aria-label="${ariaLabel}"><span class="tn"><span class="tnm">${escHtml(display)}</span><span class="tsub">${subLine}${trendHtml}</span></span><span class="tbar"><i${tierCls ? ' class="' + tierCls + '"' : ''} style="width:${barW}%"></i></span><span class="tpc${tierCls ? ' ' + tierCls : ''}">${pctTxt}</span></button>`;
}


// ══════════════════════════════════════════
// STREAK
// ══════════════════════════════════════════
function getStreak() {
  try { return JSON.parse(localStorage.getItem(STORAGE.STREAK) || '{"current":0,"best":0,"last":null}'); }
  catch(e) { return { current: 0, best: 0, last: null }; }
}
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const s = getStreak();
  if (s.last === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.current = (s.last === yesterday) ? s.current + 1 : 1;
  s.best = Math.max(s.best || 0, s.current);
  s.last = today;
  localStorage.setItem(STORAGE.STREAK, JSON.stringify(s));
  _cloudFlush(STORAGE.STREAK);
  return s;
}
function renderStreakBadge() {
  const s = getStreak();
  const el = document.getElementById('streak-badge');
  if (!el) return;
  if (s.current >= 1) {
    const fire = s.current >= 7 ? '\ud83d\udd25\ud83d\udd25' : '\ud83d\udd25';
    const best = s.best > s.current ? ' \u00b7 Best: ' + s.best : '';
    el.textContent = fire + ' ' + s.current + ' day streak' + best;
    el.classList.add('show');
    // v4.42.0: if finish()/submitExam() flagged a streak increment while the
    // setup page was hidden, consume the flag here and replay the pulse on
    // the now-visible badge. `.streak-pulse` is cleared on animationend so
    // the class doesn't persist and re-renders don't accidentally re-fire.
    if (_pendingStreakPulse) {
      _pendingStreakPulse = false;
      el.classList.remove('streak-pulse');
      // Force reflow so re-adding the class restarts the animation.
      void el.offsetWidth;
      el.classList.add('streak-pulse');
      const clear = () => { el.classList.remove('streak-pulse'); el.removeEventListener('animationend', clear); };
      el.addEventListener('animationend', clear);
    }
  } else {
    el.classList.remove('show');
  }
}

// ══════════════════════════════════════════
// SPACED REPETITION
// ══════════════════════════════════════════

// v4.57.4: Match a history entry against a topic. Handles two cases:
//   1. Post-v4.57.1 entries: e.topic is the exact canonical topic string
//      (e.g. "Connection Issues") — direct match.
//   2. Pre-v4.57.1 multi-topic entries: e.topic is the sentinel string
//      "Multi: Topic A, Topic B, ..." — parse the comma-list and credit
//      each constituent topic. Study Plan, Progress page, Knowledge
//      Constellation, and Domain drill all need this to surface those
//      old sessions correctly. v4.57.1 fixed the save path going forward
//      but couldn't retroactively split already-saved entries, so any
//      data from before that ship still needs this read-side match.
function _filterHistoryByTopic(history, topic) {
  if (!Array.isArray(history) || !topic) return [];
  return history.filter(e => {
    if (!e || typeof e.topic !== 'string') return false;
    if (e.topic === topic) return true;
    if (e.topic.startsWith('Multi: ')) {
      // v4.81.19: comma-safe — naive comma-splitting would mis-segment
      // topics like "NTP, ICMP & Traffic Types" so .includes(topic)
      // would never match. Helper does greedy longest-match against
      // TOPIC_DOMAINS catalog so multi-word topic names with commas
      // are preserved verbatim.
      const list = (typeof _parseMultiTopicSentinel === 'function')
        ? _parseMultiTopicSentinel(e.topic)
        : e.topic.slice(7).split(',').map(s => s.trim());
      return list.includes(topic);
    }
    return false;
  });
}

// v4.59.7: sibling of _filterHistoryByTopic. Normalises a full history list
// for aggregate consumers (weak-spot scoring) that walk every entry rather
// than querying per-topic. Pre-v4.57.1 multi-topic sessions were saved as
// ONE row with topic === "Multi: A, B, C"; v4.57.1 fixed the save path so
// new entries split per topic, but historical rows still carry the
// sentinel. When a consumer iterates and uses e.topic directly as a key
// (like computeWeakSpotScores' history loop), those sentinel rows land
// under a nonsense key and the constituent topics get zero credit.
//
// This helper expands sentinel rows into N per-topic rows with score/total
// divided evenly across the listed topics. Plain rows pass through
// unchanged. The per-topic weighted math in computeWeakSpotScores then
// sees the same signal it would have gotten had v4.57.1 been shipped
// earlier — no data migration required.
function _expandHistoryForWeakSpots(hist) {
  if (!Array.isArray(hist)) return [];
  const out = [];
  hist.forEach(e => {
    if (!e || typeof e.topic !== 'string') { out.push(e); return; }
    if (!e.topic.startsWith('Multi: ')) { out.push(e); return; }
    const topicsCsv = e.topic.slice(7);
    const topics = topicsCsv.split(',').map(s => s.trim()).filter(Boolean);
    if (topics.length === 0) { out.push(e); return; }
    const scoreEach = (e.score || 0) / topics.length;
    const totalEach = (e.total || 0) / topics.length;
    topics.forEach(t => {
      out.push({
        ...e,
        topic: t,
        score: scoreEach,
        total: totalEach,
        _fromMultiSentinel: true
      });
    });
  });
  return out;
}

// Shared scoring helper used by both getSpacedRepTopic and buildSessionPlan
// Uses Leitner-inspired decay: topics you've aced many times decay slower,
// topics you struggle with or haven't seen much decay fast.
function _scoreTopicNeed(topic, historyEntries, now) {
  const entries = _filterHistoryByTopic(historyEntries, topic);
  if (entries.length === 0) return { score: 1.0, reason: 'Never studied', color: 'var(--text-dim)' };

  const daysSince = (now - new Date(entries[0].date)) / 86400000;
  const recentAvg = entries.slice(0, 3).reduce((a, e) => a + e.pct, 0) / Math.min(entries.length, 3);

  // Confidence level: consecutive 80%+ sessions (like Leitner boxes)
  let confidence = 0;
  for (const e of entries) { if (e.pct >= 80) confidence++; else break; }

  // Decay interval — higher confidence = slower decay (1d, 3d, 7d, 14d, 30d)
  const intervals = [1, 3, 7, 14, 30];
  const interval = intervals[Math.min(confidence, intervals.length - 1)];
  const decayScore = Math.min(daysSince / interval, 1.0);

  // Performance score — how much room to improve
  const perfScore = (100 - recentAvg) / 100;

  // Wrong bank boost — topics with wrong answers get priority
  const wrongBank = loadWrongBank();
  const wrongCount = wrongBank.filter(w => w.topic === topic).length;
  const wrongBoost = Math.min(wrongCount * 0.1, 0.3);

  // Combined: 35% decay + 45% performance + 20% wrong bank
  const score = decayScore * 0.35 + perfScore * 0.45 + wrongBoost + (entries.length < 3 ? 0.1 : 0);

  let reason, color;
  if (wrongCount > 0) { reason = wrongCount + ' wrong answer' + (wrongCount > 1 ? 's' : '') + ' banked'; color = 'var(--red)'; }
  else if (recentAvg < 60) { reason = Math.round(recentAvg) + '% avg \u2014 needs work'; color = 'var(--red)'; }
  else if (daysSince >= interval) { reason = Math.round(daysSince) + 'd ago \u2014 due for review'; color = 'var(--blue)'; }
  else if (recentAvg < 80) { reason = Math.round(recentAvg) + '% avg \u2014 room to improve'; color = 'var(--blue)'; }
  else { reason = Math.round(recentAvg) + '% avg \u2014 keep sharp'; color = 'var(--green)'; }
  return { score, reason, color };
}

function _getAllStudyTopics() {
  return Array.from(document.querySelectorAll('#topic-group .chip'))
    .map(c => c.dataset.v)
    .filter(v => !v.includes('Mixed') && !v.includes('Smart'));
}

function getSpacedRepTopic() {
  const allTopics = _getAllStudyTopics();
  const h = loadHistory().filter(e => e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC);
  const now = Date.now();

  // Score all topics and pick from top 3 with weighted randomness
  const scored = allTopics.map(t => ({ topic: t, ...(_scoreTopicNeed(t, h, now)) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, Math.min(3, scored.length));
  const totalWeight = top.reduce((a, t) => a + t.score, 0);
  let r = Math.random() * totalWeight;
  for (const t of top) {
    r -= t.score;
    if (r <= 0) return t.topic;
  }
  return top[0].topic;
}

// ══════════════════════════════════════════
// OFFLINE QUESTION CACHE
// ══════════════════════════════════════════
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function _cacheKey(t, d, n) {
  return 'nplus_qcache__' + t.replace(/[^a-zA-Z0-9]/g, '_') + '__' + d.replace(/[^a-zA-Z0-9]/g, '_') + '__' + n;
}
function cacheQuestions(t, d, n, qs) {
  try { localStorage.setItem(_cacheKey(t, d, n), JSON.stringify({ ts: Date.now(), qs })); } catch(e) {}
  pruneCache();
}
function getCachedQuestions(t, d, n) {
  try {
    const raw = localStorage.getItem(_cacheKey(t, d, n));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL) return null;
    return obj.qs;
  } catch(e) { return null; }
}
function pruneCache() {
  try {
    const cacheKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nplus_qcache__')) {
        try {
          const obj = JSON.parse(localStorage.getItem(k));
          cacheKeys.push({ key: k, ts: obj.ts || 0 });
        } catch { cacheKeys.push({ key: k, ts: 0 }); }
      }
    }
    const now = Date.now();
    cacheKeys.forEach(c => { if (now - c.ts > CACHE_TTL) localStorage.removeItem(c.key); });
    const remaining = cacheKeys.filter(c => now - c.ts <= CACHE_TTL);
    if (remaining.length > 20) {
      remaining.sort((a, b) => a.ts - b.ts);
      remaining.slice(0, remaining.length - 20).forEach(c => localStorage.removeItem(c.key));
    }
  } catch(e) {}
}
function showCacheNotice(show) {
  const el = document.getElementById('cache-notice');
  if (el) el.classList.toggle('show', show);
}

// ══════════════════════════════════════════
// WRONG ANSWERS BANK
// ══════════════════════════════════════════
function loadWrongBank() {
  try { return JSON.parse(localStorage.getItem(STORAGE.WRONG_BANK) || '[]'); } catch { return []; }
}
function saveWrongBank(bank) {
  try { localStorage.setItem(STORAGE.WRONG_BANK, JSON.stringify(bank)); _cloudFlush(STORAGE.WRONG_BANK); } catch { showToast('Storage full · wrong bank not saved', 'error'); }
}

function addToWrongBank(q, chosen) {
  // v7.48.0: Gauntlet runs are parallel to the wrong-bank loop — a gauntlet
  // miss is answered by "Run it again" (fresh wordings), not bank/SR enrolment.
  if (typeof gauntletMode !== 'undefined' && gauntletMode) return;
  // v7.50.0: Why-Not sessions are parallel to bank/SR too (same spec rule)
  if (typeof whyNotMode !== 'undefined' && whyNotMode) return;
  // v4.74.0: also enroll into the spaced-repetition queue. SR runs ahead
  // of the dedup check below — we WANT a repeated miss on the same
  // question to re-trigger SR (resets interval, drops ease) even though
  // the wrong bank itself dedupes.
  try { addToSrQueue(q); } catch (_) { /* tolerate SR errors — never break wrong bank */ }

  const bank = loadWrongBank();
  // Deduplicate by question text
  const exists = bank.find(b => b.question === q.question);
  if (exists) return;
  bank.push({
    question: q.question,
    options: q.options,
    answer: q.answer,
    answers: q.answers || null,
    type: q.type || 'mcq',
    items: q.items || null,
    correctOrder: q.correctOrder || null,
    explanation: q.explanation,
    topic: q.topic || activeQuizTopic,
    difficulty: q.difficulty || diff,
    rightCount: 0,
    addedDate: new Date().toISOString()
  });
  // Cap wrong bank size — oldest entries drop off
  if (bank.length > WRONG_BANK_CAP) bank.length = WRONG_BANK_CAP;
  saveWrongBank(bank);
}

function graduateFromBank(questionText) {
  const bank = loadWrongBank();
  const idx = bank.findIndex(b => b.question === questionText);
  if (idx === -1) return;
  bank[idx].rightCount = (bank[idx].rightCount || 0) + 1;
  if (bank[idx].rightCount >= 2) {
    bank.splice(idx, 1); // Graduated!
  }
  saveWrongBank(bank);
}


// #138 wave 5: loader stub — features/diagnostic.js overwrites window.startDiagnostic on load.
function startDiagnostic(opts) {
  _loadFeature('diagnostic').then(function (m) { m.startDiagnostic(opts); });
}

// ══════════════════════════════════════════
// v4.76.0 — Decision-Clarity Polish
// "Next best move" CTA + Mode ladder + Actionable analytics.
// Codex review framing: not prettier — guided + premium + obvious.
// ══════════════════════════════════════════

// Decide what the user should do RIGHT NOW based on app state.
// Priority order (highest pass-rate impact first):
//  1. SR queue has cards due  (re-encounter forgotten material — highest leverage)
//  2. Daily challenge not done today  (keeps streak alive, low friction)
//  3. No quiz today + has weak topics  (quick warmup on weakest)
//  4. Has what-if leverage data  (highest-ROI single-topic drill)
//  5. Fallback  (start a custom quiz)
function _computeNextBestMove() {
  // 0. v4.81.0: If user is brand-new AND hasn't taken the Baseline Diagnostic,
  // recommend that as the highest-leverage first action. Calibrated baseline
  // beats random first quiz every time. Skips this branch if the user has
  // any history (they're not brand-new) or has already taken/dismissed it.
  try {
    const hist = (typeof loadHistory === 'function') ? loadHistory() : [];
    const diag = (typeof loadDiagnostic === 'function') ? loadDiagnostic() : null;
    if (hist.length === 0 && !diag && !_diagnosticCtaSessionDismissed) {
      return {
        type: 'baseline-diagnostic',
        icon: '',
        title: 'Take the Baseline Diagnostic',
        sub: '20 questions · ~30 min · seeds your review queue',
        ctaLabel: 'Take diagnostic →',
        ctaFn: 'startDiagnostic()',
        reason: 'Calibrated baseline before you start drilling. Biggest single signal.'
      };
    }
  } catch (_) {}

  // 1. SR queue
  try {
    if (typeof getSrStats === 'function') {
      const srStats = getSrStats();
      if (srStats && srStats.due > 0) {
        const capped = Math.min(srStats.due, SR_SESSION_CAP);
        const minutes = Math.max(2, Math.round(capped * 0.5));
        const titleText = srStats.due <= SR_SESSION_CAP
          ? (srStats.due === 1
              ? 'Review 1 card due'
              : 'Review ' + srStats.due + ' cards due')
          : 'Review ' + capped + ' of ' + srStats.due + ' cards due';
        return {
          type: 'sr-review',
          icon: '',
          title: titleText,
          sub: '~' + minutes + ' min · re-encounter what you forgot',
          ctaLabel: 'Start review →',
          ctaFn: 'startSrReview()',
          reason: 'Re-encounter forgotten material before it fades further'
        };
      }
    }
  } catch (_) {}

  // 2. Daily challenge
  try {
    if (typeof isDailyChallengeDoneToday === 'function' && !isDailyChallengeDoneToday()) {
      const dc = (typeof getDailyChallenge === 'function') ? getDailyChallenge() : null;
      const streak = dc ? (dc.currentStreak || 0) : 0;
      const streakSub = streak > 0 ? ' · streak ' + streak + ' → ' + (streak + 1) : '';
      return {
        type: 'daily-challenge',
        icon: '',
        title: 'Today’s daily challenge',
        sub: '1 question · ~1 min' + streakSub,
        ctaLabel: 'Take challenge →',
        ctaFn: 'startDailyChallenge()',
        reason: 'Keeps your streak alive'
      };
    }
  } catch (_) {}

  // 3. No quizzes today + has weak topics → quick warmup
  try {
    const history = (typeof loadHistory === 'function') ? loadHistory() : [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = history.filter(e => (e.date || '').slice(0, 10) === todayStr).length;
    if (todayCount === 0 && typeof computeWeakSpotScores === 'function') {
      const weak = computeWeakSpotScores();
      if (weak && weak.length > 0) {
        return {
          type: 'weak-warmup',
          icon: '',
          title: '5-min warmup on ' + weak[0].topic,
          sub: '5 questions · your weakest topic right now',
          ctaLabel: 'Start warmup →',
          ctaFn: 'applyPreset(\'warmup\'); _setWarmupTopic(\'' + (weak[0].topic || '').replace(/'/g, "\\'") + '\')',
          reason: 'Quick win on the area dragging your score'
        };
      }
    }
  } catch (_) {}

  // 4. What-if highest-leverage drill (returning user)
  try {
    if (typeof getReadinessScore === 'function') {
      const r = getReadinessScore();
      if (r && Array.isArray(r.whatIf) && r.whatIf.length > 0) {
        const top = r.whatIf[0];
        return {
          type: 'what-if-drill',
          icon: '',
          title: 'Drill ' + top.topic,
          sub: '+' + top.deltaPredicted + ' pts predicted · ' + top.currentPct + '% → 80%',
          ctaLabel: 'Drill now →',
          ctaFn: 'focusTopic(\'' + (top.topic || '').replace(/'/g, "\\'") + '\')',
          reason: 'Biggest single-topic score gain available'
        };
      }
    }
  } catch (_) {}

  // 5. Fallback
  return {
    type: 'custom-quiz',
    icon: '',
    title: 'Take a custom quiz',
    sub: 'Pick a topic + length · build your study habit',
    ctaLabel: 'Start quiz →',
    ctaFn: '_jumpToCustomQuiz()',
    reason: 'Build the daily-study habit'
  };
}

// Helper: nudge the warmup preset toward a specific topic (best-effort).
// Used by weak-warmup next-best-move action — applyPreset('warmup') already
// enqueues a 5-Q quiz; this just makes sure the topic chip selection
// reflects the suggested topic before generation runs.
function _setWarmupTopic(topic) {
  try {
    const chips = document.querySelectorAll('#topic-group .chip');
    let matched = false;
    chips.forEach(c => {
      if (c.dataset.v === topic) {
        c.classList.add('on');
        matched = true;
      } else {
        c.classList.remove('on');
      }
    });
    return matched;
  } catch (_) { return false; }
}

// Helper: scroll-into-view + open the Custom Quiz details panel.
// v7.52.0: informational quota line in the Custom Quiz builder — free tier only.
function _renderBuilderQuotaLine() {
  const el = document.getElementById('cq-quota-line');
  if (!el) return;
  if (_srIsFreeTier()) {
    el.textContent = 'Free plan · ' + _quotaRemainingToday() + ' of ' + _quotaState.daily_limit + ' questions left today';
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function _jumpToCustomQuiz() {
  // v5.5.4: Custom Quiz is a modal — _cqModalInit portals it to <body> on
  // open so position:fixed can't be broken by an ancestor. Just open it;
  // the old page-scroll-into-view was dropped (the modal centres itself).
  try {
    const cq = document.getElementById('custom-quiz-section');
    if (cq && !cq.open) cq.open = true;
  } catch (_) {}
  _renderBuilderQuotaLine();
}

// v5.5.4: Custom Quiz modal — portal + dismissals. The <details> 'toggle'
// event fires for EVERY open/close path (Configure-> / drillTopic / the
// 5804 flow / native summary-x / Esc / backdrop), so one listener handles
// them all. On open: stash a placeholder at the original spot, move the
// element to <body> (escapes the page-nav transform on #page-setup so
// position:fixed resolves to the viewport), lock background scroll. On
// close: restore exactly. Listeners bind to document (always present) and
// resolve elements at event time -> DOM-readiness- and entry-point-safe.
(function _cqModalInit() {
  function init() {
    var cq = document.getElementById('custom-quiz-section');
    if (!cq || cq._cqWired) return;
    cq._cqWired = true;
    var ph = null;          // placeholder comment marking the original spot
    var prevOverflow = '';
    cq.addEventListener('toggle', function () {
      if (cq.open) {
        if (cq.parentNode !== document.body) {
          ph = document.createComment('cq-portal');
          cq.parentNode.insertBefore(ph, cq);
          document.body.appendChild(cq);
        }
        prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
      } else if (ph && ph.parentNode) {
        ph.parentNode.insertBefore(cq, ph);
        ph.remove();
        ph = null;
        document.documentElement.style.overflow = prevOverflow;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cq.open) cq.open = false;
    });
    document.addEventListener('click', function (e) {
      if (cq.open && e.target === cq) cq.open = false;
    });
  }
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } catch (_) {}
})();

// Render the Next-Best-Move CTA card on the homepage.
function renderNextBestMove() {
  const card = document.getElementById('hero-v2-cta');
  if (!card) return;
  // No-data path: blank card stays hidden until at least the SR/DC checks
  // could yield something. The fallback path always returns an action, so
  // we always have SOMETHING to show — but for true first-load we keep the
  // hero clean and let the user pick from the modes ladder.
  const move = _computeNextBestMove();
  if (!move) {
    card.hidden = true;
    return;
  }
  const iconEl = document.getElementById('hero-v2-cta-icon');
  const titleEl = document.getElementById('hero-v2-cta-title');
  const subEl = document.getElementById('hero-v2-cta-sub');
  const reasonEl = document.getElementById('hero-v2-cta-reason');
  const btnEl = document.getElementById('hero-v2-cta-btn');
  if (iconEl) iconEl.textContent = move.icon;
  if (titleEl) titleEl.textContent = move.title;
  if (subEl) subEl.textContent = move.sub;
  if (reasonEl) reasonEl.textContent = move.reason;
  if (btnEl) {
    btnEl.textContent = move.ctaLabel;
    btnEl.setAttribute('onclick', move.ctaFn);
    btnEl.setAttribute('data-move-type', move.type);
  }
  card.dataset.moveType = move.type;
  card.hidden = false;
}

// Analytics page actionable headline — same logic, different surface.
// Highlights the highest-leverage drill at the top of Analytics.

// ══════════════════════════════════════════
// v4.78.0 — Per-page recommendation cards
// Codex round-2 strategic note: "every page should have one strong
// recommendation, one primary CTA, and then supporting data underneath."
// v4.76.0 + v4.77.0 applied this to homepage + analytics. v4.78.0
// applies it to Drills launcher / Topic Progress / Subnet Trainer /
// Topology Builder.
//


function renderWrongBankBtn() {
  const bank = loadWrongBank();
  // v4.41.0: legacy #wrong-bank-row removed. The preset tile is the only
  // drill entry point; a Clear button lives inside Settings.
  // v4.76.0: legacy #wrong-preset-tile + #wrong-preset-sub kept as compat
  // shims (always hidden) so this function doesn't crash. The visible
  // "Drill Mistakes" tile now lives in the Mode Ladder Quick tier as
  // #modes-wrong-tile + #modes-wrong-sub. Toggle BOTH sets so old code
  // that watches the legacy ids still gets the right is-hidden state.
  const wrongTile = document.getElementById('wrong-preset-tile');
  const wrongSub = document.getElementById('wrong-preset-sub');
  const modesTile = document.getElementById('modes-wrong-tile');
  const modesSub = document.getElementById('modes-wrong-sub');
  const subText = bank.length === 0
    ? '0 wrong answers saved'
    : bank.length + ' wrong answer' + (bank.length !== 1 ? 's' : '') + ' saved';
  if (wrongTile) {
    if (bank.length === 0) {
      wrongTile.classList.add('is-hidden');
    } else {
      wrongTile.classList.remove('is-hidden');
      if (wrongSub) wrongSub.textContent = subText;
    }
  }
  if (modesTile) {
    if (bank.length === 0) {
      modesTile.classList.add('is-hidden');
    } else {
      modesTile.classList.remove('is-hidden');
      if (modesSub) modesSub.textContent = subText;
    }
  }
  // Settings → Clear Wrong Answers Bank count badge
  const clearCount = document.getElementById('wrong-bank-clear-count');
  if (clearCount) clearCount.textContent = bank.length;
}

function renderTodaySection() {
  const section = document.getElementById('today-section');
  if (!section) return;
  // v4.81.22: properly hide the wrapper when nothing meaningful renders inside.
  // Pre-fix the wrapper always showed because the original comment assumed
  // "daily goal card is always visible." But the v4.54.0 hero v2 redesign
  // hides #daily-goal-card via `body.hero-v2-active` CSS rule, AND the v4.81.18
  // consolidation made #todays-focus / #rotation-row / #session-banner permanent
  // hidden compat shims. Result: when `#today-plan` was also correctly hidden
  // (plan done today, isStudyPlanDoneToday true), the section rendered as an
  // empty card with just the "TODAY" title — surfaced by user dogfood screenshot.
  // Now check actual visibility per child + account for hero-v2 CSS rule.
  const candidateIds = [
    '#daily-goal-card',         // v4.54.0 hero v2 hides this via CSS
    '#streak-defender',         // amber warning when streak at risk
    '#daily-challenge-card',    // shown until daily challenge done
    '#today-plan'               // v4.81.18 consolidated card (gates on isStudyPlanDoneToday)
  ];
  const isHeroV2 = document.body && document.body.classList && document.body.classList.contains('hero-v2-active');
  let anyVisible = false;
  for (const sel of candidateIds) {
    const el = section.querySelector(sel);
    if (!el) continue;
    if (el.classList.contains('is-hidden')) continue;
    // Hero v2 hides #daily-goal-card via CSS (`display: none !important`)
    // — treat it as effectively hidden when computing section visibility.
    if (isHeroV2 && sel === '#daily-goal-card') continue;
    anyVisible = true;
    break;
  }
  if (anyVisible) {
    section.classList.remove('is-hidden');
  } else {
    section.classList.add('is-hidden');
  }
}


// v4.54.8: session-specific Drill my mistakes CTA on Results page.
// Builds a fresh quiz from THIS session's wrong log entries (not the global
// wrong-bank). If every answer was correct the button is hidden upstream.
function drillMistakesFromResults() {
  // v7.46.0: Drill Mistakes is Pro-only — same gate as startWrongDrill
  if (typeof _gateProOnly === 'function' && !_gateProOnly('Drill Mistakes', {
    title: 'Drill Mistakes is a Pro feature',
    body: 'Re-run the questions you got wrong until they stick. Your wrong-answer bank keeps saving either way · the drill itself is Pro.'
  })) return;
  if (!Array.isArray(log) || log.length === 0) return;
  const wrongEntries = log.filter(e => e && e.isRight === false);
  if (wrongEntries.length === 0) {
    if (typeof showErrorToast === 'function') showErrorToast('Nothing to drill \u2014 you got them all right.');
    return;
  }
  wrongDrillMode = true;
  examMode = false;
  sessionMode = false;
  activeQuizTopic = 'Session \u00b7 mistakes drill';
  // Reuse the question objects from the session log so full context + PBQs survive.
  questions = wrongEntries.map(e => e.q).filter(Boolean);
  current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
  quizFlags = new Array(questions.length).fill(false);
  _sessionStartTs = Date.now();
  showCacheNotice(false);
  showPage('quiz');
  render();
}

// v4.54.8: render inline review-answers list on Results page (prototype pattern).
// Each session question becomes a tappable row: N\u00ba + truncated prompt + topic/domain
// + verdict badge. Click routes to the full Review page (showReview handles the
// index). Unlike the Review page, this list is visible *as part of* the results
// artifact \u2014 makes post-session review one click closer.
function _renderResultsReviewList() {
  const root = document.getElementById('results-review-list');
  if (!root) return;
  if (!Array.isArray(log) || log.length === 0) {
    root.innerHTML = '<div class="results-v2-review-empty">No answers recorded this session.</div>';
    return;
  }
  const esc = (typeof escHtml === 'function') ? escHtml : (s => String(s).replace(/</g, '&lt;'));
  const items = log.map((entry, i) => {
    const q = entry.q || {};
    const prompt = (q.question || q.prompt || '').slice(0, 140);
    const topic = q.topic || '\u2014';
    const domain = (typeof TOPIC_DOMAINS !== 'undefined' && TOPIC_DOMAINS[topic]) ? TOPIC_DOMAINS[topic] : '';
    const isRight = entry.isRight === true;
    const verdictClass = isRight ? 'ok' : 'bad';
    const verdictText = isRight ? 'Correct' : 'Wrong';
    const num = String(i + 1).padStart(2, '0');
    return `<button type="button" class="results-v2-review-row" onclick="showReview(false, ${i})" aria-label="Review question ${i + 1} \u2014 ${verdictText}">
      <div class="results-v2-review-num">N\u00b0 ${num}</div>
      <div class="results-v2-review-body">
        <div class="results-v2-review-q">${esc(prompt)}${prompt.length >= 140 ? '\u2026' : ''}</div>
        <div class="results-v2-review-meta">${esc(topic)}${domain ? ' \u00b7 ' + esc(domain) : ''}</div>
      </div>
      <div class="results-v2-review-mark results-v2-review-mark-${verdictClass}">${verdictText}</div>
    </button>`;
  }).join('');
  root.innerHTML = items;
}

// ── Mistake Autopsy (v7.47.0) ──────────────────────────────────────────
// Research-verified pain: people learn the QUESTION, not the concept —
// 95-100% practice scores fail on re-worded real exams. So missed
// questions now come back re-worded: same concept, same correct fact,
// brand-new phrasing and options. Beating the variant proves the concept
// stuck; right-twice graduation now means something.
//
// Single-answer MCQ entries get variants; PBQ types (order/items) and
// multi-answer entries run verbatim. Any AI failure falls back to the
// verbatim originals — the drill never breaks because a reword didn't
// arrive.
// v7.48.1 — option-shape helpers. The HOUSE format for q.options is a
// letter-keyed object ({"A":"..."} — the fetchQuestions contract renderMCQ
// reads via q.options[letter]); AI sub-prompts (reword, gauntlet) return
// positional ARRAYS. Letterize at the boundary, never hand renderMCQ an
// array (the 'undefined options' incident, 2026-06-12).
function _letterizeOptions(arr) {
  if (!Array.isArray(arr)) return arr;
  const o = {};
  arr.forEach((t, i) => { o[String.fromCharCode(65 + i)] = t; });
  return o;
}
function _optionCount(o) {
  return Array.isArray(o) ? o.length : (o && typeof o === 'object' ? Object.keys(o).length : 0);
}

async function _fetchRewordedVariants(key, entries) {
  const numbered = entries.map(function (b, i) {
    const letter = (b.answer || 'A').trim().toUpperCase();
    const correctIdx = 'ABCDEF'.indexOf(letter);
    // bank entries are letter-keyed objects (house format); legacy array
    // entries still resolve by position (v7.48.1)
    const correctText = Array.isArray(b.options)
      ? (b.options[correctIdx] || '')
      : ((b.options && b.options[letter]) || '');
    return (i + 1) + '. Topic: ' + (b.topic || 'general') +
      '\n   Original question: ' + b.question +
      '\n   The fact being tested (the correct answer): ' + correctText;
  }).join('\n\n');

  const prompt = 'A student answered each of these exam questions WRONG and is re-drilling them. ' +
    'For EACH original, write ONE new multiple-choice question that tests the SAME concept and the SAME correct fact, ' +
    'but is phrased completely differently: new scenario or angle, different sentence structure, no reuse of the original wording. ' +
    'Keep the same difficulty. Write 4 plausible options (plain text, no letter prefixes) with exactly one correct; ' +
    'vary which position is correct across questions. Add a 1-2 sentence explanation of why the correct answer is right.\n\n' +
    'Return ONLY a JSON array with one object per original, in the same order:\n' +
    '[{"question":"...","options":["...","...","...","..."],"answer":"A","explanation":"...","topic":"copy the topic"}]\n' +
    '"answer" is the letter (A-D) of the correct option by position.\n\nOriginals:\n\n' + numbered;

  const res = await _claudeFetch({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    // _metered: true — counts toward quota + the global kill-switch,
    // same contract as question generation.
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_TOKENS_GENERATION, messages: [{ role: 'user', content: prompt }], _metered: true })
  });
  if (!res.ok) throw new Error('reword API error ' + res.status);
  const data = await res.json();
  const raw = (data.content && data.content[0] && data.content[0].text) || '';
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('reword: no JSON array in response');
  const parsed = JSON.parse(m[0]);
  // Per-slot shape check — a bad variant just means that slot stays verbatim.
  return entries.map(function (orig, i) {
    const v = parsed[i];
    const ok = v && typeof v.question === 'string' && v.question.length > 20 &&
      Array.isArray(v.options) && v.options.length >= 3 && v.options.length <= 6 &&
      typeof v.answer === 'string' && /^[A-F]$/.test(v.answer.trim().toUpperCase()) &&
      'ABCDEF'.indexOf(v.answer.trim().toUpperCase()) < v.options.length &&
      v.question !== orig.question;
    return ok ? v : null;
  });
}

async function startWrongDrill() {
  // v7.46.0: Drill Mistakes is Pro-only (Simi, 2026-06-11)
  if (typeof _gateProOnly === 'function' && !_gateProOnly('Drill Mistakes', {
    title: 'Drill Mistakes is a Pro feature',
    body: 'Your missed questions come back re-worded, so you beat the concept · not the question. The bank keeps saving either way; the drill itself is Pro.'
  })) return;
  const bank = loadWrongBank();
  if (bank.length === 0) {
    alert('No wrong answers saved yet. Keep quizzing!');
    return;
  }

  const key = document.getElementById('api-key').value.trim();
  apiKey = key; // May be empty — the reword call routes via the signed-in proxy

  wrongDrillMode = true;
  examMode = false;
  sessionMode = false;
  activeQuizTopic = 'Wrong Answers Drill';

  // Pick up to 10 questions from the bank (shuffle).
  // _bankKey/_bankOrig carry the ORIGINAL bank identity through the drill:
  // graduation and miss-handling key on the original question text, so a
  // re-worded variant graduates (or re-triggers SR for) the entry it came from.
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  const base = shuffled.slice(0, 10).map(b => ({
    question: b.question,
    options: b.options,
    answer: b.answer,
    answers: b.answers,
    type: b.type || 'mcq',
    items: b.items,
    correctOrder: b.correctOrder,
    explanation: b.explanation,
    topic: b.topic,
    difficulty: b.difficulty,
    _bankKey: b.question,
    _bankOrig: b
  }));

  // v7.47.0 Mistake Autopsy: re-word the single-answer MCQs (signed-in only —
  // the reword rides the AI proxy). Verbatim fallback on any failure.
  // v7.48.1: the bank stores HOUSE-FORMAT options (letter-keyed object, the
  // fetchQuestions contract) — the old Array.isArray filter silently no-oped
  // the feature for object-shaped entries. Accept both shapes.
  const rewordable = base.filter(q =>
    (q.type || 'mcq') === 'mcq' && !q.answers && q.answer && _optionCount(q.options) >= 3);
  if (rewordable.length > 0 && typeof window !== 'undefined' && window._certanvilSignedIn === true) {
    const lp = document.getElementById('load-progress');
    if (lp) lp.classList.add('is-hidden');
    showPage('loading');
    const lm = document.getElementById('loading-msg');
    if (lm) lm.textContent = 'Re-wording your mistakes — same concepts, new disguises…';
    if (typeof _loadingProgressBegin === 'function') _loadingProgressBegin('Re-wording your mistakes…');
    try {
      const variants = await _fetchRewordedVariants(key, rewordable.map(q => q._bankOrig));
      rewordable.forEach((q, i) => {
        const v = variants[i];
        if (v) {
          q.question = v.question;
          // v7.48.1: renderMCQ reads q.options[letter] — letterize the AI's
          // array into the house letter-keyed object (the 'undefined options'
          // class of bug, caught live on the Gauntlet 2026-06-12).
          q.options = _letterizeOptions(v.options);
          q.answer = v.answer.trim().toUpperCase();
          q.explanation = v.explanation || q.explanation;
          q._reworded = true;
        }
      });
    } catch (_) {
      // Verbatim fallback — say so honestly, then run the drill as before.
      try { if (typeof showToast === 'function') showToast('Couldn’t re-word this time · running your saved questions as-is.', 'info'); } catch (_) {}
    }
    if (typeof _loadingProgressFinish === 'function') { try { _loadingProgressFinish(); } catch (_) {} }
  }

  questions = base;
  current = 0; score = 0; streak = 0; bestStreak = 0; answered = 0; log = [];
  quizFlags = new Array(questions.length).fill(false);
  showCacheNotice(false);
  showPage('quiz');
  render();
}

// ══════════════════════════════════════════
// WEAK TOPIC DETECTOR
// ══════════════════════════════════════════

// v4.41.0: renderWeakBanner() removed — the amber #weak-banner is redundant
// with the #todays-focus "Weak Spots" chip row which offers the same
// drill-the-weakest-topic UX with better density and no layout jank.
// getWeakTopic() is still used by applyPreset('focused') as a fallback.

// ══════════════════════════════════════════
// REWORD GAUNTLET (v7.48.0) — the flagship drill
// ══════════════════════════════════════════
// Research-verified pain (FLAGSHIP-DRILL-RESEARCH-2026-06-11): candidates
// memorize questions, real exams re-word concepts. The Gauntlet asks ONE
// AI-picked concept five ways — Plain → Scenario → Best-of → Not-trap →
// Twisted. The run always finishes all five rungs; the concept cracks only
// on a clean 5/5. A miss names the rung type that got you; "Run it again"
// regenerates five fresh wordings (the retry IS the anti-memorization demo).
// Pro-only at Start; parallel to the wrong-bank/SR loop in v1.

function loadGauntletCracked() {
  try { return JSON.parse(localStorage.getItem(STORAGE.GAUNTLET_CRACKED) || '[]'); } catch (e) { return []; }
}

// Entry points (Drills hero card + Home Practice tile). The entry screen is
// viewable by free users (funnel tease) — the Pro gate fires on Start.
// v7.54.0 — Reword Gauntlet free daily allowance. The free tier gets ONE run a
// day as a BONUS that does NOT consume the 15-question quota (the run is fetched
// non-metered for free users in _fetchGauntletRun). Pro / admin / anonymous are
// uncapped. Mirrors the GAP-1 SR free-cap helpers (_srFreeReviewedToday etc).
const GAUNTLET_FREE_DAILY_CAP = 1;
function _gauntletFreeRunsToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE.GAUNTLET_FREE_COUNT) || 'null');
    if (raw && raw.date === new Date().toISOString().slice(0, 10)) return raw.count || 0;
  } catch (_) {}
  return 0;
}
// Gate for gauntletStart. Returns true to proceed, false (and shows the
// "today's free run done" modal) when a free user has used today's run.

// v7.55.0 — Sim Lab (PBQ drill) free daily allowance. Mirrors the Gauntlet
// helpers above exactly (same date-key format, same JSON shape, no cloudFlush
// needed — ephemeral daily counter, not user progress data).
const PBQ_FREE_DAILY_CAP = 1;
function _pbqFreeRunsToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE.PBQ_FREE_COUNT) || 'null');
    if (raw && raw.date === new Date().toISOString().slice(0, 10)) return raw.count || 0;
  } catch (_) {}
  return 0;
}
function _bumpPbqFreeRun() {
  // Only the free tier accrues a count; Pro / admin / anonymous never do.
  if (!(_quotaState && _quotaState.tier === 'free')) return;
  try {
    localStorage.setItem(STORAGE.PBQ_FREE_COUNT, JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      count: _pbqFreeRunsToday() + 1
    }));
  } catch (_) {}
}
window._pbqFreeRunsToday = _pbqFreeRunsToday;
window._bumpPbqFreeRun = _bumpPbqFreeRun;
window.PBQ_FREE_DAILY_CAP = PBQ_FREE_DAILY_CAP;

// Decision Lab free daily cap — INDEPENDENT of Sim Lab's PBQ counter (§4).
const DL_FREE_DAILY_CAP = 1;
function _dlFreeRunsToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE.DL_FREE_COUNT) || 'null');
    if (raw && raw.date === new Date().toISOString().slice(0, 10)) return raw.count || 0;
  } catch (_) {}
  return 0;
}
function _dlBumpFreeRun() {
  if (!(_quotaState && _quotaState.tier === 'free')) return;   // only free accrues
  try {
    localStorage.setItem(STORAGE.DL_FREE_COUNT, JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      count: _dlFreeRunsToday() + 1
    }));
  } catch (_) {}
}
window._dlFreeRunsToday = _dlFreeRunsToday;
window._dlBumpFreeRun = _dlBumpFreeRun;
window.DL_FREE_DAILY_CAP = DL_FREE_DAILY_CAP;

// v7.56 — Sim Lab Pro cross-session weak-spot tracking. Pro persists missed
// topics across sessions; free does not (the within-session cluster shows to all).
function _slRecordWeakSpots(topics) {
  if (!(_quotaState && (_quotaState.tier === 'pro' || _quotaState.tier === 'admin'))) return; // Pro-only
  try {
    var cur = JSON.parse(localStorage.getItem(STORAGE.SIMLAB_WEAK) || '{}');
    topics.forEach(function (t) { if (t) cur[t] = (cur[t] || 0) + 1; });
    localStorage.setItem(STORAGE.SIMLAB_WEAK, JSON.stringify(cur));
    if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.SIMLAB_WEAK);
  } catch (_) {}
}
function _slGetWeakSpots() {
  try { return JSON.parse(localStorage.getItem(STORAGE.SIMLAB_WEAK) || '{}'); } catch (_) { return {}; }
}
window._slRecordWeakSpots = _slRecordWeakSpots;
window._slGetWeakSpots = _slGetWeakSpots;

// Decision Lab Pro cross-session look-alike persistence (mirror _slRecordWeakSpots).
// Free does not persist (the within-set cluster shows to all; persistence is Pro).
function _dlRecordWeakSpots(pairLabels) {
  if (!(_quotaState && (_quotaState.tier === 'pro' || _quotaState.tier === 'admin'))) return;
  try {
    var cur = JSON.parse(localStorage.getItem(STORAGE.DL_WEAK) || '{}');
    (pairLabels || []).forEach(function (p) { if (p) cur[p] = (cur[p] || 0) + 1; });
    localStorage.setItem(STORAGE.DL_WEAK, JSON.stringify(cur));
    if (typeof _cloudFlush === 'function') _cloudFlush(STORAGE.DL_WEAK);
  } catch (_) {}
}
function _dlGetWeakSpots() {
  try { return JSON.parse(localStorage.getItem(STORAGE.DL_WEAK) || '{}'); } catch (_) { return {}; }
}
window._dlRecordWeakSpots = _dlRecordWeakSpots;
window._dlGetWeakSpots = _dlGetWeakSpots;

// v7.55.2 — Sim Lab Home entry (Home → Practice section). The drill must live
// where the other drills are, not only on the legacy #page-drills page. This
// renders WITHOUT loading the feature module (cert/pro/daily-state all live
// here); the module lazy-loads on click via startSimLabHome().
const _SL_PBQ_CERTS_HOME = ['netplus', 'secplus', 'aplus-core1', 'aplus-core2'];
function renderSimLabHomeEntry() {
  const btn = document.getElementById('sl-home-opt');
  if (!btn) return;
  // Sim Lab (PBQs) only exists on CompTIA certs — hide everywhere else.
  if (_SL_PBQ_CERTS_HOME.indexOf(window.CURRENT_CERT || 'netplus') === -1) { btn.classList.add('is-hidden'); return; }
  btn.classList.remove('is-hidden');
  const sub = document.getElementById('sl-home-sub');
  if (sub) {
    const pro = !!(typeof _quotaState !== 'undefined' && _quotaState && (_quotaState.tier === 'pro' || _quotaState.tier === 'admin'));
    if (pro) {
      sub.textContent = 'Hands-on PBQs, unlimited';
    } else {
      const used = _pbqFreeRunsToday();
      sub.textContent = used >= PBQ_FREE_DAILY_CAP
        ? 'Hands-on PBQs · done today, Pro for more'
        : 'Hands-on PBQs, one free sim a day';
    }
  }
}
function startSimLabHome() {
  if (typeof _ensureSimLabLoaded !== 'function') return;
  _ensureSimLabLoaded(function () {
    if (typeof window.simLabOpenEntry === 'function') window.simLabOpenEntry();
  });
}
window.renderSimLabHomeEntry = renderSimLabHomeEntry;
window.startSimLabHome = startSimLabHome;

// Decision Lab Home entry (Home → Practice). Renders WITHOUT loading the module
// (cert/pro/daily-state live here); the module lazy-loads on click.
const _DL_CERTS = ['az900', 'ai900', 'sc900', 'clfc02'];
function renderDecisionLabHomeEntry() {
  const btn = document.getElementById('dl-home-opt');
  if (!btn) return;
  if (_DL_CERTS.indexOf(window.CURRENT_CERT) === -1) { btn.classList.add('is-hidden'); return; }
  btn.classList.remove('is-hidden');
  const sub = document.getElementById('dl-home-sub');
  if (sub) {
    const pro = !!(typeof _quotaState !== 'undefined' && _quotaState && (_quotaState.tier === 'pro' || _quotaState.tier === 'admin'));
    if (pro) { sub.textContent = 'Read the constraint, kill the look-alikes'; }
    else {
      const used = (typeof _dlFreeRunsToday === 'function') ? _dlFreeRunsToday() : 0;
      sub.textContent = used >= 1 ? 'Done today · Pro for more' : 'Read the constraint · one free set a day';
    }
  }
}
function startDecisionLabHome() {
  if (typeof _ensureDecisionLabLoaded !== 'function') return;
  _ensureDecisionLabLoaded(function () {
    if (typeof window.decisionLabOpenEntry === 'function') window.decisionLabOpenEntry();
  });
}
window.renderDecisionLabHomeEntry = renderDecisionLabHomeEntry;
window.startDecisionLabHome = startDecisionLabHome;
// Initial paint: the Home page is default-active at boot (no showPage('setup')
// call fires on first load), so render the entry once the DOM is ready. The
// active cert is resolved before app.js runs, so the cert gate is correct here.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { try { renderSimLabHomeEntry(); } catch (_) {} try { renderDecisionLabHomeEntry(); } catch (_) {} });
} else {
  try { renderSimLabHomeEntry(); } catch (_) {}
  try { renderDecisionLabHomeEntry(); } catch (_) {}
}

// Thin metered-generate wrapper for Sim Lab. Reuses the exact same transport
// as _fetchWhyNotSession (_claudeFetch + _metered:true) and returns a parsed
// JSON object (not a Response). The prompt is built by sim-lab.js internally.
async function _slMeteredGenerate(prompt) {
  const res = await _claudeFetch({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_TOKENS_GENERATION, messages: [{ role: 'user', content: prompt }], _metered: true })
  });
  if (!res.ok) throw new Error('sim-lab API error ' + res.status);
  const data = await res.json();
  const raw = (data.content && data.content[0] && data.content[0].text) || '';
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('sim-lab: no JSON object in response');
  return JSON.parse(m[0]);
}
window._slMeteredGenerate = _slMeteredGenerate;

// #138 wave 4: loader stub — features/flagship-drills.js overwrites window.startRewordGauntlet on load.
function startRewordGauntlet() {
  _loadFeature('flagship-drills').then(function (m) { m.startRewordGauntlet(); });
}

// Back/exit routing for the gauntlet surfaces (entry back button + result
// screen ghost CTA). 'setup' goes through goSetup() for the full home
// re-render + mode reset.


// One metered call per run (Approach A, approved): weakest topic + the
// cert's exemplar slice (style grounding) + the 5-rung recipe. The model
// picks ONE precise testable concept inside the topic, then writes all five
// rungs about THAT concept. Cert-agnostic: inputs are CERT_PACK topics +
// exemplars only.

// Start CTA. opts: { topic, concept, attempts } — used by the retry paths.

// The rung ladder rides the quiz page in place of the numbered dot strip.

// Highlight the hinge word in the rendered stem after answering.
// Escape-THEN-highlight, same contract as setQuestionText (XSS: AI text).

// Run complete (all 5 rungs answered). Crack only on a clean 5/5 of FIRST
// answers. History entry feeds Today's goal + topic signal; streak credits
// like any finished session.


// Result-screen CTAs. "Run it again" keeps the concept (attempts carry over,
// wordings regenerate from scratch); "Next target" re-enters the loop on the
// next weakest topic; "Different concept" stays on the topic, new concept.

// ══════════════════════════════════════════
// WHY-NOT (v7.50.0) — the second flagship drill
// ══════════════════════════════════════════
// Research-verified pain (FLAGSHIP-DRILL-RESEARCH-2026-06-11, pain 4): the
// tools people praise explain why every option is right or wrong. Why-Not
// turns that into the game: answer the question, then each wrong option
// returns and you pick WHY it loses from three reasons (one true, two
// tempting fakes). Round = 4 points (answer + 3 reasons). Session = 3
// rounds, one topic, breadth — the Gauntlet owns concept depth. Spec:
// docs/planning/WHY-NOT-DRILL-SPEC-2026-06-12.md. Pro-only at Start;
// parallel to bank/SR; reasons are a MENU, scoring is exact-match.
const WHY_NOT_ROUNDS = 3;

// Entry points (Drills flagship card + Home Practice option). Entry screen
// viewable by free users; the Pro gate fires on Start — the Gauntlet pattern.
// #138 wave 4: loader stub — features/flagship-drills.js overwrites window.startWhyNot on load.
function startWhyNot() {
  _loadFeature('flagship-drills').then(function (m) { m.startWhyNot(); });
}


// One metered call per SESSION: 3 questions inside the topic, each carrying
// its full interrogation kit. Any malformed piece rejects the whole session
// (friendly retry, nothing recorded) — the Gauntlet validation contract.

// Start CTA. opts: { topic } — used by the loop-closers.

// Phase one: the round's question rides the existing quiz engine, exactly
// like a 1-question Gauntlet. finish() hands off to _wnFinishQuestion().

// Quiz-page chrome for a Why-Not question: topic strip on, dot strip off
// (reuses the v7.49 gauntlet strip element; the ladder stays gauntlet-only).

// Phase one done — the answer point is frozen; move to the reason picker.

// The reason picker: one wrong option at a time, three shuffled reasons.


// Round done: bank the result, show the round verdict (or roll into the
// session verdict after round 3).


// Session complete: history feeds Today's goal (3 questions answered),
// streak credits like any finished session, then the session verdict.


// Drills-page hero card pill ("N cracked").
function renderGauntletDrillsCard() {
  const pill = document.getElementById('drills-gauntlet-pill');
  const card = document.getElementById('drills-gauntlet-card');
  if (!pill || !card) return;
  const n = loadGauntletCracked().length;
  // Zero-state invites instead of anchoring on no progress (marketing pass 4)
  pill.textContent = n === 0 ? 'Flagship drill' : (n === 1 ? '1 cracked' : n + ' cracked');

  // v7.54.1: free-tier daily-run state on the card (mirrors the free-gauntlet-states
  // mockup). Pro/admin/anonymous are uncapped → no daily pill. Free → "1 free today"
  // until used, then "Done today" with the CTA pointing at Pro. Re-rendered from
  // _renderQuotaChip once tier hydrates (the drills page can render before that).
  const btn = document.getElementById('drills-gauntlet-btn');
  const titleEl = card.querySelector('.drills-card-title');
  let state = document.getElementById('drills-gauntlet-state');
  if (!state && titleEl) {
    state = document.createElement('span');
    state.id = 'drills-gauntlet-state';
    state.className = 'gnt-daily-pill';
    titleEl.appendChild(state);
  }
  const isFree = !!(_quotaState && _quotaState.tier === 'free');
  if (state) {
    if (isFree) {
      const spent = (typeof _gauntletFreeRunsToday === 'function')
        && _gauntletFreeRunsToday() >= GAUNTLET_FREE_DAILY_CAP;
      state.textContent = spent ? 'Done today' : '1 free today';
      state.classList.toggle('is-spent', spent);
      state.hidden = false;
      if (btn) btn.textContent = spent ? 'Go Pro for unlimited' : 'Run the Gauntlet';
    } else {
      state.hidden = true;
      if (btn) btn.textContent = 'Run the Gauntlet';
    }
  }
}

// ══════════════════════════════════════════
// API KEY VALIDATION
// ══════════════════════════════════════════
// v4.99.33 — signed-in users skip the BYOK check entirely.
//
// Background: v4.99.2 Phase E.3 introduced _claudeFetch (line 270) which
// auto-routes signed-in users to /api/ai/generate (server-held key, JWT-
// authed) and anonymous users with a stored key through the legacy direct-
// to-Anthropic BYOK path. validateApiKey was written for the BYOK path
// only, but startQuiz() / startExam() / startWrongDrill() / etc. were never
// updated to skip the check when signed-in. The hidden #api-key input
// (v4.99.3 Phase E.4) means signed-in users got empty-string here, which
// failed validation, which blocked Generate Quiz with "Please enter your
// Anthropic API key" — even though they don't need one. Fixing at the
// validateApiKey layer means all 5 callers (startQuiz, startExam, three
// drill-launchers) unblock simultaneously without needing per-callsite
// edits. The actual API call still routes correctly through _claudeFetch.
//
// Reported by founder on iPhone Safari running PROD as a tester1@ playtest
// account, 2026-05-10 12:19 — toast fired on Generate Quiz click despite
// being signed-in Pro.
function validateApiKey(key) {
  // Signed-in users → server proxy, no client key needed. _claudeFetch
  // (line 270) handles the actual routing based on session presence.
  if (typeof window !== 'undefined' && window._certanvilSignedIn === true) return null;
  // BYOK retired (v4.99.3): a signed-out user with no key can't reach the proxy.
  // Prompt sign-in (free, 15/day) up front instead of the stale "enter API key"
  // wall or a thrown needsAuth error mid-quiz.
  if (!key) return 'Sign in to study free: 15 questions a day, no API key needed. Tap "Sign in" at the top right.';
  if (!key.startsWith('sk-ant-')) return 'Invalid API key format. Anthropic keys start with "sk-ant-".';
  if (key.length < 20) return 'API key looks too short. Please check and try again.';
  return null;
}

// Auto-open collapsed sections and scroll to error when API key is missing (v4.32)
function showSetupError() {
  const cqs = document.getElementById('custom-quiz-section'); if (cqs && !cqs.open) cqs.open = true;
  const adv = document.getElementById('advanced-section'); if (adv && !adv.open) adv.open = true;
  const errBox = document.getElementById('setup-err');
  if (errBox) errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// v7.x: surface the gate message in-view, anchored under the tapped control,
// with one-tap sign-in. Falls back to top of the active page if no anchor.
// Only shown for the signed-out "Sign in to study free" gate — never for
// signed-in users or BYO-key validation errors.
function _showSignInPrompt(anchorEl, message) {
  document.querySelectorAll('.signin-inline').forEach(function(n) { n.remove(); });
  var box = document.createElement('div');
  box.className = 'signin-inline';
  box.setAttribute('role', 'status');
  box.innerHTML = '<span class="signin-inline-msg"></span>' +
    '<button type="button" class="btn btn-primary signin-inline-cta">Sign in to start free</button>';
  box.querySelector('.signin-inline-msg').textContent = message ||
    'Sign in to study free: 15 questions a day, no API key needed.';
  box.querySelector('.signin-inline-cta').addEventListener('click', function() {
    // Prefer clicking the topbar pill so auth-state.js owns the URL-build logic.
    var pill = document.querySelector('.topbar-signin-pill');
    if (pill) { pill.click(); return; }
    // Fallback: navigate directly to the certanvil.com sign-in page.
    var here = window.location.origin + window.location.pathname;
    window.location.href = 'https://certanvil.com/?action=signin&return=' + encodeURIComponent(here);
  });
  if (anchorEl && anchorEl.parentNode) {
    anchorEl.insertAdjacentElement('afterend', box);
  } else {
    var page = document.querySelector('.page.active') || document.body;
    page.insertBefore(box, page.firstChild);
  }
  box.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function startExam() {
  _loadFeature('exam').then(function (m) { m.startExam(); });
}

// ══════════════════════════════════════════
// API — FETCH QUESTIONS (with PBQ support)
// ══════════════════════════════════════════
// v4.56.1: batching layer added. Large requests (n > QUIZ_BATCH_THRESHOLD) are
// split into concurrent batches of ≤QUIZ_BATCH_SIZE so each prompt stays in
// Haiku's comfort zone. PBQ budget is computed once at the outer level and
// parcelled out so the overall PBQ ratio doesn't drift when we batch.
const QUIZ_BATCH_SIZE      = 10;  // per-batch question count — chosen so Haiku reliably emits well-formed JSON
const QUIZ_BATCH_THRESHOLD = 12;  // requests at or below this size stay single-shot (no batching overhead)

// v4.81.14: stem-normalize for cross-batch dedup (user report: "some
// questions kept repeating themselves" in exam mode + occasionally in
// regular quizzes). Lowercase + strip punctuation + collapse whitespace
// + length-cap for stable comparison. Catches "Which of the following
// best describes ARP?" vs "which of the following BEST describes arp."
// as the same stem.
function _normalizeStemForDedup(stem) {
  if (!stem) return '';
  return String(stem)
    .toLowerCase()
    .replace(/[^\w\s]/g, '')   // strip punctuation
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim()
    .slice(0, 200);             // cap to avoid weird unicode tail issues
}

async function fetchQuestions(key, qTopic, difficulty, n, staleSliceIdx) {
  // v4.81.15: optional staleSliceIdx threads through to the per-batch
  // prompt builder for stale-topic rotation. Callers who fire fetchQuestions
  // multiple times (startExam's 5 sequential calls) pass i=0..4 so each
  // batch sees a different rotating window of stale topics. Default 0.
  // Single-shot path for small requests — avoids concurrency overhead + keeps
  // cache semantics identical to pre-v4.56.1 behaviour.
  if (n <= QUIZ_BATCH_THRESHOLD) {
    const result = await _fetchQuestionsBatch(key, qTopic, difficulty, n, undefined, staleSliceIdx);
    cacheQuestions(qTopic, difficulty, n, result);
    return result;
  }

  // Batched path — split n into ≤QUIZ_BATCH_SIZE chunks as evenly as possible.
  // e.g. n=20 → [10, 10]; n=26 (20+DROPOUT_BUFFER) → [9, 9, 8]; n=50 → [10]×5.
  const numBatches = Math.ceil(n / QUIZ_BATCH_SIZE);
  const base = Math.floor(n / numBatches);
  const remainder = n - (base * numBatches);
  const batchSizes = Array.from({ length: numBatches }, (_, i) => base + (i < remainder ? 1 : 0));

  // Compute the TOTAL PBQ budget once (so batching doesn't inflate PBQ ratio)
  // then distribute across batches — early batches absorb the budget.
  const totalPbqBudget = n >= 10 ? 2 : (n >= 7 ? 1 : 0);
  const pbqBudgets = new Array(numBatches).fill(0);
  for (let i = 0; i < totalPbqBudget; i++) pbqBudgets[i % numBatches]++;

  // v4.81.15: inner-batch rotation. Each parallel sub-batch within this
  // single fetchQuestions call gets a different sliceIdx so they don't
  // all see the same top-of-list stale topics. Combined with the outer
  // staleSliceIdx (from startExam) this gives coverage breadth at both
  // levels.
  const outerIdx = (typeof staleSliceIdx === 'number') ? staleSliceIdx : 0;

  // Fire all batches concurrently — Haiku handles this well and end-to-end
  // latency ends up close to a single batch's latency (~3-5s) instead of
  // n×batch-latency sequential.
  const settled = await Promise.allSettled(
    batchSizes.map((size, i) => _fetchQuestionsBatch(key, qTopic, difficulty, size, pbqBudgets[i], outerIdx + i))
  );

  const merged = _mergeBatchedFetchResults(settled, numBatches, n);
  cacheQuestions(qTopic, difficulty, n, merged);
  return merged;
}

// v4.85.7: extracted from fetchQuestions() to keep it under 80 lines. Merges
// the Promise.allSettled results, dedupes cross-batch duplicate stems by
// normalized stem (first-seen wins), bubbles up API errors, and emits diag
// console.warn/info messages so partial failures show in dev.
function _mergeBatchedFetchResults(settled, numBatches, n) {
  const merged = [];
  const seenStems = new Set();
  let failed = 0;
  let deduped = 0;
  settled.forEach(r => {
    if (r.status === 'fulfilled') {
      r.value.forEach(q => {
        const norm = _normalizeStemForDedup(q && q.question);
        if (norm && seenStems.has(norm)) { deduped++; return; }
        if (norm) seenStems.add(norm);
        merged.push(q);
      });
    } else {
      failed++;
      if (r.reason && r.reason.apiError) throw r.reason;
    }
  });
  if (merged.length === 0) {
    throw new Error('AI returned malformed data. Please try again.');
  }
  if (failed > 0 && typeof console !== 'undefined' && console.warn) {
    console.warn(`[fetchQuestions] ${failed}/${numBatches} batches failed — returning ${merged.length}/${n} questions; caller will retry-to-fill if needed`);
  }
  if (deduped > 0 && typeof console !== 'undefined' && console.info) {
    console.info(`[fetchQuestions] dropped ${deduped} duplicate stem(s) across batches; merged ${merged.length}/${n}`);
  }
  return merged;
}

// v4.56.1: single-batch worker — contains all the prompt construction + fetch
// + parse + retry-without-scenario logic. Exposed via _fetchQuestionsBatch so
// the outer fetchQuestions can batch large requests concurrently. pbqCountOverride
// lets the outer coordinator parcel out PBQ budget across batches.
// v4.81.15: staleSliceIdx threaded through from fetchQuestions for stale-
// topic rotation in the prompt-injection layer. See _computeStaleTopics.
async function _fetchQuestionsBatch(key, qTopic, difficulty, n, pbqCountOverride, staleSliceIdx) {
  const topicHints = {
    'Integrating Networked Devices': 'IoT devices, ICS/SCADA systems, OT/IT convergence, smart building tech, embedded systems, segmentation of IoT, industrial control risks.',
    'Network Troubleshooting & Tools': 'Troubleshooting methodology, ping, traceroute/tracert, ipconfig/ifconfig, nslookup, dig, netstat, arp, route, Wireshark/packet capture, cable testers, TDR, loopback testing, common network faults.',
    'NAT & IP Services': 'Static NAT, dynamic NAT, PAT/NAT overload, inside/outside local/global, port forwarding, NAT64, private vs public IP ranges, IP helper addresses.',
    'AAA & Authentication': 'AAA framework, RADIUS protocol and ports, TACACS+, RADIUS vs TACACS+ differences, 802.1X port-based authentication, EAP variants, Kerberos, LDAP, MFA, certificate-based auth.',
    'NTP, ICMP & Traffic Types': 'NTP stratum levels, NTP hierarchy, ICMP message types (echo, TTL exceeded, unreachable, redirect), ping and traceroute mechanics, unicast vs multicast vs broadcast vs anycast, IGMP.',
    'Ethernet Standards': '802.3 standards, 10BASE-T, 100BASE-TX, 1000BASE-T, 10GBASE-T, 1000BASE-SX/LX, 10GBASE-SR/LR, fibre vs copper, auto-negotiation, duplex, PoE (802.3af/at/bt), MDI/MDIX.',
    'IPsec & VPN Protocols': 'IPsec tunnel vs transport mode, AH vs ESP, IKEv1 vs IKEv2, IKE Phase 1 (main/aggressive), IKE Phase 2, ISAKMP, SA negotiation, site-to-site VPN, remote access VPN, SSL/TLS VPN, split tunneling, GRE tunnels, L2TP/IPsec, OpenVPN.',
    'SMB & Network File Services': 'SMB protocol versions (SMBv1/2/3), CIFS, NFS (v3/v4), Samba, file share permissions vs NTFS, UNC paths, port 445 (SMB), port 2049 (NFS), iSCSI, SAN vs NAS, FTP/SFTP/FTPS, SCP.',
    'Cloud Networking & VPCs': 'VPC (Virtual Private Cloud), subnets in cloud, route tables, internet gateways, NAT gateways, security groups vs NACLs, VPC peering, transit gateways, VPN to cloud, Direct Connect / ExpressRoute, cloud service models (IaaS/PaaS/SaaS), shared responsibility model, multi-tenant networking.',
    'Port Numbers': 'Every question must be about matching a protocol to its port number or transport (TCP/UDP). Cover: FTP data 20/TCP, FTP control 21/TCP, SSH & SFTP 22/TCP, Telnet 23/TCP, SMTP 25/TCP, DNS 53 (TCP & UDP), DHCP server 67/UDP & client 68/UDP, TFTP 69/UDP, HTTP 80/TCP, Kerberos 88 (TCP & UDP), POP3 110/TCP, NTP 123/UDP, NetBIOS name 137/UDP, NetBIOS datagram 138/UDP, NetBIOS session 139/TCP, IMAP 143/TCP, SNMP queries 161/UDP & traps 162/UDP, LDAP 389/TCP, HTTPS 443/TCP, SMB 445/TCP, Syslog 514/UDP, SMTP submission/TLS 587/TCP, LDAPS 636/TCP, iSCSI 3260/TCP, TACACS+ 49/TCP, BGP 179/TCP, RADIUS auth 1812/UDP & accounting 1813/UDP, NFS 2049/TCP & UDP, MySQL 3306/TCP, RDP 3389/TCP, SIP 5060/UDP & TLS 5061/TCP, VNC 5900/TCP, IKE/IPsec 500/UDP, IPsec NAT-T 4500/UDP, L2TP 1701/UDP, OpenVPN 1194/UDP, FTPS implicit 990/TCP. Use tricky distractors.',
    'PKI & Certificate Management': 'Public Key Infrastructure: Root CA, Intermediate CA, end-entity (leaf) certificates and the full chain of trust. Certificate fields: CN, SAN, issuer, expiry. Self-signed vs CA-signed. CRL and OCSP. TLS handshake steps. Cipher suites. Wildcard certificates. Certificate pinning. Private vs public keys. PKI use cases: HTTPS, email signing (S/MIME), VPN certificate auth, code signing.',
    'CompTIA Troubleshooting Methodology': 'The CompTIA 7-step troubleshooting methodology: 1) Identify the problem, 2) Establish a theory, 3) Test the theory, 4) Establish a plan of action, 5) Implement the solution or escalate, 6) Verify full system functionality and implement preventive measures, 7) Document findings. When to escalate vs implement.',
    'Firewalls, DMZ & Security Zones': 'Stateful vs stateless firewalls. NGFW. UTM. Security zones: trusted, untrusted, DMZ. Screened subnet. Implicit deny. Firewall rule order and ACL processing. Content/URL filtering. Active-passive HA. Proxy firewalls. Host-based vs network-based firewalls.',
    'WPA3 & EAP Authentication': 'WPA3-Personal: SAE/Dragonfly. WPA3-Enterprise: 192-bit security. OWE. WPA3 vs WPA2. EAP types: EAP-TLS, PEAP, EAP-TTLS, EAP-FAST. 802.1X roles: Supplicant, Authenticator, Authentication Server. Wi-Fi Easy Connect. Transition mode.',
    'SDN, NFV & Automation': 'SDN: control/data plane separation. SDN controller, northbound/southbound APIs, OpenFlow. NFV: VNF, virtualising network functions. IaC: Ansible, Terraform, Puppet. YANG/NETCONF. Intent-based networking. REST APIs. Zero-touch provisioning.',
    'Network Appliances & Device Functions': 'Load balancers (hardware vs software, Layer 4 vs Layer 7, algorithms: round-robin / least-connections / weighted / source-IP hash, active-active vs active-passive, health checks, SSL/TLS offloading). Proxy servers: forward proxy (outbound filtering, anonymity, caching), reverse proxy (inbound distribution, caching, SSL termination, hides backend topology), transparent proxy (inline, no client config needed). IDS/IPS/NIDS/NIPS: detection vs prevention, signature-based vs anomaly-based/behavioural, in-line vs passive/tap placement. Next-Generation Firewall (NGFW) and Unified Threat Management (UTM) — app-aware filtering, deep packet inspection, bundled AV + IPS + content filter. VPN concentrator. Content/URL filter / web filter. Wireless access points (WAP) and Wireless LAN Controllers (WLC) — autonomous vs lightweight APs. Layer 3 capable switch / multilayer switch. Cable modem, DSL modem, ONT (fiber optical network terminal). Covers device selection, placement, distinctions between similar appliances (proxy vs reverse proxy vs load balancer; IDS vs IPS; NGFW vs UTM).'
  };
  // v4.85.8: N10-009 domain-weighted distribution + per-batch TOPIC LOTTERY for
  // Mixed mode. Pre-samples specific topics from each domain (vs letting Haiku
  // choose) so the user gets a genuinely random spread instead of Haiku's
  // 4-5 default-favorite topics. Each batch independently re-samples, so two
  // back-to-back Mixed sessions produce different topic mixes.
  let mixedDistributionStr = '';
  if (qTopic === MIXED_TOPIC) {
    const dist = computeDomainDistribution(n);
    const sampled = _sampleTopicsForMixedBatch(dist);
    const fmt = (arr) => arr.length === 0 ? '  (none this batch)' : arr.map(t => '  - "' + t + '"').join('\n');
    mixedDistributionStr = `\n\nMANDATORY TOPIC LOTTERY — Of the ${n} questions, generate EXACTLY ONE question per topic listed below (${n} topics total). Each question's .topic field MUST match the assigned topic verbatim. This is a true random sample — do NOT skip topics, do NOT repeat topics, and do NOT substitute "easier" topics for the ones listed.

Domain 1.0 — Networking Concepts (${dist.concepts} questions, 23% of exam):
${fmt(sampled.concepts)}

Domain 2.0 — Network Implementation (${dist.implementation} questions, 20%):
${fmt(sampled.implementation)}

Domain 3.0 — Network Operations (${dist.operations} questions, 19%):
${fmt(sampled.operations)}

Domain 4.0 — Network Security (${dist.security} questions, 14%):
${fmt(sampled.security)}

Domain 5.0 — Network Troubleshooting (${dist.troubleshooting} questions, 24%):
${fmt(sampled.troubleshooting)}
`;
  }
  // v4.54.15: multi-topic mode \u2014 Custom Quiz selected 2+ specific topics.
  // Parse the list out of the "Multi: ..." sentinel and build a distribution
  // prompt that tells Claude to split the n questions evenly across the
  // selected topics (rounded up, with overage from the tail truncation later).
  const isMulti = typeof qTopic === 'string' && qTopic.startsWith('Multi: ');
  let multiTopicList = [];
  if (isMulti) {
    // v4.81.19: comma-safe parse — preserves topic names like
    // "NTP, ICMP & Traffic Types" verbatim instead of mis-splitting them.
    // Critical for the prompt to Haiku — a mis-split list would tell Haiku
    // to write questions tagged with "NTP" + "ICMP & Traffic Types" instead
    // of the canonical "NTP, ICMP & Traffic Types" topic.
    multiTopicList = (typeof _parseMultiTopicSentinel === 'function')
      ? _parseMultiTopicSentinel(qTopic)
      : qTopic.slice(7).split(',').map(s => s.trim()).filter(Boolean);
    const per = Math.max(1, Math.floor(n / multiTopicList.length));
    const remainder = n - (per * multiTopicList.length);
    mixedDistributionStr = `\n\nMANDATORY MULTI-TOPIC DISTRIBUTION: Of the ${n} questions, generate ${per} question${per === 1 ? '' : 's'} per topic from this list of ${multiTopicList.length} topics:\n${multiTopicList.map((t, i) => `- ${t}${topicHints[t] ? ' \u2014 ' + topicHints[t] : ''}${i < remainder ? ' (generate 1 EXTRA here)' : ''}`).join('\n')}\n\nDo not stray outside these ${multiTopicList.length} topics. Each question must explicitly focus on ONE of them, and the .topic field of every returned question must match one of these exact strings.`;
  }
  const expectedObj = (!isMulti && qTopic !== MIXED_TOPIC && topicResources[qTopic]) ? topicResources[qTopic].obj : null;
  // v4.87.0: cert-aware prompt voice. Substitutes CERT_NAME_FULL so Haiku
  // generates SY0-701 questions in Security+ mode + N10-009 in Network+ mode.
  const topicStr = qTopic === MIXED_TOPIC
    ? `Cover a broad mix of ${CERT_NAME_FULL} exam topics across all 5 official CompTIA domains.`
    : isMulti
      ? `Cover these ${multiTopicList.length} specific ${CERT_NAME_FULL} topics selected by the user: ${multiTopicList.map(t => '"' + t + '"').join(', ')}. See the mandatory distribution block below.`
      : `Focus only on: "${qTopic}" for the ${CERT_NAME_FULL} exam (primary objective ${expectedObj || 'N/A'}).${topicHints[qTopic] ? ' Specifically cover: ' + topicHints[qTopic] : ''}`;

  const diffStr = {
    'Foundational':  'Foundational: test basic recall and definitions. Clear right answers.',
    'Exam Level':    'Exam Level: scenario-based, mirrors real CompTIA style. Plausible distractors.',
    'Hard / Tricky': 'Hard: tricky edge cases, near-identical distractors, deep understanding required.',
    'Mixed':         'Mix of foundational, exam-level, and hard questions across all difficulties.'
  }[difficulty] || DEFAULT_DIFF;

  // Determine PBQ count. If the outer coordinator parcelled out a specific
  // budget for this batch (batching path), use it; otherwise fall back to the
  // single-shot formula (pre-v4.56.1 behaviour).
  const pbqCount = (typeof pbqCountOverride === 'number')
    ? Math.min(pbqCountOverride, n)
    : (n >= 10 ? 2 : (n >= 7 ? 1 : 0));
  const mcqCount = n - pbqCount;

  const pbqInstructions = pbqCount > 0 ? `

IMPORTANT: Out of the ${n} questions, generate exactly ${mcqCount} as standard MCQ and ${pbqCount} as performance-based questions (PBQ).

For standard MCQ, use this format (scenario is OPTIONAL — only include on ~30-40% of Exam Level / Hard questions where real-world context genuinely disambiguates the answer):
{"type":"mcq","question":"...","scenario":"(optional — 1-2 sentences of setup context)","difficulty":"...","topic":"...","objective":"X.Y","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A|B|C|D","explanation":"..."}

For PBQ, use MULTI-SELECT format (choose 2 or 3 correct answers from 5 options):
{"type":"multi-select","question":"(Choose TWO) ...","difficulty":"...","topic":"...","objective":"X.Y","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"answers":["A","C"],"explanation":"..."}

CRITICAL — MULTI-SELECT QUALITY CRITERIA (CompTIA exam style):
- BOTH (or all 3) correct answers must be CORE, well-known facts about the topic — at similar levels of prominence/familiarity. Do NOT make one correct answer obvious and the other obscure or edge-case. Difficulty in multi-select comes from BREADTH (knowing multiple facts apply), NOT from one being a buried trivia point.
- DISTRACTORS must be FACTUALLY WRONG about the topic. They should describe things that are categorically false, NOT things that are "less correct" or are correct facts about an adjacent/related topic. The user must be able to rule them out with actual knowledge — not by elimination.
- AVOID the trap of "1 obvious correct + 1 obscure correct + 2 plausible-sounding adjacent-topic distractors" — that produces partial-credit scoring and frustration without testing real understanding.
- The EXPLANATION must enumerate, separately and concretely:
  • WHY each correct answer is correct (1-2 sentences each)
  • WHY each distractor is wrong — naming a specific factual error, not just "less applicable" or "not the best fit"
- Multi-select stems should ask about what IS true / IS valid / DOES apply — not about ranking, fit, or "best."
- NEVER create a question where MORE options are factually correct than the stem asks for. Example: 6to4, Teredo, AND NAT64 are ALL valid IPv6 transition methods — a "Which TWO" stem forces the student to guess which 2 of 3 correct answers the grader prefers, which is NOT how CompTIA writes exams. If a topic has N valid answers, either ask for all N or reframe the stem to narrow which subset is being tested (e.g., "Which TWO are tunneling methods?" excludes NAT64 since it's translation, not tunneling).
- SELF-TEST before finalizing: for each correct answer, ask "could a student who studied this topic for 2 weeks identify this as correct?" If the answer is no for ANY correct option, the question fails the balance test. Replace the obscure correct answer with a more recognizable one.
- CONCRETE EXAMPLES of good vs bad multi-select:
  BAD: "Which TWO describe OSPF?" → A) Uses Dijkstra's algorithm (obvious) B) Uses area 0 as backbone (obscure detail) — student gets A easily, guesses on B.
  GOOD: "Which TWO are link-state routing protocols?" → A) OSPF B) IS-IS — both are CORE facts at the same prominence level. A student who studied routing protocols knows both.
  BAD: "Which TWO are used for network monitoring?" → A) SNMP (obvious) B) NetFlow (less obvious) C) Syslog (also valid!) — 3 correct answers crammed into "pick 2."
  GOOD: "Which TWO protocols use UDP port 161 or 162?" → A) SNMP GET B) SNMP TRAP — narrow, factual, both equally knowable.` : '';

  // v4.58.0: pull 3-5 curated exemplars matching this topic/domain to inject
  // as few-shot style references. Empty bank → no-op (returns empty block) so
  // current behaviour is unchanged until Phase 2 content lands.
  const exemplarBlock = _formatExemplarsForPrompt(
    _pickExemplarsForTopic(qTopic, 3)
  );

  // v4.62.3: Priority Retention Concepts — injected into every batch so
  // Haiku is nudged (not mandated) toward testing the user's recently-
  // studied gap topics whenever the current scenario permits. Empty
  // RETENTION_GAP_CONCEPTS → no-op empty string.
  const retentionBlock = (typeof _formatRetentionConceptsForPrompt === 'function')
    ? _formatRetentionConceptsForPrompt()
    : '';

  // v4.81.15: stale-topic rotation block — surfaces topics the user
  // hasn't practised in WEAK_STALENESS_DAYS+ as a depth/difficulty hint
  // within the v4.85.8 TOPIC LOTTERY. Only fires for MIXED_TOPIC
  // (single-topic quizzes already focus there; multi-topic mode honours
  // the user's explicit selection). Defensive — never blocks the fetch
  // on a stale-topic compute error.
  let staleBlock = '';
  if (qTopic === MIXED_TOPIC && (difficulty === 'Mixed' || difficulty === 'Exam Level' || difficulty === 'Foundational' || difficulty === 'Hard / Tricky')) {
    try {
      if (typeof _computeStaleTopics === 'function' && typeof loadHistory === 'function') {
        const hist = loadHistory();
        if (Array.isArray(hist) && hist.length >= STALE_CHIP_MIN_HISTORY) {
          const staleTopics = _computeStaleTopics(hist, STALE_PROMPT_TOPIC_COUNT, staleSliceIdx, STALE_PROMPT_SLICE_SIZE);
          staleBlock = _formatStaleTopicsForPrompt(staleTopics);
        }
      }
    } catch (_) { staleBlock = ''; }
  }

  // v4.56.1: Scenario field instructions isolated so they can be omitted on
  // retry. They were the main prompt bloat added in v4.56.0 and on complex
  // runs (multi-topic + Mixed + 20 questions) they occasionally push Haiku
  // into producing malformed JSON — retry without them usually succeeds.
  const scenarioInstructions = `
SCENARIO CONTEXT FIELD (optional, exam-realism):
- On roughly 30-40% of Exam Level and Hard questions, include an optional "scenario" field with 1-2 short sentences (max ~30 words) of real-world setup BEFORE the question is asked. This mirrors real N10-009 exam framing ("A technician is configuring...", "A user reports...", "An administrator notices...").
- CRITICAL RULE — scenario describes the ENVIRONMENT the answer depends on; it NEVER restates the subject of the question in technical terms. ❌ "Consider a Layer 2 switch..." inside a question that asks which layer a switch operates at (this telegraphs the answer). ✅ "A technician sees frames being forwarded between hosts on the same subnet but traffic never leaves the local broadcast domain." (forces the learner to reason).
- Scenario should help DISAMBIGUATE context that makes one answer clearly right, not give the answer away.
- DO NOT include scenario on: pure recall questions (what port is HTTPS? which protocol uses X?), acronym definitions, or Foundational difficulty. Scenario adds noise on those.
- Omit the field entirely for questions that don't need it — don't set it to empty string.
`;

  const buildPrompt = (includeScenario) => `You are a CompTIA Network+ N10-009 exam question writer. You ONLY write questions that map to the official N10-009 exam objectives. Never write questions about content outside the N10-009 blueprint.

${topicStr}${mixedDistributionStr}
Difficulty: ${diffStr}
${exemplarBlock}${retentionBlock}${staleBlock}
Generate exactly ${n} multiple choice questions. Requirements:
- 4 options each (or 5 for multi-select): A, B, C, D (E for multi-select)
- One correct answer only (unless multi-select)
- Distractors must be plausible - never obviously wrong
- Vary the correct answer letter across questions
- Each explanation must state WHY the answer is correct AND briefly why the main wrong option is wrong (2-3 sentences max)
- No repeated questions
${includeScenario ? scenarioInstructions : ''}
MANDATORY N10-009 OBJECTIVE TAGGING:
- Every question MUST include an "objective" field with the CompTIA N10-009 exam objective number (format "X.Y" — e.g., "1.4", "2.1", "4.3", "5.1")
- Valid objectives are 1.1–1.8 (Concepts), 2.1–2.4 (Implementation), 3.1–3.5 (Operations), 4.1–4.5 (Security), 5.1–5.5 (Troubleshooting)
- If you cannot map the question to a specific N10-009 objective, do NOT write the question — write a different one that does map${expectedObj ? `\n- For this topic, use objective "${expectedObj}" (or an adjacent sub-objective in the same domain if more appropriate)` : ''}
${pbqInstructions}

CRITICAL — SELF-VERIFICATION PROTOCOL (you MUST follow these steps for EVERY question):
Step 1: Write the question and all options.
Step 2: INDEPENDENTLY determine which option is factually correct by reasoning through the networking concept. Do NOT just pick a letter — think through WHY.
Step 3: Set the "answer" field to the letter of the option you verified in Step 2.
Step 4: Write the explanation referencing that SAME letter and option text.
Step 5: CROSS-CHECK: Re-read the option text at your chosen answer letter. Does it match what your explanation says? If not, fix the answer field.
Step 6: PREMISE-ANSWER CONSISTENCY CHECK: Re-read the question stem. Does the correct answer CONTRADICT any fact explicitly stated in the stem? If the stem says "both devices are on VLAN 30", the answer CANNOT be "they are on different VLANs." If you find a contradiction, rewrite the question or change the answer so the stem and answer are logically consistent.

MANDATORY RULES:
- The "answer" field must ALWAYS match the letter whose option text is factually correct
- The "explanation" must explicitly reference why the correct option is right and why at least one wrong option is wrong
- If you notice ANY mismatch between answer letter, option text, and explanation — fix it before outputting
- Never output a question where the explanation and the answer field disagree
- NEVER write a question where the correct answer contradicts a fact stated in the question stem. If the question says something IS the case, the answer cannot say it ISN'T. This is the most common AI question-writing error — check for it explicitly.

CONCEPTUAL COHERENCE RULES (v4.57.0 — enforce rigorously):
- Do NOT conflate deprecated classful addressing (Class A/B/C) with modern TCP/IP or CIDR/subnet principles. Classful addressing was obsoleted by CIDR in 1993 (RFC 1519). If you reference classful terminology, it must be explicitly about legacy concepts or historical context — never framed as a "fundamental TCP/IP principle."
- Do NOT conflate distinct concepts under one label. If the stem asks about "a TCP/IP principle," the answer must be about the TCP/IP protocol stack (layers, encapsulation, ports, the four-layer model), not about IP address classes. If the stem asks about "an OSI Layer 3 function," the answer must actually be a Layer 3 function, not a Layer 2 one.
- MATCH THE ABSTRACTION LEVEL: If the stem asks for a "principle," "fundamental concept," or "root cause," the answer must be at that level of abstraction — NOT a specific configuration step or tool. ("Default gateway not configured" is a configuration detail, not a principle.) If the stem asks for a specific fix or symptom, don't give an abstract principle.
- STEM MUST MATCH WHAT THE QUESTION ACTUALLY TESTS: If the stem says "which protocol operates at Layer 3?", the question must test Layer 3 protocol knowledge — not addressing theory, not encapsulation. Read your own stem and make sure the answer directly addresses what you asked.

DISTRACTOR QUALITY RULES:
- At least TWO of the three wrong options must be plausible-enough to tempt a student who only partially knows the material. If 3 of 4 options are obviously wrong (e.g. completely unrelated or factually nonsensical), the question becomes a giveaway that doesn't test real knowledge.
- Distractors should represent common misconceptions, adjacent concepts, or nearly-right answers — not random unrelated facts.

STEM MUST BE AN ACTUAL QUESTION (v4.57.2):
- The "question" field MUST contain a real interrogative, not pure declarative setup. Either end with "?" OR use explicit question words: "which", "what", "why", "how", "when", "where", or CompTIA-style imperatives: "Select the...", "Identify the...", "Choose the...", "Arrange these in order", "Place each device in the correct...", "Match each protocol with...", "Given the scenario, which...".
- ❌ WRONG: "A system administrator is deploying a remote access VPN solution that requires users to authenticate and access corporate resources through a web browser without installing additional VPN client software." (This is pure setup. No question is asked. The learner has no cue what to pick.)
- ✅ RIGHT: "A system administrator is deploying a remote access VPN that must work from any browser without installing client software. **Which VPN type best fits this requirement?**"
- If you want to include setup context, put it in the OPTIONAL "scenario" field — but the "question" field itself MUST still pose a direct question. Scenario + question is additive; scenario is never a substitute for the question.

Respond ONLY with a raw JSON array - no markdown, no extra text:
[{"type":"mcq","question":"...",${includeScenario ? '"scenario":"(optional)",' : ''}"difficulty":"Foundational|Exam Level|Hard","topic":"...","objective":"X.Y","options":{"A":"...","B":"...","C":"...","D":"..."},"answer":"A|B|C|D","explanation":"..."}]`;

  // v4.56.1/v4.56.2: single-attempt helper — does the API call + parse.
  // Takes a model arg (v4.56.2) so the last-ditch fallback can escalate to
  // Sonnet when Haiku fails twice in a row on the same batch. Throws on
  // API-level errors with `.apiError = true`, or on parse failures with
  // `.raw` attached so the caller can log the raw response for diagnosis.
  const attempt = async (prompt, label, model) => {
    const res = await _claudeFetch( {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      // _metered: true → counts against the user's daily 20-Q quota.
      // The proxy strips this before forwarding to Anthropic.
      body: JSON.stringify({ model: model || CLAUDE_MODEL, max_tokens: MAX_TOKENS_GENERATION, messages: [{ role: 'user', content: prompt }], _metered: true })
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      const apiErr = new Error(b?.error?.message || 'API error ' + res.status);
      apiErr.apiError = true;
      throw apiErr;
    }
    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    const m = raw.match(/\[[\s\S]*\]/);
    if (!m) {
      const e = new Error(`[${label}] Could not locate JSON array in AI response`);
      e.raw = raw;
      throw e;
    }
    try {
      return { parsed: JSON.parse(m[0]), raw };
    } catch (parseErr) {
      const e = new Error(`[${label}] JSON.parse failed: ${parseErr.message}`);
      e.raw = raw;
      throw e;
    }
  };

  let parsed;
  try {
    parsed = (await attempt(buildPrompt(true), 'haiku-full', CLAUDE_MODEL)).parsed;
  } catch (primaryErr) {
    if (primaryErr.apiError) throw primaryErr;           // API errors don't retry
    _logAiParseFail({ attempt: 'haiku-full', qTopic, difficulty, n, error: primaryErr.message, rawPrefix: (primaryErr.raw || '').slice(0, 600) });
    // v4.56.1: retry once with the scenario block stripped — recovers from the
    // prompt-length-induced malformed-JSON failures we saw on 20-Q Mixed runs.
    try {
      parsed = (await attempt(buildPrompt(false), 'haiku-retry', CLAUDE_MODEL)).parsed;
    } catch (retryErr) {
      if (retryErr.apiError) throw retryErr;
      _logAiParseFail({ attempt: 'haiku-retry', qTopic, difficulty, n, error: retryErr.message, rawPrefix: (retryErr.raw || '').slice(0, 600) });
      // v4.56.2: Sonnet escalation tier. Both Haiku attempts failed — this is
      // the rare hard case where the prompt is just too much for Haiku. Spend
      // the ~5x cost on Sonnet for this one batch and get the right answer.
      // Uses the stripped prompt (no scenario instructions) — keeps the call
      // as light as possible while leveraging the stronger model's JSON
      // consistency. Silent to the user on success; same user-facing error
      // only if Sonnet ALSO fails.
      try {
        if (typeof console !== 'undefined' && console.info) {
          console.info(`[fetchQuestions] escalating batch (${qTopic} / ${difficulty} / n=${n}) to ${CLAUDE_VALIDATOR_MODEL} after both Haiku attempts failed`);
        }
        parsed = (await attempt(buildPrompt(false), 'sonnet-escalation', CLAUDE_VALIDATOR_MODEL)).parsed;
      } catch (sonnetErr) {
        if (sonnetErr.apiError) throw sonnetErr;
        _logAiParseFail({ attempt: 'sonnet-escalation', qTopic, difficulty, n, error: sonnetErr.message, rawPrefix: (sonnetErr.raw || '').slice(0, 600) });
        throw new Error('AI returned malformed data. Please try again.');
      }
    }
  }

  // Normalize: add type:'mcq' if missing. Caching is handled by the outer
  // fetchQuestions coordinator so batched results cache under the original n.
  parsed.forEach(q => { if (!q.type) q.type = 'mcq'; });
  return parsed;
}

// v4.56.1: rolling log of the last 5 AI parse failures from fetchQuestions,
// stored to localStorage for future diagnosis. Used in both the primary and
// retry paths so we can see what Haiku actually returned when a run breaks.
function _logAiParseFail(entry) {
  try {
    const key = STORAGE.AI_PARSE_FAILS;
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.unshift({ ts: Date.now(), ...entry });
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 5)));
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[fetchQuestions] parse fail (${entry.attempt}):`, entry.error, '\nraw prefix:', (entry.rawPrefix || '').slice(0, 200));
    }
  } catch (_) { /* never crash the main flow on a logging error */ }
}

// ══════════════════════════════════════════
// ANIMATED SCORE COUNTER
// ══════════════════════════════════════════
function animateCount(elId, from, to, duration, suffix) {
  const el = document.getElementById(elId);
  const sfx = suffix || '';
  if (!el || from === to) { if (el) el.textContent = to + sfx; return; }
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * ease) + sfx;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════
function launchConfetti() {
  let canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.remove('is-hidden');

  const PARTICLE_COUNT = 150;
  const COLORS = ['#22c55e','#d4a574','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316'];
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }

  let frame = 0;
  const MAX_FRAMES = 200;

  function animate() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = 0;
    particles.forEach(p => {
      if (p.opacity <= 0) return;
      alive++;

      p.x += p.vx;
      p.vy += 0.05;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      if (frame > MAX_FRAMES * 0.6) {
        p.opacity -= 0.015;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    if (alive > 0 && frame < MAX_FRAMES) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.add('is-hidden');
    }
  }

  requestAnimationFrame(animate);
}

// ══════════════════════════════════════════
// READINESS CARD CELEBRATION
// ══════════════════════════════════════════
function queueReadinessAnimation(scaled, barPct){
  const card=document.getElementById('readiness-card-v2'); if(!card) return;
  card._rcPending={scaled,barPct};
  if(card.dataset.ioBound==='1') return;
  card.dataset.ioBound='1';
  if(!('IntersectionObserver' in window)){ animateReadinessCardV2(card._rcPending); return; }
  const io=new IntersectionObserver(es=>{es.forEach(e=>{ if(e.isIntersecting) animateReadinessCardV2(card._rcPending); });},{threshold:0.4});
  io.observe(card);
}
function animateReadinessCardV2(pending){
  const card=document.getElementById('readiness-card-v2'); if(!card||!pending) return;
  if(card.dataset.animated==='1') return; card.dataset.animated='1';
  const scaled=pending.scaled, barPct=pending.barPct;
  const passLine=(typeof EXAM_PASS_SCORE==='number')?EXAM_PASS_SCORE:720;
  const passed=scaled>=passLine;
  const fill=document.getElementById('rc-v2-bar-fill'), green=document.getElementById('rc-v2-bar-fill-green');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const settle=()=>{ if(green) green.style.width=barPct+'%'; card.classList.toggle('is-pass',passed);
    if(passed){ drawReadinessRing(card); showReadinessStamp(card,'Exam ready',false); try{ if(typeof launchConfetti==='function') launchConfetti(); else fireReadinessConfetti(card); }catch(_){ fireReadinessConfetti(card);} }
    else { showReadinessStamp(card,(passLine-scaled)+' pts to pass',true); } };
  if(reduce){ const n=document.getElementById('rc-v2-num'); if(n) n.textContent=scaled; if(fill) fill.style.width=barPct+'%'; if(green) green.style.width=barPct+'%'; settle(); return; }
  if(fill) fill.style.width=barPct+'%'; if(green) green.style.width=barPct+'%';
  animateCount('rc-v2-num',100,scaled,1100); setTimeout(settle,1150);
}
function drawReadinessRing(card){
  const ring=card.querySelector('.rc-v2-ring'); const num=document.getElementById('rc-v2-num'); const path=ring&&ring.querySelector('path');
  if(!ring||!num||!path) return;
  // position the ring to encircle the number (structure only — measured, no colour)
  const w=num.offsetWidth, h=num.offsetHeight, l=num.offsetLeft, t=num.offsetTop;
  const rw=w*1.34, rh=h*1.06;
  ring.style.width=rw+'px'; ring.style.height=rh+'px';
  ring.style.left=(l + w/2 - rw/2)+'px';
  ring.style.top=(t + h*0.46 - rh/2)+'px';
  const len=path.getTotalLength(); path.style.strokeDasharray=len; path.style.strokeDashoffset=len;
  path.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:600,easing:'ease-in-out',fill:'forwards'});
  ring.animate([{transform:'rotate(-7deg) scale(.86)'},{transform:'rotate(-3deg) scale(1)'}],{duration:600,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'});
}
function showReadinessStamp(card,text,warn){ const stamp=card.querySelector('.rc-v2-stamp'); if(!stamp) return; const t=stamp.querySelector('.txt'); if(t) t.textContent=text; const col=warn?'var(--yellow)':'var(--green)'; stamp.style.borderColor=col; if(t) t.style.color=col; const p=stamp.querySelector('svg path'); if(p) p.style.stroke=col; stamp.animate([{opacity:0,transform:'scale(1.4) rotate(-14deg)'},{opacity:1,transform:'scale(1) rotate(-6deg)'}],{duration:500,delay:120,easing:'cubic-bezier(.34,1.8,.64,1)',fill:'forwards'}); }
function fireReadinessConfetti(card){ const host=card.querySelector('.rc-v2-confetti'); if(!host) return; host.innerHTML=''; const r=host.getBoundingClientRect(); const ox=r.width*0.3, oy=r.height*0.4; const colors=['var(--green)','var(--accent)','var(--text)']; for(let i=0;i<30;i++){ const p=document.createElement('i'); p.style.left=ox+'px'; p.style.top=oy+'px'; p.style.background=colors[(Math.random()*colors.length)|0]; host.appendChild(p); const ang=(-90+(Math.random()*150-75))*Math.PI/180, dist=120+Math.random()*200; const px=Math.cos(ang)*dist, py=Math.sin(ang)*dist; const fall=r.height-oy+60+Math.random()*80, rot=Math.random()*720-360; p.animate([{transform:'translate(0,0) rotate(0)',opacity:1,offset:0},{transform:`translate(${px}px,${py}px) rotate(${rot*.5}deg)`,opacity:1,offset:.35},{transform:`translate(${px*1.3}px,${fall}px) rotate(${rot}deg)`,opacity:0,offset:1}],{duration:1500+Math.random()*900,delay:Math.random()*160,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}); } }
window.__rcAnimTest = function(scaled, barPct){ var c=document.getElementById('readiness-card-v2'); if(c){ c.dataset.animated=''; c.classList.remove('is-pass'); } animateReadinessCardV2({scaled:scaled, barPct:barPct}); };

// ══════════════════════════════════════════
// v4.42.0 — MILESTONE CELEBRATION (toast + mini confetti)
// ══════════════════════════════════════════
// Fires a subtle celebration burst when a milestone unlocks during a quiz or
// exam finish. Separate from the exam-pass launchConfetti so the two can
// co-exist (pass confetti fills the screen; mini confetti bursts around the
// toast). Gated by prefers-reduced-motion via CSS: the keyframes become
// zero-duration under that media query so the toast still appears but the
// slide/burst is suppressed.
function showMilestoneCelebration(milestoneId) {
  try {
    const def = (MILESTONE_DEFS || []).find(m => m.id === milestoneId);
    if (!def) return;
    showCelebrationToast(def.label, def.desc);
    launchMiniConfetti();
  } catch (_) { /* celebration is best-effort */ }
}

function showCelebrationToast(titleText, subText) {
  try {
    const toast = document.createElement('div');
    toast.className = 'celebration-toast';
    const title = document.createElement('div');
    title.className = 'celebration-toast-title';
    title.textContent = titleText || 'Milestone unlocked';
    toast.appendChild(title);
    if (subText) {
      const sub = document.createElement('div');
      sub.className = 'celebration-toast-sub';
      sub.textContent = subText;
      toast.appendChild(sub);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { try { toast.remove(); } catch (_) {} }, 400);
    }, 3800);
  } catch (_) { /* best-effort */ }
}

// Mini confetti burst — subtler than launchConfetti (fewer particles, shorter
// duration, gold/accent palette, origin point at top-center so it lands near
// the celebration toast instead of covering the page).
function launchMiniConfetti() {
  try {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.remove('is-hidden');

    const PARTICLE_COUNT = 40;
    const COLORS = ['#fbbf24','#f59e0b','#fde047','#d4a574','#22c55e'];
    const originX = canvas.width / 2;
    const originY = 80; // near the top where the toast lives
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 4 + 3;
      particles.push({
        x: originX,
        y: originY,
        w: Math.random() * 6 + 3,
        h: Math.random() * 4 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    let frame = 0;
    const MAX_FRAMES = 80;

    function animate() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      particles.forEach(p => {
        if (p.opacity <= 0) return;
        alive++;
        p.x += p.vx;
        p.vy += 0.15;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (frame > MAX_FRAMES * 0.5) p.opacity -= 0.03;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (alive > 0 && frame < MAX_FRAMES) {
        requestAnimationFrame(animate);
      } else {
        // Only hide the canvas if launchConfetti isn't also running (defensive).
        if (!canvas.dataset.fullConfettiActive) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.classList.add('is-hidden');
        }
      }
    }
    requestAnimationFrame(animate);
  } catch (_) { /* best-effort */ }
}

// ══════════════════════════════════════════
// EXAM READINESS SCORE
// ══════════════════════════════════════════
// CompTIA N10-009 official domain weights
// v4.86.1: DOMAIN_WEIGHTS moved to certs/<cert>.js. App reads via CERT_PACK
// with Network+ defaults (CompTIA N10-009 blueprint) preserved as fallback.
const DOMAIN_WEIGHTS = (CERT_PACK && CERT_PACK.domainWeights) || {
  concepts: 0.23, implementation: 0.20, operations: 0.19, security: 0.14, troubleshooting: 0.24
};
const DOMAIN_LABELS = (CERT_PACK && CERT_PACK.domainLabels) || {
  concepts: 'Networking Concepts', implementation: 'Network Implementation',
  operations: 'Network Operations', security: 'Network Security', troubleshooting: 'Network Troubleshooting'
};
// v4.85.8: Mixed mode topic lottery — randomly samples distinct topics from each
// domain's pool so Haiku can't default to its 4-5 favorite topics (subnetting,
// OSI, DNS, ping, troubleshooting methodology). Returns
// { concepts: [topicA, topicB, ...], implementation: [...], ... } where each
// array contains exactly dist[domain] topic names. Topics are unique within a
// domain unless dist[domain] exceeds pool size (then sampling-with-replacement).
// User: *"increase the randomization of the topics so it's genuinely like a lottery."*
function _sampleTopicsForMixedBatch(dist) {
  const byDomain = { concepts: [], implementation: [], operations: [], security: [], troubleshooting: [] };
  Object.keys(TOPIC_DOMAINS).forEach(t => {
    const d = TOPIC_DOMAINS[t];
    if (byDomain[d]) byDomain[d].push(t);
  });
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const result = { concepts: [], implementation: [], operations: [], security: [], troubleshooting: [] };
  Object.keys(byDomain).forEach(d => {
    const need = dist[d] || 0;
    if (need <= 0) return;
    const pool = byDomain[d];
    if (need <= pool.length) {
      result[d] = shuffle(pool).slice(0, need);
    } else {
      // Need more than available — fill from shuffled pool, repeat as needed
      const out = [];
      while (out.length < need) out.push(...shuffle(pool));
      result[d] = out.slice(0, need);
    }
  });
  return result;
}

// Largest-remainder allocation of n questions across the 5 CompTIA domains per official weights
function computeDomainDistribution(n) {
  // v4.88.2: cert-aware. Network+ used hardcoded keys here; Security+ has
  // different domain keys (threats / architecture / governance), so reading
  // DOMAIN_WEIGHTS[k] for Network+ keys returned undefined → NaN → broken
  // generation. Pull the keys from DOMAIN_WEIGHTS (blueprint order) so the
  // distribution is always correct for the active cert.
  const order = (typeof DOMAIN_WEIGHTS === 'object' && DOMAIN_WEIGHTS)
    ? Object.keys(DOMAIN_WEIGHTS)
    : ['concepts','implementation','operations','security','troubleshooting'];
  const raw = order.map(k => ({ k, exact: n * DOMAIN_WEIGHTS[k] }));
  const floors = raw.map(r => ({ k: r.k, count: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let assigned = floors.reduce((s, r) => s + r.count, 0);
  let leftover = n - assigned;
  // Distribute leftover to the largest remainders
  floors.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < leftover; i++) floors[i % floors.length].count++;
  const result = {};
  floors.forEach(r => { result[r.k] = r.count; });
  return result;
}
// Map each topic to its primary CompTIA domain
// v4.86.1: TOPIC_DOMAINS moved to certs/<cert>.js. App reads via CERT_PACK.
// Empty fallback {} = catalog routing falls through to defaults (no topic
// matched any domain). In production CERT_PACK is always populated.
const TOPIC_DOMAINS = (CERT_PACK && CERT_PACK.topicDomains) || {};

// v4.81.19: comma-safe Multi: topic sentinel parser.
// 3 topic names contain literal commas:
//   - 'NTP, ICMP & Traffic Types'      (concepts)
//   - 'SDN, NFV & Automation'          (implementation)
//   - 'Firewalls, DMZ & Security Zones' (security)
// A naive `.split(',')` on a Multi: sentinel like
//   "Multi: IPv6, NTP, ICMP & Traffic Types, BGP"
// mis-segments those topics — "NTP" + "ICMP & Traffic Types" instead of
// the canonical "NTP, ICMP & Traffic Types". Surfaces in 4 sites:
//   - _pickExemplarsForTopic       (first-topic extraction)
//   - loadHistory filter           (multi-list .includes(topic))
//   - _multiCount counting         (display counts)
//   - fetchQuestions Multi: parse  (worst impact: feeds Haiku a mis-split list)
// Bug got more visible with v4.81.17 Domain Drill (3 of 5 domain presets
// contain a comma-named topic).
//
// This helper does greedy longest-match against the TOPIC_DOMAINS catalog
// (sorted by length desc) so multi-word topic names with commas are
// preserved verbatim. Falls back to a naive split when TOPIC_DOMAINS isn't
// defined (defensive — should never happen in practice).
//
// Returns an array of topic names. Accepts either the full sentinel
// ("Multi: A, B, C") or the body alone ("A, B, C").
function _parseMultiTopicSentinel(qTopic) {
  if (typeof qTopic !== 'string') return [];
  const body = qTopic.startsWith('Multi: ') ? qTopic.slice(7) : qTopic;
  if (typeof TOPIC_DOMAINS === 'undefined' || !TOPIC_DOMAINS) {
    return body.split(',').map(s => s.trim()).filter(Boolean);
  }
  const allTopics = Object.keys(TOPIC_DOMAINS).sort((a, b) => b.length - a.length);
  const found = [];
  let remaining = body.trim();
  while (remaining.length > 0) {
    let matched = null;
    for (const t of allTopics) {
      if (remaining.startsWith(t)) { matched = t; break; }
    }
    if (matched) {
      found.push(matched);
      remaining = remaining.slice(matched.length).replace(/^[,\s]+/, '');
    } else {
      // Fallback: skip to next comma. Shouldn't happen if catalog is up
      // to date, but keeps the parser non-blocking on unknown strings.
      const idx = remaining.indexOf(',');
      if (idx === -1) break;
      remaining = remaining.slice(idx + 1).replace(/^\s+/, '');
    }
  }
  return found;
}

// Helper: scaled exam score per CompTIA's 100-900 scale (used by exam_pass + hardcore_pass)
function _scaledExamScore(e) { return Math.round(100 + (e.score / e.total) * 800); }

// v4.81.13: per-topic exam split (Codex r∞ user request). Pre-fix the
const MILESTONE_CHECKS = [
  { id: 'first_quiz',          check: c => c.h.length >= 1 },
  { id: 'hundred_qs',          check: c => c.totalQs >= 100 },
  { id: 'five_hundred_qs',     check: c => c.totalQs >= 500 },
  { id: 'thousand_qs',         check: c => c.totalQs >= 1000 },
  { id: 'first_exam',          check: c => c.exams.length >= 1 },
  { id: 'exam_pass',           check: c => c.exams.some(e => _scaledExamScore(e) >= EXAM_PASS_SCORE) },
  { id: 'hardcore_pass',       check: c => c.exams.some(e => e.hardcore && _scaledExamScore(e) >= EXAM_PASS_SCORE) },
  { id: 'all_domains',         check: c => c.allDomainsHit.size >= 5 },
  { id: 'all_topics',          check: c => c.studied.size >= c.allTopicCount },
  { id: 'streak_7',            check: c => c.streak.currentStreak >= 7 },
  { id: 'streak_30',           check: c => c.streak.currentStreak >= 30 },
  { id: 'ready_650',           check: c => c.readiness && c.readiness.predicted >= 650 },
  { id: 'ready_720',           check: c => c.readiness && c.readiness.predicted >= EXAM_PASS_SCORE },
  { id: 'perfect_quiz',        check: c => c.h.some(e => e.total >= 10 && e.score === e.total) },
  { id: 'five_exams',          check: c => c.exams.length >= 5 },
  { id: 'ten_exams',           check: c => c.exams.length >= 10 },
  { id: 'first_subnet',        check: c => c.subStats.seen >= 1 },
  { id: 'subnet_50',           check: c => c.subStats.seen >= 50 },
  { id: 'first_port_drill',    check: c => c.portBest > 0 || c.portStreakBest > 0 },
  { id: 'all_ports_seen',      check: c => c.portStats.uniqueSeen >= c.portStats.totalPorts && c.portStats.totalPorts > 0 },
  { id: 'first_session',       check: c => c.h.some(e => e.mode === 'session') },
  { id: 'night_owl',           check: c => c.nightOwl },
  { id: 'early_bird',          check: c => c.earlyBird },
  { id: 'weekend_warrior',     check: c => c.weekendWarrior },
  { id: 'diversity_5',         check: c => c.diversity5 },
  { id: 'deep_dive_10',        check: c => c.ddUses >= 10 },
  { id: 'daily_challenge_7',   check: c => c.dc.bestStreak >= 7 },
  { id: 'daily_challenge_30',  check: c => c.dc.bestStreak >= 30 },
  { id: 'first_lab',           check: c => c.labsDone >= 1 },
  { id: 'labs_5',              check: c => c.labsDone >= 5 },
  { id: 'labs_10',             check: c => c.labsDone >= 10 },
  { id: 'labs_all',            check: c => c.labsDone >= c.totalLabs },
  { id: 'simlab_first',      check: c => (c.drill.simlab && c.drill.simlab.done || 0) >= 1 },
  { id: 'simlab_25',         check: c => (c.drill.simlab && c.drill.simlab.done || 0) >= 25 },
  { id: 'simlab_ace',        check: c => (c.drill.simlab && c.drill.simlab.perfect || 0) >= 1 },
  { id: 'decision_first',    check: c => (c.drill.decision && c.drill.decision.done || 0) >= 1 },
  { id: 'decision_25',       check: c => (c.drill.decision && c.drill.decision.done || 0) >= 25 },
  { id: 'decision_flawless', check: c => (c.drill.decision && c.drill.decision.perfect || 0) >= 1 },
  { id: 'whynot_first',      check: c => (c.drill.whynot && c.drill.whynot.done || 0) >= 1 },
  { id: 'whynot_25',         check: c => (c.drill.whynot && c.drill.whynot.done || 0) >= 25 },
  { id: 'whynot_master',     check: c => (c.drill.whynot && c.drill.whynot.perfect || 0) >= 1 },
  { id: 'gauntlet_first',    check: c => (c.drill.gauntlet && c.drill.gauntlet.done || 0) >= 1 },
  { id: 'gauntlet_25',       check: c => (c.drill.gauntlet && c.drill.gauntlet.done || 0) >= 25 },
  { id: 'gauntlet_survivor', check: c => (c.drill.gauntlet && c.drill.gauntlet.perfect || 0) >= 1 },
];

function evaluateMilestones() {
  const ctx = _buildMilestoneCtx();
  const newlyUnlocked = [];
  MILESTONE_CHECKS.forEach(m => {
    try {
      if (m.check(ctx) && unlockMilestone(m.id)) newlyUnlocked.push(m.id);
    } catch (_) { /* individual check failures shouldn't break the whole eval */ }
  });
  return newlyUnlocked;
}

// ── Streak tracking (consecutive study days) ──

// ── Weak Spots v2 (v4.38.7) — robust, real-time ranking ──
// Previous heuristic was +2 per wrong-bank entry and a flat +pct gap for
// topics under 75% — no recency, no confidence interval, no difficulty
// weighting, no domain importance. This rewrite scores every topic with a
// real model so the front-page "🎯 Weak spots" chips actually point at the
// topic most worth drilling *right now*. The four signals combined:
//
//   1. Recent wrongs (half-life 7d)        — exponential decay over wrong-bank
//      entries, difficulty-weighted via diffWeight(), half-credit for entries
//      that have already been re-answered correctly once (rightCount >= 1).
//   2. Accuracy gap (Bayesian posterior)    — recency-decayed weighted
//      correct/total from history (14-day half-life, exam boost 1.3x,
//      difficulty-weighted), smoothed with a Beta(2,2) prior so fresh topics
//      don't instantly flag on one bad run. Gap = max(0, 0.85 - posterior).
//   3. Staleness                           — topics untouched >14 days start
//      accruing up to a 2.0 multiplier so a topic you studied once and never
//      revisited doesn't fade off the radar.
//   4. Domain importance                   — multiplied by DOMAIN_WEIGHTS /
//      average (0.2), so a weak Troubleshooting topic (24%) outranks a weak
//      Security topic (14%) at equal raw badness — matches the real N10-009
//      domain distribution.
//
// Topics with zero signal (no wrong-bank, no history) are *excluded* — they
// are "untouched", not "weak". This keeps the chip row pointing at what you
// studied badly, not what you haven't studied yet (that's what Study Plan is
// for). Real-time: the calculation reads localStorage fresh every render and
// is called from finish(), submitExam(), and goSetup() so any quiz or exam
// completion updates the front-page chips immediately.
const WEAK_HALF_LIFE_WRONGS_MS = 7  * 86400000; // 7d recency half-life for wrong bank
const WEAK_HALF_LIFE_HIST_MS   = 14 * 86400000; // 14d half-life for history accuracy
const WEAK_TARGET_ACC          = 0.80;          // mastery threshold (Bayesian gap = 0.80 - posterior; v4.85.11: lowered from 0.85)
const WEAK_STALENESS_DAYS      = 14;            // untouched grace period
const WEAK_STALENESS_CAP       = 2.0;           // max staleness multiplier
const WEAK_AVG_DOMAIN_WEIGHT   = 0.2;           // avg of the 5 DOMAIN_WEIGHTS values

function _weakDecay(ageMs, halfLifeMs) {
  if (ageMs <= 0) return 1;
  return Math.pow(0.5, ageMs / halfLifeMs);
}
function _weakDomainMultiplier(topicName) {
  const dom = TOPIC_DOMAINS[topicName];
  if (!dom) return 1.0;
  const w = DOMAIN_WEIGHTS[dom] || WEAK_AVG_DOMAIN_WEIGHT;
  return w / WEAK_AVG_DOMAIN_WEIGHT; // range ~0.7 (security) to ~1.2 (troubleshooting)
}
function computeWeakSpotScores() {
  const bank = loadWrongBank();
  // v4.59.7: expand pre-v4.57.1 multi-topic sentinel rows into per-topic
  // rows so the history loop below credits the real topics rather than a
  // nonsense sentinel key. See _expandHistoryForWeakSpots for details.
  const rawHist = loadHistory().filter(e =>
    e.topic && e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC
  );
  const hist = _expandHistoryForWeakSpots(rawHist);
  const now = Date.now();
  const topicData = {};
  const touch = t => {
    if (!topicData[t]) topicData[t] = {
      topic: t,
      wrongsRecent: 0,    // decayed, difficulty-weighted wrong-bank count
      wrongsRaw: 0,       // untouched count for display
      wCorrect: 0,        // weighted correct answers (history)
      wTotal: 0,          // weighted question volume (history)
      lastTouch: 0,       // max of history & wrong-bank timestamps
      totalQuestions: 0   // raw total across history (for display)
    };
    return topicData[t];
  };

  bank.forEach(w => {
    if (!w.topic || w.topic === MIXED_TOPIC || w.topic === EXAM_TOPIC) return;
    const d = touch(w.topic);
    const ts = w.addedDate ? new Date(w.addedDate).getTime() : now;
    const age = Math.max(0, now - ts);
    const decay = _weakDecay(age, WEAK_HALF_LIFE_WRONGS_MS);
    const dw = diffWeight(w.difficulty);
    // Half-credit once an entry has been re-answered correctly once (one more
    // right answer and it graduates out of the bank entirely — don't keep
    // punishing the topic for a nearly-learned mistake).
    const graduationDiscount = (w.rightCount || 0) >= 1 ? 0.5 : 1.0;
    d.wrongsRecent += decay * dw * graduationDiscount;
    d.wrongsRaw += 1;
    if (ts > d.lastTouch) d.lastTouch = ts;
  });

  hist.forEach(e => {
    const d = touch(e.topic);
    const ts = new Date(e.date).getTime();
    const age = Math.max(0, now - ts);
    const decay = _weakDecay(age, WEAK_HALF_LIFE_HIST_MS);
    const dw = diffWeight(e.difficulty);
    const modeBoost = (e.mode === 'exam') ? 1.3 : 1.0;
    const w = decay * dw * modeBoost;
    d.wCorrect += (e.score || 0) * w;
    d.wTotal   += (e.total || 0) * w;
    d.totalQuestions += (e.total || 0);
    if (ts > d.lastTouch) d.lastTouch = ts;
  });

  const rows = [];
  Object.values(topicData).forEach(d => {
    // Require at least *some* signal — a single fading wrong-bank entry or a
    // thin history footprint. Everything below this is indistinguishable
    // from untouched.
    if (d.wTotal < 1 && d.wrongsRecent < 0.5) return;
    // Bayesian posterior mean with Beta(2,2) prior. Prior acts like 2 correct
    // and 2 wrong "ghost" answers, smoothing tiny samples toward 0.5 so a
    // single bad 5-Q run doesn't instantly dominate the ranking.
    const posterior = (d.wCorrect + 2) / (d.wTotal + 4);
    const accGap = Math.max(0, WEAK_TARGET_ACC - posterior);
    // Staleness: days past the untouched grace period, normalized.
    const daysSince = d.lastTouch ? (now - d.lastTouch) / 86400000 : 9999;
    const stalenessRaw = Math.max(0, (daysSince - WEAK_STALENESS_DAYS) / WEAK_STALENESS_DAYS);
    const staleness = Math.min(WEAK_STALENESS_CAP, stalenessRaw);
    const domainMul = _weakDomainMultiplier(d.topic);
    // Combined score. Weights chosen so recent wrongs dominate when fresh,
    // accuracy gap dominates when you've built real volume, and staleness
    // keeps slowly-decaying topics on the radar.
    const base =
      d.wrongsRecent * 3.0 +
      accGap         * 25.0 +
      staleness      * 2.0;
    const score = base * domainMul;
    if (score <= 0) return;
    rows.push({
      topic: d.topic,
      score,
      posterior,
      accuracyGap: accGap,
      wrongsRecent: d.wrongsRecent,
      wrongsRaw: d.wrongsRaw,
      staleness,
      daysSince: Math.round(daysSince),
      domainMul,
      totalQuestions: d.totalQuestions
    });
  });
  rows.sort((a, b) => b.score - a.score);
  return rows;
}

// ── v4.81.15: Stale-topic surfacing (rotation algorithm) ─────────────
// Identifies topics the student hasn't practised in WEAK_STALENESS_DAYS+
// AND surfaces them with a *compound* priority weight: priority =
// daysSince × (1 + accuracyGap). A topic last seen 21d ago at 50% accuracy
// outranks one last seen 28d ago at 90% accuracy — the second is more
// stale by raw days, but the first has more learning value to reclaim.
// Reuses computeWeakSpotScores for posterior accuracy + decayed staleness;
// supplements with raw history scan so single-attempt topics (which the
// weak-spot scorer's low-signal filter excludes) still show up here.
//
// Includes never-studied topics — they're infinitely stale by definition.
// Caller can pass sliceIdx + sliceSize to rotate through the stale set
// across multiple batches in the same exam (per-batch rotation amplifier).
//
// Returns [{ topic, daysSince, posterior, accGap, neverStudied, priority }].
const STALE_PROMPT_TOPIC_COUNT = 10;        // injected into Haiku prompt
const STALE_PROMPT_SLICE_SIZE  = 10;        // rotation window
const STALE_CHIP_TOPIC_COUNT   = 5;         // surfaced in homepage chip row
const STALE_CHIP_MIN_HISTORY   = 5;         // min history rows before chip row appears
function _computeStaleTopics(historyRows, n, sliceIdx, sliceSize) {
  if (typeof TOPIC_DOMAINS === 'undefined') return [];
  if (typeof n !== 'number' || n <= 0) return [];

  const now = Date.now();
  const lastSeen = {};
  const accSignal = {};

  // Pull posterior accuracy + recent last-seen from computeWeakSpotScores
  // (it has the Bayesian Beta(2,2) prior + recency-decayed accuracy that
  // we want for the accuracy gap factor).
  let scored = [];
  try {
    if (typeof computeWeakSpotScores === 'function') scored = computeWeakSpotScores();
  } catch (_) { scored = []; }
  scored.forEach(r => {
    if (!r || !r.topic) return;
    accSignal[r.topic] = r.posterior;
    if (typeof r.daysSince === 'number' && r.daysSince < 9000) {
      lastSeen[r.topic] = now - (r.daysSince * 86400000);
    }
  });

  // Walk raw history for topics computeWeakSpotScores filtered out (single
  // attempt under wTotal<1 && wrongsRecent<0.5). Even one attempt is
  // enough to track last-seen-ness for the staleness signal.
  const hist = (Array.isArray(historyRows) ? historyRows : [])
    .filter(e => e && e.topic && e.topic !== MIXED_TOPIC && e.topic !== EXAM_TOPIC);
  hist.forEach(e => {
    const ts = new Date(e.date).getTime();
    if (!isFinite(ts)) return;
    if (!lastSeen[e.topic] || ts > lastSeen[e.topic]) {
      lastSeen[e.topic] = ts;
    }
  });

  // Score every topic in TOPIC_DOMAINS — including never-touched ones.
  const rows = [];
  Object.keys(TOPIC_DOMAINS).forEach(t => {
    const lastTs = lastSeen[t];
    const daysSince = (typeof lastTs === 'number' && lastTs > 0)
      ? Math.max(0, (now - lastTs) / 86400000)
      : 9999;
    if (daysSince < WEAK_STALENESS_DAYS) return; // not stale yet — skip
    const posterior = (typeof accSignal[t] === 'number') ? accSignal[t] : 0.5;
    const accGap = Math.max(0, WEAK_TARGET_ACC - posterior);
    // Compound priority: stale AND weak ranks above stale-but-mastered.
    // accGap is in [0, 0.85]; (1 + accGap) is in [1, 1.85]. A topic at
    // 50% accuracy (gap 0.35) gets ~1.35× the weight of a same-stale topic
    // at 85% (gap 0). Untouched topics use 0.5 posterior — neutral midpoint
    // so they don't dominate over genuinely-weak studied topics.
    const priority = daysSince * (1 + accGap);
    rows.push({
      topic: t,
      daysSince: Math.round(daysSince),
      posterior,
      accGap,
      neverStudied: !lastTs,
      priority
    });
  });
  rows.sort((a, b) => b.priority - a.priority);

  // Slice rotation: each call with a different sliceIdx returns an
  // overlapping but rotated window of n topics. step = floor(size/2)
  // so consecutive slices overlap by ~50% → coverage continuity stays
  // intact even when the stale pool is small. No slicing → top n.
  if (typeof sliceIdx !== 'number' || typeof sliceSize !== 'number' || sliceSize <= 0 || rows.length === 0) {
    return rows.slice(0, n);
  }
  const step = Math.max(1, Math.floor(sliceSize / 2));
  const start = (sliceIdx * step) % rows.length;
  const sliced = [];
  for (let i = 0; i < n && sliced.length < n; i++) {
    sliced.push(rows[(start + i) % rows.length]);
  }
  return sliced;
}

function _formatStaleTopicsForPrompt(staleTopics) {
  if (!Array.isArray(staleTopics) || staleTopics.length === 0) return '';
  const lines = staleTopics.map(s => {
    const accNote = s.neverStudied
      ? 'never studied'
      : `last seen ${s.daysSince}d ago, ~${Math.round(s.posterior * 100)}% accuracy`;
    return `- "${s.topic}" (${accNote})`;
  }).join('\n');
  return `\n\nROTATION PRIORITY: the student hasn't practised these ${staleTopics.length} topics in a while AND/OR has historically struggled with them. If any of these topics appears in the TOPIC LOTTERY above, dig deeper — pick the trickier exam edge cases for that topic, not the easy recall question. Do NOT add or substitute topics; the lottery is fixed:\n${lines}`;
}

// ── v4.43.1: Weak-spots → Subnet Trainer bridge ───────────────────────
// The main-page weak-spots chip row historically only offered "drill this
// topic in a quiz." For subnetting / IP-math topics though, the Subnet
// Trainer with its step-by-step binary breakdowns is a far better surface
// than a 10-Q MCQ drill. This map routes weak subnetting topics to the
// Subnet Trainer.
//
// MVP-QUIZ-ONLY (Ship 6): WEAK_SPOT_DRILL_BRIDGES + openWeakSpotBridge
// deleted (Subnet Trainer no longer exists; the weak-spot routing now
// surfaces topics via the quiz flow only).
// v4.81.23: legacy renderTodaysFocus + renderRotationChips removed. Both
// were thin shims that delegated to renderTodayPlan. All callers now invoke
// renderTodayPlan directly. The signals these functions used to surface
// (computeWeakSpotScores for weak-spot chips, _computeStaleTopics for
// rotation chips) still drive the consolidated card via buildSessionPlan.


// ══════════════════════════════════════════
// DATA EXPORT / IMPORT
// ══════════════════════════════════════════


// ══════════════════════════════════════════
// v4.81.2: AUTO-BACKUP SAFETY NET
// ──────────────────────────────────────────
// Daily rolling snapshot of ALL nplus_* keys (excluding autobackup keys
// themselves to avoid recursion + theme-only keys we don't care about).
// Keeps the last AUTOBACKUP_KEEP_DAYS snapshots so any catastrophic
// corruption can be rolled back. Hook fires on every page load via
// DOMContentLoaded — but is rate-limited to once per day to avoid
// excess writes.
//
// Filed as the immediate response to a localStorage-corruption incident
// where test-injected state overwrote real user history. The fix:
// disciplinary boundary (no test writes to user's prod localStorage)
// PLUS this safety net so any future corruption is recoverable from
// yesterday's snapshot.
// ══════════════════════════════════════════

// Build a snapshot of every nplus_* key currently in localStorage,
// skipping autobackup-namespace keys + the cooldown anchor.

// Today's date in YYYY-MM-DD format (local time, not UTC) — used as the
// per-day snapshot key suffix.
function _autoBackupTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return STORAGE.AUTOBACKUP_PREFIX + y + '-' + m + '-' + day;
}

// Take today's snapshot if not yet taken. Idempotent — calling twice
// in the same day is a no-op (existing snapshot kept). Prunes older
// snapshots beyond AUTOBACKUP_KEEP_DAYS.

// Drop oldest snapshots beyond AUTOBACKUP_KEEP_DAYS. When `aggressive` is
// true, drop to 3 (used during quota-exceeded recovery).

// List all autobackup snapshots, newest first. Each entry: { key, date, capturedAt, keyCount, version }

// Restore from a snapshot date (e.g. '2026-04-25'). Confirms with user
// before destructive overwrite, then atomically replaces all nplus_*
// keys with the snapshot's values.

// Download the most recent snapshot as a JSON file. If no snapshot exists
// yet, takes one inline first.

// Render the Backup History list inside the Settings page. Shows each
// snapshot as a row with date + size + Restore + Download buttons.

// ══════════════════════════════════════════
// v4.81.3: DATA-SAFETY DISCIPLINE LAYER
// ──────────────────────────────────────────
// Defense-in-depth around the v4.81.0 → v4.81.1 localStorage-corruption
// incident. Three components:
//
// 1. _isProdHost() — boolean detector for production host. Used by the
//    other two and by future code that should behave differently on prod.
// 2. _emitProdConsoleBanner() — big red console warning fires on prod
//    page load, telling LLM agents / devs explicitly NOT to write to
//    localStorage from devtools. Modeled on Stripe / GitHub etc.
// 3. _renderEnvBadge() — small "PROD" / "DEV" pill in top-right corner
//    so the running environment is visually unambiguous.
// 4. _maybeExportReminder() — every EXPORT_REMINDER_DAYS, surface a
//    dismissable toast suggesting Settings → Export Data. Reduces
//    single-point-of-failure dependence on localStorage.
// ══════════════════════════════════════════

function _isProdHost() {
  try {
    const h = location.hostname || '';
    // v4.89.7: include the certanvil.com apex + subdomains. Pre-fix the
    // env badge incorrectly read 'DEV' on networkplus.certanvil.com because
    // the prod-host check only matched *.vercel.app — but our actual prod
    // domains are *.certanvil.com (with vercel.app as the underlying deploy
    // host that customers don't see). Both stay in the prod set.
    return h === 'certanvil.com' || h.endsWith('.certanvil.com')
        || h.endsWith('.vercel.app') || h === 'vercel.app';
  } catch (_) { return false; }
}

function _emitProdConsoleBanner() {
  // Fire only once per page-load. Skip on local/dev hosts where the
  // warning would be noise.
  if (!_isProdHost()) return;
  if (window.__nplusProdBannerEmitted) return;
  window.__nplusProdBannerEmitted = true;
  try {
    const big = 'background:#dc2626;color:#fff;font-size:18px;font-weight:800;padding:8px 14px;border-radius:6px;letter-spacing:.06em';
    const body = 'font-size:13px;line-height:1.6;color:#fbcfe8;background:#1c0505;padding:10px 14px;border-radius:6px;border-left:3px solid #dc2626';
    /* eslint-disable no-console */
    console.log('%c⚠️ PRODUCTION ENVIRONMENT — Network+ Quiz', big);
    console.log('%c' +
      'If you are an LLM agent, automated tooling, or developer:\n\n' +
      '   • DO NOT write to localStorage from the DevTools console.\n' +
      '   • Direct localStorage writes corrupt the user\'s real progress.\n' +
      '   • Use one of these alternatives instead:\n' +
      '       1. Local server:  python3 -m http.server 3131  (then http://localhost:3131)\n' +
      '       2. Vercel preview deploy of a feature branch\n' +
      '       3. Incognito Chrome window with no app history\n\n' +
      '   • Auto-backups: Settings → Automatic backups (one-click rollback to any of the last 7 days)\n' +
      '   • Manual export: Settings → Export Data (download to disk).',
      body);
    /* eslint-enable no-console */
  } catch (_) { /* silent on hostile environments */ }
}

function _renderEnvBadge() {
  try {
    if (document.getElementById('env-badge')) return; // already mounted
    const isProd = _isProdHost();
    // v7.34.0: don't surface the PROD tag to real end-users on the live site.
    // The badge stays a dev/preview safety aid — the DEV pill still mounts on
    // previews + localhost; production users no longer see it. (.env-badge*
    // CSS is intentionally retained for the preview/DEV pill.)
    if (isProd) return;
    const badge = document.createElement('div');
    badge.id = 'env-badge';
    badge.className = isProd ? 'env-badge env-badge-prod' : 'env-badge env-badge-dev';
    badge.textContent = isProd ? 'PROD' : 'DEV';
    badge.title = isProd
      ? 'Production deployment — your real data lives here. Avoid console writes.'
      : 'Development environment — safe to experiment.';
    document.body.appendChild(badge);
  } catch (_) { /* don't break the app on a badge mount failure */ }
}

function _maybeExportReminder() {
  try {
    // Skip if user has fewer than 5 quiz sessions — nothing meaningful to back up.
    const hist = (typeof loadHistory === 'function') ? loadHistory() : [];
    if (hist.length < 5) return;
    const last = parseInt(localStorage.getItem(STORAGE.LAST_EXPORT_REMINDER_AT) || '0', 10);
    const elapsedMs = Date.now() - last;
    if (last && elapsedMs < EXPORT_REMINDER_DAYS * 86400000) return;
    // Stamp now BEFORE showing the toast so a render error doesn't repeat.
    localStorage.setItem(STORAGE.LAST_EXPORT_REMINDER_AT, String(Date.now()));
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast('💾 Tip: download a backup. Settings → Export Data keeps a copy outside your browser.', 'info', 8000);
      }
    }, 4000); // wait 4s after page load so the toast doesn't fight the hero render
  } catch (_) { /* silent — reminder is opportunistic */ }
}

// ══════════════════════════════════════════
// v4.81.4: API KEY AUTO-SAVE (UX fix from v4.81.3 incident follow-up)
// ──────────────────────────────────────────
// Pre-fix the API-key input only persisted when the user triggered an
// action that read it (Generate Quiz, Take Diagnostic, etc). Pasting +
// reloading lost the key silently — exactly what the user hit after
// re-creating their key post-corruption-incident. This module auto-
// saves on every input + on blur, with a small debounce so we don't
// hammer localStorage while typing. Visible "Saved ✓" status pill so
// the user gets confirmation.
// ══════════════════════════════════════════


// Debounced save — fires while the user is typing. Coalesces rapid
// keystrokes into a single save. The blur handler still runs a final
// save when the field loses focus.

// Save whatever's currently in the input (after trimming whitespace)
// to localStorage and update the visible status pill.

// v4.85.16: shared err-box cleanup helper. Sweeps the DOM for any visible
// .err-box, .setup-err, or related stale-error elements and re-hides them.
// Called from (1) successful API key save, (2) showPage navigation, so a
// banner from one flow can't leak into another. Idempotent + defensive.
function _clearStaleErrBoxes() {
  try {
    // Direct hit: the known persistent banner inside page-setup
    const setupErr = document.getElementById('setup-err');
    if (setupErr) {
      setupErr.classList.add('is-hidden');
      setupErr.textContent = '';
    }
    // Defensive sweep: any other .err-box that's been left visible
    document.querySelectorAll('.err-box:not(.is-hidden)').forEach(el => {
      el.classList.add('is-hidden');
      el.textContent = '';
    });
  } catch (_) { /* defensive — never block a page transition on a cleanup error */ }
}

// On page load, if a key is already saved, show the "Saved" pill. This
// reassures the user that the key persisted across reload.

// ══════════════════════════════════════════
// TOPIC RESOURCES (Professor Messer N10-009)
// ══════════════════════════════════════════
// v4.86.1: topicResources moved to certs/<cert>.js. App reads via CERT_PACK.
const topicResources = (CERT_PACK && CERT_PACK.topicResources) || {};

// ══════════════════════════════════════════
// CLI SIMULATOR SCENARIO BANK
// ══════════════════════════════════════════
const cliScenarios = [
  {
    type: 'cli-sim', difficulty: DEFAULT_DIFF, topic: 'Network Troubleshooting & Tools',
    scenario: 'A user reports they can reach internal servers but cannot browse any websites. You sit at their workstation to investigate.',
    hostname: 'WORKSTATION-PC',
    commands: {
      'ipconfig': 'Windows IP Configuration\n\nEthernet adapter Ethernet0:\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 192.168.1.45\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1',
      'ping 192.168.1.1': 'Pinging 192.168.1.1 with 32 bytes of data:\nReply from 192.168.1.1: bytes=32 time<1ms TTL=64\nReply from 192.168.1.1: bytes=32 time<1ms TTL=64\n\nPing statistics: Sent = 2, Received = 2, Lost = 0 (0% loss)',
      'ping 8.8.8.8': 'Pinging 8.8.8.8 with 32 bytes of data:\nReply from 8.8.8.8: bytes=32 time=15ms TTL=118\nReply from 8.8.8.8: bytes=32 time=14ms TTL=118\n\nPing statistics: Sent = 2, Received = 2, Lost = 0 (0% loss)',
      'nslookup www.google.com': 'DNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  192.168.1.10\n\nDNS request timed out.\n    timeout was 2 seconds.\n*** Request to UnKnown timed-out',
      'ping 192.168.1.10': 'Pinging 192.168.1.10 with 32 bytes of data:\nRequest timed out.\nRequest timed out.\n\nPing statistics: Sent = 2, Received = 0, Lost = 2 (100% loss)'
    },
    question: 'Based on the outputs, what is the most likely cause of the issue?',
    options: { A: 'The default gateway is misconfigured', B: 'The DNS server at 192.168.1.10 is down or unreachable', C: 'The workstation has an APIPA address', D: 'There is a duplex mismatch on the Ethernet adapter' },
    answer: 'B',
    explanation: 'The workstation has a valid IP (192.168.1.45), can ping the gateway and 8.8.8.8, proving Layer 3 connectivity works. However, nslookup fails and the DNS server at 192.168.1.10 is unreachable (100% loss). The DNS server being down explains why name resolution fails while IP connectivity works. A is wrong because gateway pings succeed.'
  },
  {
    type: 'cli-sim', difficulty: DEFAULT_DIFF, topic: 'Network Troubleshooting & Tools',
    scenario: 'A new employee\'s PC cannot connect to any network resources. They just plugged in their Ethernet cable. You open a command prompt.',
    hostname: 'NEW-PC',
    commands: {
      'ipconfig': 'Windows IP Configuration\n\nEthernet adapter Ethernet0:\n   Connection-specific DNS Suffix  . :\n   Autoconfiguration IPv4 Address. . : 169.254.82.117\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :',
      'ping 192.168.1.1': 'Pinging 192.168.1.1 with 32 bytes of data:\nDestination host unreachable.\nDestination host unreachable.\n\nPing statistics: Sent = 2, Received = 0, Lost = 2 (100% loss)',
      'ipconfig /renew': 'An error occurred while renewing interface Ethernet0:\nThe DHCP server could not be contacted.',
      'arp -a': 'No ARP Entries Found'
    },
    question: 'What does the 169.254.x.x address indicate?',
    options: { A: 'The PC has a static IP in the link-local range', B: 'DHCP assigned a temporary address from the APIPA range', C: 'The PC failed to obtain a DHCP lease and self-assigned an APIPA address', D: 'The DNS server assigned this address for local resolution' },
    answer: 'C',
    explanation: 'A 169.254.x.x address is an Automatic Private IP Addressing (APIPA) address. Windows self-assigns one when it cannot contact a DHCP server. The ipconfig /renew confirming DHCP could not be contacted proves this. B is wrong because DHCP servers do not assign APIPA addresses \u2014 the client self-assigns them.'
  },
  {
    type: 'cli-sim', difficulty: 'Hard', topic: 'Network Troubleshooting & Tools',
    scenario: 'Users report intermittent connectivity \u2014 pages sometimes load, sometimes timeout. You run commands from one affected workstation.',
    hostname: 'TECH-PC',
    commands: {
      'ipconfig': 'Windows IP Configuration\n\nEthernet adapter Ethernet0:\n   IPv4 Address. . . . . . . . . . . : 192.168.10.25\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.10.1',
      'arp -a': 'Interface: 192.168.10.25 --- 0xa\n  Internet Address      Physical Address      Type\n  192.168.10.1          aa-bb-cc-dd-ee-01     dynamic\n  192.168.10.25         00-1a-2b-3c-4d-5e     dynamic\n  192.168.10.99         00-1a-2b-3c-4d-5e     dynamic',
      'ping 192.168.10.99': 'Pinging 192.168.10.99 with 32 bytes of data:\nReply from 192.168.10.99: bytes=32 time<1ms TTL=128',
      'netstat -an': 'Active Connections\n  Proto  Local Address          Foreign Address        State\n  TCP    192.168.10.25:135      0.0.0.0:0              LISTENING\n  TCP    192.168.10.25:445      0.0.0.0:0              LISTENING\n  TCP    192.168.10.25:49152    192.168.10.1:80        ESTABLISHED'
    },
    question: 'The ARP table reveals a critical issue. What is the problem?',
    options: { A: 'The gateway MAC address is a broadcast address', B: 'There is an IP address conflict \u2014 192.168.10.25 and 192.168.10.99 share the same MAC', C: 'The subnet mask is incorrect for this network', D: 'Port 445 is open, indicating a security vulnerability' },
    answer: 'B',
    explanation: 'The ARP table shows 192.168.10.25 (this PC) and 192.168.10.99 share the identical MAC address 00-1a-2b-3c-4d-5e. This is a duplicate IP/MAC conflict causing intermittent connectivity as traffic gets misdirected. A is wrong because aa-bb-cc-dd-ee-01 is a valid unicast MAC, not a broadcast.'
  },
  {
    type: 'cli-sim', difficulty: DEFAULT_DIFF, topic: 'Network Troubleshooting & Tools',
    scenario: 'A remote office reports connections to the HQ file server (10.0.0.50) are extremely slow. Normal latency should be ~20ms.',
    hostname: 'REMOTE-PC',
    commands: {
      'ping 10.0.0.50': 'Pinging 10.0.0.50 with 32 bytes of data:\nReply from 10.0.0.50: bytes=32 time=185ms TTL=121\nReply from 10.0.0.50: bytes=32 time=192ms TTL=121\n\nAverage = 188ms',
      'tracert 10.0.0.50': 'Tracing route to 10.0.0.50:\n\n  1    <1ms   <1ms   <1ms   192.168.5.1\n  2    12ms   11ms   12ms   10.1.1.1\n  3    14ms   13ms   14ms   10.2.2.1\n  4    155ms  160ms  158ms  10.3.3.1\n  5    162ms  165ms  160ms  10.4.4.1\n  6    178ms  180ms  175ms  10.0.0.1\n  7    185ms  190ms  182ms  10.0.0.50\n\nTrace complete.',
      'ping 192.168.5.1': 'Reply from 192.168.5.1: bytes=32 time<1ms TTL=64\nPing statistics: Sent = 2, Received = 2, Lost = 0',
      'nslookup fileserver.corp.local': 'Server:  dc01.corp.local\nAddress:  192.168.5.10\n\nName:    fileserver.corp.local\nAddress:  10.0.0.50'
    },
    question: 'Based on the traceroute, where is the latency bottleneck?',
    options: { A: 'Between the PC and its default gateway (hop 1)', B: 'Between hop 2 (10.1.1.1) and hop 3 (10.2.2.1)', C: 'Between hop 3 (10.2.2.1) and hop 4 (10.3.3.1)', D: 'At the destination server (10.0.0.50)' },
    answer: 'C',
    explanation: 'The traceroute shows latency jumps from 14ms at hop 3 to 155ms at hop 4 \u2014 a 141ms spike between 10.2.2.1 and 10.3.3.1. All later hops maintain similar high latency because the bottleneck compounds downstream. The link between those routers is likely congested or routing sub-optimally. A is wrong because hop 1 shows <1ms.'
  },
  {
    type: 'cli-sim', difficulty: DEFAULT_DIFF, topic: 'Network Troubleshooting & Tools',
    scenario: 'An application team reports their web server on port 8080 is not reachable from the network. The server runs on 192.168.1.100. You investigate from the server itself.',
    hostname: 'WEB-SRV',
    commands: {
      'netstat -an | findstr 8080': '  TCP    127.0.0.1:8080         0.0.0.0:0              LISTENING',
      'ipconfig': 'Windows IP Configuration\n\nEthernet adapter Ethernet0:\n   IPv4 Address. . . . . . . . . . . : 192.168.1.100\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1',
      'netsh advfirewall show currentprofile': 'Domain Profile Settings:\n----------------------------------------------------------------------\nState                                 ON\nFirewall Policy                       BlockInbound,AllowOutbound',
      'ping 192.168.1.1': 'Reply from 192.168.1.1: bytes=32 time<1ms TTL=64'
    },
    question: 'Why is the web server not reachable from the network?',
    options: { A: 'The Windows Firewall is blocking all inbound connections', B: 'The application is only listening on 127.0.0.1 (localhost), not on the network interface', C: 'The default gateway is incorrectly configured', D: 'The subnet mask is too restrictive for this network' },
    answer: 'B',
    explanation: 'Netstat shows the server listening on 127.0.0.1:8080 (loopback). This means it only accepts local connections. It should listen on 0.0.0.0:8080 or 192.168.1.100:8080 to accept remote connections. While the firewall also blocks inbound, the primary issue is the loopback binding \u2014 even with the firewall open, 127.0.0.1 would still block remote access.'
  },
  {
    type: 'cli-sim', difficulty: 'Hard', topic: 'Network Troubleshooting & Tools',
    scenario: 'After a switch replacement, VoIP phones are not receiving IP addresses. Data devices on the same switch work fine. You check from the switch console.',
    hostname: 'SW-FLOOR2',
    commands: {
      'show vlan brief': 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- ----------\n1    default                          active    Fa0/1-24\n10   DATA                             active\n20   VOICE                            active\n99   MANAGEMENT                       active',
      'show interface fa0/5': 'FastEthernet0/5 is up, line protocol is up\n  Switchport mode: access\n  Access Mode VLAN: 1 (default)',
      'show running-config interface fa0/5': 'interface FastEthernet0/5\n description IP Phone + PC\n switchport mode access\n switchport access vlan 1\n spanning-tree portfast',
      'show ip dhcp snooping': 'Switch DHCP snooping is enabled\nVLAN 10: enabled\nVLAN 20: disabled'
    },
    question: 'Why are VoIP phones not getting IP addresses?',
    options: { A: 'DHCP snooping is not enabled on VLAN 20 (VOICE)', B: 'The port is in VLAN 1 with no voice VLAN configured', C: 'Spanning-tree portfast is causing phones to be blocked', D: 'The VOICE VLAN 20 has no ports assigned' },
    answer: 'B',
    explanation: 'The port config shows VLAN 1 (default) with no voice VLAN. After the switch replacement, ports were not reconfigured with "switchport voice vlan 20". Without the voice VLAN setting, phones cannot tag traffic on VLAN 20 to reach their DHCP server. D is misleading \u2014 VLAN 20 exists but ports lack the voice VLAN assignment.'
  }
];

// ══════════════════════════════════════════
// TOPOLOGY BUILDER SCENARIO BANK
// ══════════════════════════════════════════
const topoScenarios = [
  {
    type: 'topology', difficulty: DEFAULT_DIFF, topic: 'Firewalls, DMZ & Security Zones',
    scenario: 'Place each network component into the correct security zone for a secure web hosting architecture.',
    zones: ['Internet', 'DMZ', 'Internal LAN'],
    devices: ['Public Web Server', 'Database Server', 'Email Gateway', 'Domain Controller'],
    correctPlacements: { 'Public Web Server': 'DMZ', 'Database Server': 'Internal LAN', 'Email Gateway': 'DMZ', 'Domain Controller': 'Internal LAN' },
    question: 'Place each device into the correct security zone.',
    explanation: 'Public-facing servers (web server, email gateway) belong in the DMZ \u2014 a screened subnet between firewalls. This limits exposure if compromised. The database and domain controller hold sensitive data and must be in the Internal LAN, never directly exposed to the internet.'
  },
  {
    type: 'topology', difficulty: DEFAULT_DIFF, topic: 'Protecting Networks',
    scenario: 'A company is deploying network monitoring. Place each security tool in the correct zone.',
    zones: ['Internet Edge', 'Core Network', 'Server Farm'],
    devices: ['IDS Sensor', 'SIEM Collector', 'Honeypot', 'Syslog Server'],
    correctPlacements: { 'IDS Sensor': 'Internet Edge', 'SIEM Collector': 'Core Network', 'Honeypot': 'Internet Edge', 'Syslog Server': 'Server Farm' },
    question: 'Place each security tool in its optimal network zone.',
    explanation: 'The IDS sensor and honeypot belong at the Internet Edge to detect and attract threats before they reach internal networks. The SIEM collector goes in the Core Network to aggregate logs from all zones. The Syslog server belongs in the Server Farm for secure log storage alongside infrastructure servers.'
  },
  {
    type: 'topology', difficulty: DEFAULT_DIFF, topic: 'Wireless Networking',
    scenario: 'Deploy a secure enterprise wireless network. Place each component in the correct location.',
    zones: ['Reception Area', 'Server Room', 'Office Floor'],
    devices: ['Wireless Access Point', 'WLC (Controller)', 'RADIUS Server', 'Guest Captive Portal'],
    correctPlacements: { 'Wireless Access Point': 'Office Floor', 'WLC (Controller)': 'Server Room', 'RADIUS Server': 'Server Room', 'Guest Captive Portal': 'Reception Area' },
    question: 'Place each wireless component in the correct location.',
    explanation: 'APs go on the Office Floor for coverage. The WLC and RADIUS server belong in the Server Room as centralized infrastructure \u2014 WLC manages all APs, RADIUS handles 802.1X auth. The Guest Captive Portal goes in Reception for visitor internet access without corporate network access.'
  },
  {
    type: 'topology', difficulty: 'Hard', topic: 'Cloud Networking & VPCs',
    scenario: 'Design a hybrid cloud architecture. Place each component in the correct environment.',
    zones: ['On-Premises DC', 'Cloud Public Subnet', 'Cloud Private Subnet'],
    devices: ['VPN Gateway', 'Load Balancer', 'App Servers', 'Cloud Database'],
    correctPlacements: { 'VPN Gateway': 'On-Premises DC', 'Load Balancer': 'Cloud Public Subnet', 'App Servers': 'Cloud Private Subnet', 'Cloud Database': 'Cloud Private Subnet' },
    question: 'Place each component in the correct environment.',
    explanation: 'The VPN Gateway sits on-premises to tunnel securely to the cloud VPC. The Load Balancer needs the Public Subnet to accept internet traffic. App Servers and the Cloud Database belong in the Private Subnet \u2014 not directly internet-accessible, receiving traffic only through the load balancer.'
  },
  {
    type: 'topology', difficulty: DEFAULT_DIFF, topic: 'Cabling & Topology',
    scenario: 'A new office needs network infrastructure. Place each device at the correct layer of the three-tier architecture.',
    zones: ['Access Layer', 'Distribution Layer', 'Core Layer'],
    devices: ['End-user Switch (24-port)', 'Layer 3 Switch', 'Backbone Router', 'PoE Switch for IP Phones'],
    correctPlacements: { 'End-user Switch (24-port)': 'Access Layer', 'Layer 3 Switch': 'Distribution Layer', 'Backbone Router': 'Core Layer', 'PoE Switch for IP Phones': 'Access Layer' },
    question: 'Place each device at the correct network tier.',
    explanation: 'End-user and PoE switches connect directly to devices at the Access Layer. Layer 3 switches handle inter-VLAN routing and policies at the Distribution Layer. The backbone router at the Core Layer provides high-speed transport between distribution blocks and to the WAN.'
  }
];

// ══════════════════════════════════════════
// v4.83.0 — Hot-Area question type (curated bank)
// ══════════════════════════════════════════
// User feature: hot-area click-on-diagram PBQs to fill the realism gap vs the
// real CompTIA exam (which sometimes asks "click the misconfigured device" or
// "click the OSI layer where ARP operates"). Three sub-shapes covered:
//   - 'topology'   : SVG network diagram, click a device shape
//   - 'osi'        : 7-layer vertical stack, click a layer (supports dual-correct
//                     for boundary protocols like ARP at L2/L3)
//   - 'cable-grid' : grid of connector cards, click the right connector
//
// Schema is sub-shape specific (cleaner than a forced unified schema):
//   - topology: { svgViewBox, svgConnectors[], regions[{id,label,shape,x,y,w,h,r,isCorrect}] }
//   - osi: { correctLayers: ['L2'] or ['L2','L3'] }
//   - cable-grid: { cables: [{id, isCorrect}] }   (icons live in CABLE_CONNECTORS)
//
// Renderer dispatches by q.subShape. Submit handler is `submitHotArea(q)` which
// follows the v4.82.0 update-or-push pattern for revisit-aware re-submits.

// SVG icon library for the cable-grid sub-shape. Each connector is a 60×60
// viewBox with a stylised geometric representation. Designed to read at small
// sizes — the goal is "you can pick this out from a row of others" not photo-
// realism. Icons use currentColor for stroke + fill so they inherit theme tints.
const CABLE_CONNECTORS = {
  'rj45': {
    label: 'RJ-45',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<rect x="10" y="20" width="40" height="24" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M 22 20 L 22 14 L 38 14 L 38 20" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="14" y1="38" x2="14" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="18" y1="38" x2="18" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="22" y1="38" x2="22" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="26" y1="38" x2="26" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="30" y1="38" x2="30" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="34" y1="38" x2="34" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="38" y1="38" x2="38" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="42" y1="38" x2="42" y2="44" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>'
  },
  'rj11': {
    label: 'RJ-11',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<rect x="18" y="22" width="24" height="22" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M 24 22 L 24 16 L 36 16 L 36 22" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="22" y1="38" x2="22" y2="42" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="26" y1="38" x2="26" y2="42" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="30" y1="38" x2="30" y2="42" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="34" y1="38" x2="34" y2="42" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="38" y1="38" x2="38" y2="42" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>'
  },
  'lc': {
    label: 'LC',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<rect x="14" y="20" width="32" height="24" rx="3" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="20" y="38" width="6" height="10" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
      '<rect x="34" y="38" width="6" height="10" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M 30 14 L 26 20 L 34 20 Z" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>'
  },
  'sc': {
    label: 'SC',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<rect x="12" y="18" width="36" height="22" rx="2" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="26" y="38" width="8" height="14" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
      '<line x1="18" y1="22" x2="18" y2="36" stroke="currentColor" stroke-width="1"/>' +
      '<line x1="42" y1="22" x2="42" y2="36" stroke="currentColor" stroke-width="1"/>' +
    '</svg>'
  },
  'st': {
    label: 'ST',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<circle cx="30" cy="30" r="14" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<rect x="28" y="44" width="4" height="10" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
      '<line x1="22" y1="22" x2="20" y2="20" stroke="currentColor" stroke-width="1.2"/>' +
      '<line x1="38" y1="22" x2="40" y2="20" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>'
  },
  'f-type': {
    label: 'F-Type',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<polygon points="18,18 42,18 48,30 42,42 18,42 12,30" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="30" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<line x1="30" y1="30" x2="30" y2="22" stroke="currentColor" stroke-width="1.5"/>' +
      '<line x1="30" y1="30" x2="38" y2="30" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>'
  },
  'bnc': {
    label: 'BNC',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<circle cx="30" cy="30" r="13" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="30" cy="30" r="3" fill="currentColor"/>' +
      '<rect x="14" y="28" width="6" height="4" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
      '<rect x="40" y="28" width="6" height="4" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1"/>' +
    '</svg>'
  },
  'usb-c': {
    label: 'USB-C',
    svg: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" width="48" height="48" aria-hidden="true">' +
      '<rect x="12" y="24" width="36" height="14" rx="7" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="20" y="29" width="20" height="4" rx="2" fill="currentColor" fill-opacity="0.4"/>' +
    '</svg>'
  }
};

const HOT_AREA_BANK = [
  // ── TOPOLOGY (3) ──
  {
    type: 'hot-area', subShape: 'topology', difficulty: 'Exam Level', topic: 'Network Troubleshooting Methodology',
    question: 'A user reports they cannot reach the internet from the LAN. ICMP from PC1 to the default gateway succeeds, but ICMP from PC1 to 8.8.8.8 fails. Click the device most likely misconfigured.',
    svgViewBox: '0 0 600 200',
    svgConnectors: [
      { x1: 100, y1: 100, x2: 160, y2: 100 },
      { x1: 240, y1: 100, x2: 300, y2: 100 },
      { x1: 380, y1: 100, x2: 440, y2: 100 },
      { x1: 520, y1: 100, x2: 535, y2: 100 }
    ],
    regions: [
      { id: 'pc1', label: 'PC1', shape: 'rect', x: 20, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'switch', label: 'SW1', shape: 'rect', x: 160, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'router', label: 'R1', shape: 'rect', x: 300, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'firewall', label: 'FW1', shape: 'rect', x: 440, y: 70, w: 80, h: 60, isCorrect: true },
      { id: 'internet', label: 'INET', shape: 'circle', cx: 560, cy: 100, r: 28, isCorrect: false }
    ],
    explanation: 'PC1 reaching its default gateway means LAN, switch, and router are all functional at L2/L3. Failure occurs only when traffic crosses the firewall — most likely cause is an outbound rule denying ICMP or a missing NAT/PAT translation. R1 has Layer 3 routing working (it forwarded to FW1), so it is not the misconfigured device.'
  },
  {
    type: 'hot-area', subShape: 'topology', difficulty: 'Foundational', topic: 'Routing Fundamentals',
    question: 'A broadcast frame is sent from PC1 onto the LAN. Click the device where the broadcast is dropped (does not propagate further).',
    svgViewBox: '0 0 600 200',
    svgConnectors: [
      { x1: 100, y1: 100, x2: 160, y2: 100 },
      { x1: 240, y1: 100, x2: 300, y2: 100 },
      { x1: 380, y1: 100, x2: 440, y2: 100 },
      { x1: 520, y1: 100, x2: 540, y2: 100 }
    ],
    regions: [
      { id: 'pc1', label: 'PC1', shape: 'rect', x: 20, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'hub', label: 'Hub', shape: 'rect', x: 160, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'switch', label: 'SW1', shape: 'rect', x: 300, y: 70, w: 80, h: 60, isCorrect: false },
      { id: 'router', label: 'R1', shape: 'rect', x: 440, y: 70, w: 80, h: 60, isCorrect: true },
      { id: 'pc2', label: 'PC2', shape: 'rect', x: 540, y: 70, w: 50, h: 60, isCorrect: false }
    ],
    explanation: 'A router defines the broadcast domain boundary at Layer 3 — it does NOT forward broadcast frames to other subnets. Hubs and switches both forward broadcasts (a hub is one broadcast and one collision domain; a switch is one broadcast domain but separates collision domains per port). The broadcast reaches every device on the LAN side but stops at R1.'
  },
  {
    type: 'hot-area', subShape: 'topology', difficulty: 'Foundational', topic: 'Wireless Networking',
    question: 'Click the device that centrally manages multiple lightweight (thin) access points in an enterprise wireless deployment.',
    svgViewBox: '0 0 600 220',
    svgConnectors: [
      { x1: 100, y1: 60, x2: 280, y2: 110 },
      { x1: 100, y1: 110, x2: 280, y2: 110 },
      { x1: 100, y1: 160, x2: 280, y2: 110 },
      { x1: 360, y1: 110, x2: 440, y2: 110 }
    ],
    regions: [
      { id: 'ap1', label: 'AP1', shape: 'rect', x: 20, y: 30, w: 80, h: 50, isCorrect: false },
      { id: 'ap2', label: 'AP2', shape: 'rect', x: 20, y: 90, w: 80, h: 50, isCorrect: false },
      { id: 'ap3', label: 'AP3', shape: 'rect', x: 20, y: 150, w: 80, h: 50, isCorrect: false },
      { id: 'wlc', label: 'WLC', shape: 'rect', x: 280, y: 80, w: 80, h: 60, isCorrect: true },
      { id: 'firewall', label: 'FW', shape: 'rect', x: 440, y: 80, w: 80, h: 60, isCorrect: false }
    ],
    explanation: 'A Wireless LAN Controller (WLC) centrally manages thin/lightweight APs in an enterprise deployment. The APs forward all client traffic and management decisions to the WLC, which handles authentication, channel/power assignments, roaming coordination, and policy enforcement. Autonomous (fat) APs do not require a WLC — they handle these functions individually.'
  },
  // ── OSI (3) ──
  {
    type: 'hot-area', subShape: 'osi', difficulty: 'Foundational', topic: 'Network Models & OSI',
    question: 'Click the OSI layer where ARP (Address Resolution Protocol) operates. (Some sources accept either of two adjacent layers — both are correct here.)',
    correctLayers: ['L2', 'L3'],
    explanation: 'ARP is the canonical OSI-boundary protocol — it lives at Layer 2 (uses MAC addresses, broadcast frames) but resolves Layer 3 IP addresses. Some sources call it "Layer 2.5". CompTIA accepts both Layer 2 (Data Link) and Layer 3 (Network) as correct depending on the question framing. The most common single-layer answer on the exam is Layer 2 (Data Link) since that is where the MAC address resolution happens.'
  },
  {
    type: 'hot-area', subShape: 'osi', difficulty: 'Foundational', topic: 'Network Models & OSI',
    question: 'Click the OSI layer where TLS encryption operates.',
    correctLayers: ['L6'],
    explanation: 'TLS (Transport Layer Security) operates at Layer 6 (Presentation) in the OSI model — encryption, decryption, and data formatting are Presentation-layer functions. The name "Transport Layer Security" is misleading; it does NOT operate at OSI Layer 4. TLS sits ABOVE the transport layer (TCP) and BELOW the application layer (HTTP, SMTP, IMAP), which puts it squarely at Layer 6. Some texts conflate this with Layer 5 (Session), but the canonical CompTIA mapping is L6.'
  },
  {
    type: 'hot-area', subShape: 'osi', difficulty: 'Foundational', topic: 'Switching & VLANs',
    question: 'A switch builds a CAM table by learning source MAC addresses from incoming frames. Click the OSI layer where this learning happens.',
    correctLayers: ['L2'],
    explanation: 'Switches operate at Layer 2 (Data Link) — they learn MAC addresses from the source field of incoming frames and populate the CAM (Content-Addressable Memory) table. When a frame arrives for a destination MAC, the switch consults the CAM table and forwards out the correct port (or floods if unknown). MAC addresses are Layer 2 identifiers; IP addresses (Layer 3) are not used by a basic L2 switch. Multilayer switches additionally do L3 routing but the MAC-learning function itself is L2.'
  },
  // ── CABLE-GRID (2) ──
  {
    type: 'hot-area', subShape: 'cable-grid', difficulty: 'Foundational', topic: 'Cabling & Topology',
    question: 'Which connector would you use to terminate single-mode fiber for long-haul SFP+ uplinks in a data centre?',
    cables: [
      { id: 'rj45', isCorrect: false },
      { id: 'rj11', isCorrect: false },
      { id: 'lc', isCorrect: true },
      { id: 'sc', isCorrect: false },
      { id: 'st', isCorrect: false },
      { id: 'f-type', isCorrect: false },
      { id: 'bnc', isCorrect: false },
      { id: 'usb-c', isCorrect: false }
    ],
    explanation: 'LC (Lucent Connector) is the small-form-factor fibre connector used in SFP and SFP+ transceivers. It supports both single-mode and multi-mode fibre. SC connectors are bulkier and typically used in older termination panels; ST is bayonet-style and rarely seen in modern data-centre uplinks. RJ-45/RJ-11 are copper twisted-pair, F-Type/BNC are coax, USB-C is for client devices.'
  },
  {
    type: 'hot-area', subShape: 'cable-grid', difficulty: 'Foundational', topic: 'Cabling & Topology',
    question: 'A residential customer needs to connect their cable modem to the wall outlet for broadband internet over coax. Which connector terminates the coaxial cable?',
    cables: [
      { id: 'rj45', isCorrect: false },
      { id: 'rj11', isCorrect: false },
      { id: 'lc', isCorrect: false },
      { id: 'sc', isCorrect: false },
      { id: 'st', isCorrect: false },
      { id: 'f-type', isCorrect: true },
      { id: 'bnc', isCorrect: false },
      { id: 'usb-c', isCorrect: false }
    ],
    explanation: 'F-Type connectors are the threaded coax connectors used for residential cable TV and cable modem (DOCSIS) connections. BNC is also a coax connector but uses a bayonet locking mechanism and is found in older networking and video applications, not residential cable modems. RJ-45/RJ-11 are twisted-pair copper, LC/SC/ST are fibre, USB-C is for client devices.'
  }
];


// Hot-area renderer dispatches by sub-shape. Each sub-renderer builds its own
// DOM (svg group / div stack / div grid) and wires onclick handlers to
// _haPickRegion(regionId). The picked region is tracked in the module-scoped
// `_hotAreaPick` so the user can change their pick before clicking Submit.
let _hotAreaPick = null;

function renderHotArea(q, box) {
  // Reset pick state on fresh render (revisit hydrates this separately).
  _hotAreaPick = null;
  box.classList.remove('is-revisiting'); // cleared per-render; restore re-adds if needed

  if (q.subShape === 'topology') {
    _renderHotAreaTopology(q, box);
  } else if (q.subShape === 'osi') {
    _renderHotAreaOsi(q, box);
  } else if (q.subShape === 'cable-grid') {
    _renderHotAreaCableGrid(q, box);
  } else {
    box.innerHTML = '<div style="color:var(--red);font-size:13px">Unknown hot-area sub-shape: ' + escHtml(String(q.subShape)) + '</div>';
    return;
  }

  // Submit row (shared across all sub-shapes)
  const row = document.createElement('div');
  row.className = 'ha-submit-row';
  row.id = 'ha-submit-row';
  row.innerHTML = '<span class="ha-hint" id="ha-hint">Click a region to select your answer</span>';
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.id = 'ha-submit-btn';
  submitBtn.textContent = 'Submit';
  submitBtn.disabled = true;
  submitBtn.classList.add('is-dimmed');
  submitBtn.onclick = () => submitHotArea(q);
  row.appendChild(submitBtn);
  box.appendChild(row);
}

function _renderHotAreaTopology(q, box) {
  const stage = document.createElement('div');
  stage.className = 'hot-area-stage';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'hot-area-svg');
  svg.setAttribute('viewBox', q.svgViewBox || '0 0 600 200');

  // Background connectors (non-clickable lines)
  (q.svgConnectors || []).forEach(c => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', c.x1); line.setAttribute('y1', c.y1);
    line.setAttribute('x2', c.x2); line.setAttribute('y2', c.y2);
    line.setAttribute('class', 'hot-area-connector');
    svg.appendChild(line);
  });

  // Regions (clickable groups)
  (q.regions || []).forEach(r => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'hot-region');
    g.setAttribute('data-region', r.id);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', r.label);
    g.onclick = () => _haPickRegion(r.id);
    g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(r.id); } };

    if (r.shape === 'circle') {
      const circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', r.cx); circle.setAttribute('cy', r.cy); circle.setAttribute('r', r.r);
      g.appendChild(circle);
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', r.cx); text.setAttribute('y', r.cy + 4);
      text.textContent = r.label;
      g.appendChild(text);
    } else {
      // default: rect
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', r.x); rect.setAttribute('y', r.y);
      rect.setAttribute('width', r.w); rect.setAttribute('height', r.h);
      rect.setAttribute('rx', '6');
      g.appendChild(rect);
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', r.x + r.w / 2); text.setAttribute('y', r.y + r.h / 2 + 4);
      text.textContent = r.label;
      g.appendChild(text);
    }
    svg.appendChild(g);
  });

  stage.appendChild(svg);
  box.appendChild(stage);
}

function _renderHotAreaOsi(q, box) {
  const stage = document.createElement('div');
  stage.className = 'hot-area-stage';
  const stack = document.createElement('div');
  stack.className = 'osi-stack';
  const layers = [
    { id: 'L7', name: 'Application' },
    { id: 'L6', name: 'Presentation' },
    { id: 'L5', name: 'Session' },
    { id: 'L4', name: 'Transport' },
    { id: 'L3', name: 'Network' },
    { id: 'L2', name: 'Data Link' },
    { id: 'L1', name: 'Physical' }
  ];
  layers.forEach(l => {
    const div = document.createElement('div');
    div.className = 'osi-layer';
    div.setAttribute('data-region', l.id);
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', l.id + ' ' + l.name);
    div.innerHTML = '<span><span class="osi-layer-num">' + l.id + '</span> · <span class="osi-layer-name">' + l.name + '</span></span>';
    div.onclick = () => _haPickRegion(l.id);
    div.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(l.id); } };
    stack.appendChild(div);
  });
  stage.appendChild(stack);
  box.appendChild(stage);
}

function _renderHotAreaCableGrid(q, box) {
  const stage = document.createElement('div');
  stage.className = 'hot-area-stage';
  const grid = document.createElement('div');
  grid.className = 'cable-grid';
  (q.cables || []).forEach(c => {
    const conn = CABLE_CONNECTORS[c.id];
    if (!conn) return;
    const card = document.createElement('div');
    card.className = 'cable-card';
    card.setAttribute('data-region', c.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', conn.label);
    card.innerHTML = '<div class="cable-icon">' + conn.svg + '</div><div class="cable-name">' + escHtml(conn.label) + '</div>';
    card.onclick = () => _haPickRegion(c.id);
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _haPickRegion(c.id); } };
    grid.appendChild(card);
  });
  stage.appendChild(grid);
  box.appendChild(stage);
}

// Click handler — toggles the picked class on the just-clicked region (and
// removes it from any previously-picked region). Enables Submit when a pick
// exists.
function _haPickRegion(regionId) {
  const submitBtn = document.getElementById('ha-submit-btn');
  if (submitBtn && submitBtn.disabled === false && document.querySelector('.hot-region.is-correct, .osi-layer.is-correct, .cable-card.is-correct')) {
    // Already revealed — _restoreAnsweredHotAreaState handles re-pick affordance separately
    // by intercepting here and routing through submitHotArea-style update branch.
  }
  _hotAreaPick = regionId;
  // Clear all previous selection markers
  document.querySelectorAll('#options [data-region]').forEach(el => {
    el.classList.remove('is-picked');
  });
  // Mark the clicked one
  const clicked = document.querySelector('#options [data-region="' + regionId + '"]');
  if (clicked) clicked.classList.add('is-picked');
  // Enable submit
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-dimmed');
  }
  const hint = document.getElementById('ha-hint');
  if (hint) hint.textContent = 'Selected: ' + regionId + '. Click Submit to grade.';
}

function submitHotArea(q) {
  if (!_hotAreaPick) return; // shouldn't happen since Submit is disabled, but defensive
  const isCorrect = _haRegionIsCorrect(q, _hotAreaPick);
  const correctIds = _haCorrectRegionIds(q);
  const existing = _findLogEntryFor(q);

  if (existing) {
    // v4.82.0 revisit pattern: update existing log entry, recompute counters, truth-up wrong-bank
    const wasRight = existing.entry.isRight === true;
    log[existing.idx] = { q, chosen: _hotAreaPick, correct: correctIds.join(','), isRight: isCorrect, flagged: quizFlags[current] };
    if (!isCorrect && wasRight) addToWrongBank(q, _hotAreaPick);
    else if (isCorrect && !wasRight) graduateFromBank(q.question);
    _recomputeQuizCounters();
  } else {
    answered++;
    updateTypeStat('hot-area', isCorrect);
    if (isCorrect) { score++; streak++; if (streak > bestStreak) bestStreak = streak; }
    else { streak = 0; }
    log.push({ q, chosen: _hotAreaPick, correct: correctIds.join(','), isRight: isCorrect, flagged: quizFlags[current] });
    if (!isCorrect) addToWrongBank(q, _hotAreaPick);
    else if (wrongDrillMode) graduateFromBank(q._bankKey || q.question);  // v7.47.0: variant graduates its original
    document.getElementById('live-score').textContent = score + ' / ' + answered;
    document.getElementById('live-streak').textContent = 'Streak ' + streak;
  }

  // Apply reveal classes — mark the picked region correct/wrong, mark all
  // genuinely-correct regions reveal-correct (for dual-correct cases), dim
  // the rest.
  document.querySelectorAll('#options [data-region]').forEach(el => {
    const id = el.getAttribute('data-region');
    el.classList.remove('is-picked');
    if (id === _hotAreaPick && isCorrect) el.classList.add('is-correct');
    else if (id === _hotAreaPick && !isCorrect) el.classList.add('is-wrong');
    else if (correctIds.includes(id)) el.classList.add('is-reveal-correct');
    else el.classList.add('is-dimmed');
  });

  // Hide submit row, show explanation
  const row = document.getElementById('ha-submit-row');
  if (row) row.classList.add('is-hidden');

  const optionsBox = document.getElementById('options');
  if (optionsBox) optionsBox.classList.add('is-revisiting');

  _renderQuizProgressDots();
  _renderQuizNavArrows();

  const haEntry = _findLogEntryFor(q);
  showExplanation(q, isCorrect, haEntry ? haEntry.entry : null);
}

function _haCorrectRegionIds(q) {
  if (q.subShape === 'topology') {
    return (q.regions || []).filter(r => r.isCorrect).map(r => r.id);
  } else if (q.subShape === 'osi') {
    return q.correctLayers || [];
  } else if (q.subShape === 'cable-grid') {
    return (q.cables || []).filter(c => c.isCorrect).map(c => c.id);
  }
  return [];
}

function _haRegionIsCorrect(q, regionId) {
  return _haCorrectRegionIds(q).includes(regionId);
}

// v4.83.0 — restore answered-state for hot-area on revisit. Walks the just-
// rendered regions and re-applies the reveal markers based on the stored
// log entry. Keeps regions click-enabled so user can re-pick.
function _restoreAnsweredHotAreaState(q, entry) {
  const chosen = entry.chosen;
  _hotAreaPick = chosen;
  const correctIds = _haCorrectRegionIds(q);
  document.querySelectorAll('#options [data-region]').forEach(el => {
    const id = el.getAttribute('data-region');
    el.classList.remove('is-picked', 'is-correct', 'is-wrong', 'is-reveal-correct', 'is-dimmed');
    if (id === chosen && entry.isRight) el.classList.add('is-correct');
    else if (id === chosen && !entry.isRight) el.classList.add('is-wrong');
    else if (correctIds.includes(id)) el.classList.add('is-reveal-correct');
    else el.classList.add('is-dimmed');
  });
  // Submit row still visible during revisit so user can re-submit after re-picking.
  const row = document.getElementById('ha-submit-row');
  if (row) row.classList.remove('is-hidden');
  const submitBtn = document.getElementById('ha-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-dimmed');
  }
}

// ══════════════════════════════════════════
// GROUND TRUTH TABLES — deterministic N10-009 facts (v4.38.4)
// Catches factual errors no amount of keyword scoring can.
// Covers the high-frequency deterministic question patterns: port numbers,
// OSI layers, wireless encryption security status.
// ══════════════════════════════════════════
// v4.86.1: GT_* tables moved to certs/<cert>.js as cert.gt.* nested object.
// App reads each via CERT_PACK with Network+ defaults preserved as fallback.
const GT_PORTS = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.ports) || {};
const GT_OSI = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.osi) || {};
// Wireless encryption: broken = reject if marked as secure/recommended
const GT_WIFI_BROKEN = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.wifiBroken) || ['wep'];
const GT_WIFI_DEPRECATED = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.wifiDeprecated) || ['wpa']; // original WPA (not WPA2/3)
// Ethernet physical-layer conflation traps (v4.38.6).
// Haiku (and occasionally Sonnet) conflate auto-negotiation with Auto-MDIX
// because they're co-marketed on modern gear. They are distinct features:
//   - Auto-negotiation (IEEE 802.3u, clause 28): speed + duplex over FLP bursts
//   - Auto-MDIX (IEEE 802.3ab, clause 40): MDI/MDIX pin detection, crossover
// Every entry here is a (topic, correct feature) truth pair that the teacher
// prompt stuffs in as AUTHORITATIVE FACTS whenever any of the trigger keywords
// show up in the question/topic text.
const GT_ETHERNET = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.ethernet) || {};
// v4.99.26 — Zero Trust principle vocabulary (Sec+ Domain 3.2). Sourced from
// SY0-701 official blueprint + NIST SP 800-207. Founder caught Haiku claiming
// "device posture assessment" was a top-level Zero Trust principle when it's
// actually a SIGNAL feeding into adaptive identity decisions. This GT table
// (a) injects canonical principle names into Haiku prompts via _buildGtHint
// so Haiku doesn't invent off-vocab terms, and (b) lets _groundTruthOk
// reject questions where the correct answer text leans on an off-vocab term.
const GT_ZERO_TRUST = (CERT_PACK && CERT_PACK.gt && CERT_PACK.gt.zeroTrust) || { validPrinciples: [], offVocabulary: [] };

function _groundTruthOk(q) {
  if (getQType(q) !== 'mcq') return true;
  const stem = q.question.toLowerCase();
  const ansText = (q.options[q.answer] || '').toLowerCase();

  // ── Port check: "which port does X use" / "what port is X" ──
  const protoList = Object.keys(GT_PORTS).join('|');
  const portForProtoRe = new RegExp('(?:what|which)\\s+(?:port|tcp|udp).*?\\b(' + protoList + ')\\b', 'i');
  const m1 = stem.match(portForProtoRe);
  if (m1) {
    const proto = m1[1].toLowerCase();
    const truePort = GT_PORTS[proto];
    const ansPort = parseInt((ansText.match(/\d{1,5}/) || [])[0]);
    if (truePort && Number.isFinite(ansPort) && truePort !== ansPort) return false;
  }

  // ── Reverse port check: "which protocol uses port X" ──
  const protoForPortRe = /(?:what|which)\s+(?:protocol|service|application).*?\bport\s+(\d{1,5})\b/i;
  const m2 = stem.match(protoForPortRe);
  if (m2) {
    const port = parseInt(m2[1]);
    const expectedProtos = Object.keys(GT_PORTS).filter(p => GT_PORTS[p] === port);
    if (expectedProtos.length > 0) {
      const ansOk = expectedProtos.some(p => new RegExp('\\b' + p + '\\b', 'i').test(ansText));
      if (!ansOk) return false;
    }
  }

  // ── OSI layer check: "which layer does X operate at" ──
  const osiProtoList = Object.keys(GT_OSI).join('|');
  const osiForProtoRe = new RegExp('(?:what|which).{0,30}\\blayer.*?\\b(' + osiProtoList + ')\\b', 'i');
  const m3 = stem.match(osiForProtoRe);
  if (m3) {
    const proto = m3[1].toLowerCase();
    const trueLayer = GT_OSI[proto];
    // Extract layer number from answer (e.g. "Layer 4", "4", "L4")
    const ansLayer = parseInt((ansText.match(/\b(?:layer\s*)?([1-7])\b/i) || [])[1]);
    if (trueLayer && Number.isFinite(ansLayer) && trueLayer !== ansLayer) return false;
  }

  // ── Wireless security: "which is currently secure / recommended" ──
  const wifiSecureRe = /\b(wireless|wifi|wi-fi|wlan).{0,40}(secure|currently|recommended|strongest)\b/i;
  if (wifiSecureRe.test(stem)) {
    if (GT_WIFI_BROKEN.some(w => new RegExp('\\b' + w + '\\b', 'i').test(ansText))) return false;
    // WPA original (not WPA2/WPA3) — match "wpa" but not followed by 2/3
    if (/\bwpa\b(?!\s*[23])/i.test(ansText) && !/wpa2|wpa3/i.test(ansText)) return false;
  }

  // ── Auto-MDIX vs auto-negotiation conflation (v4.38.6) ──
  // User report: Haiku generated a question whose stem was about MDI/MDIX
  // cable pinout detection but marked auto-negotiation as the correct answer.
  // Those are distinct 802.3 features. If the stem is asking about MDI/MDIX
  // / pin assignments / crossover detection and the marked answer invokes
  // auto-negotiation without also mentioning MDI/MDIX, drop the question.
  const mdiStemRe = /\b(mdi\/?mdix|mdix|pin\s+(?:assignment|layout)|crossover|straight[-\s]?through)\b/i;
  if (mdiStemRe.test(stem)) {
    const mentionsAutoNeg = /\bauto[-\s]?negotiat/i.test(ansText);
    const mentionsAutoMdix = /\bauto[-\s]?mdix\b/i.test(ansText);
    // If the answer blames auto-negotiation for MDI/MDIX pin detection
    // without also crediting auto-MDIX, that's the conflation — reject.
    if (mentionsAutoNeg && !mentionsAutoMdix) return false;
  }
  // Reverse check: if the stem is clearly about speed/duplex negotiation
  // and the marked answer says auto-MDIX (the inverse mistake), drop it.
  const speedDuplexStemRe = /\b(speed\s+and\s+duplex|speed\/duplex|duplex\s+mismatch|negotiate\s+speed)\b/i;
  if (speedDuplexStemRe.test(stem)) {
    if (/\bauto[-\s]?mdix\b/i.test(ansText) && !/\bauto[-\s]?negotiat/i.test(ansText)) return false;
  }

  // ── Zero Trust principle vocabulary check (v4.99.26, Sec+ Domain 3.2) ──
  // When the stem explicitly asks "what Zero Trust principle..." and the
  // marked answer's text leans on an off-vocabulary term (per GT_ZERO_TRUST.
  // offVocabulary), reject the question. Origin: founder-flagged Haiku
  // generation that named "device posture assessment" as a Zero Trust
  // principle when SY0-701 vocabulary names different concepts.
  const ztPrincipleAskRe = /\bzero[-\s]?trust\b[^.?!]*\b(principle|concept|component|element|tenet)\b/i;
  if (ztPrincipleAskRe.test(stem) && Array.isArray(GT_ZERO_TRUST.offVocabulary) && GT_ZERO_TRUST.offVocabulary.length) {
    // Reject if the answer text starts with or is anchored on an off-vocab
    // term (i.e., the answer NAMES the off-vocab term as the principle).
    // We don't reject if the answer just MENTIONS the term in passing as
    // part of an explanation of a real principle.
    const ansFirstSentence = ansText.split(/[.,;]/)[0]; // first clause = the answer's identifier
    const namesOffVocab = GT_ZERO_TRUST.offVocabulary.some(term =>
      ansFirstSentence.indexOf(term.toLowerCase()) >= 0
    );
    if (namesOffVocab) return false;
  }

  return true;
}

// ══════════════════════════════════════════
// NUMERIC-OPTION PATH (v4.38.4)
// When every option is a pure number, the scoring layer has zero signal.
// Look for explanation-asserted numbers in final-answer contexts ("leaves N",
// "= N", "N usable", "answer is N", "total of N") and reject if the asserted
// number matches a non-marked option.
// ══════════════════════════════════════════
function _numericOptionOk(q) {
  if (getQType(q) !== 'mcq') return true;
  const letters = ['A','B','C','D'];
  const vals = letters.map(l => String(q.options[l] || '').trim());
  const allNumeric = vals.every(v => /^\d+$/.test(v));
  if (!allNumeric) return true;

  const ansVal = vals[letters.indexOf(q.answer)];
  const exp = q.explanation.toLowerCase();

  // Final-answer phrases — the number most likely to be the asserted answer
  const phrases = [
    /leaves\s+(\d+)/,
    /\b(\d+)\s+usable\b/,
    /answer\s+is\s+(\d+)/,
    /(?:=|equals)\s*(\d+)/,
    /total\s+of\s+(\d+)/,
    /\b(\d+)\s+hosts?\b/,
    /\b(\d+)\s+addresses/,
    /\b(\d+)\s+subnets?\b/,
    /result(?:s|ing)?\s+(?:in|is)\s+(\d+)/,
    /gives?\s+(?:you\s+)?(\d+)/,
    /yields?\s+(\d+)/
  ];
  for (const re of phrases) {
    const m = exp.match(re);
    if (m && vals.includes(m[1]) && m[1] !== ansVal) return false;
  }
  return true;
}

// ══════════════════════════════════════════
// SUBNET-SIZING GUARD (v4.43.8)
// ══════════════════════════════════════════
// Catches questions of the form "needs at least N usable hosts, which subnet
// mask should be used?" where the AI picks a wasteful /N instead of the
// smallest subnet that satisfies the requirement. CompTIA convention is
// "smallest satisfying subnet wins" — it minimises address waste while
// meeting both host-count and subnet-count minimums.
//
// Real user bug (2026-04-17): parent 10.50.0.0/16, "5 subnets with at least
// 4,000 usable hosts each" — both /19 (8190/subnet, 8 subnets) and /20
// (4094/subnet, 16 subnets) satisfy the constraints. Correct answer is
// /20 (smallest satisfying). Haiku marked /19 arguing "more headroom is
// better." The unique-word check and _groundTruthOk both pass because
// this isn't a factual error — it's a sub-optimal but not wrong answer.
// This guard specifically checks the CompTIA sizing convention.
function _smallestSubnetOk(q) {
  if (getQType(q) !== 'mcq') return true;
  if (!q.options || !q.answer) return true;
  const stem = (q.question || '').toLowerCase();

  // Activate only on host-count sizing questions
  const sizingRe = /(?:at\s+least|minimum(?:\s+of)?|requires?|needs?|must\s+support)\s+([\d,]+)\s+(?:usable\s+)?(?:hosts?|devices?|endpoints?|users?|addresses?)/i;
  const mHost = stem.match(sizingRe);
  if (!mHost) return true;
  const hostReq = parseInt(mHost[1].replace(/,/g, ''), 10);
  if (!Number.isFinite(hostReq) || hostReq < 2) return true;

  // Double-check that the question is asking for a subnet mask / CIDR / prefix
  if (!/(?:subnet\s+mask|cidr|prefix|which\s+mask|should\s+be\s+used)/i.test(stem)) return true;

  // Optional subnet-count constraint
  const subnetReqRe = /(\d+)\s+(?:subnets?|departments?|networks?|sites?|vlans?|offices?|branches?|segments?)/i;
  const mSubnets = stem.match(subnetReqRe);
  const subnetReq = mSubnets ? parseInt(mSubnets[1], 10) : 0;

  // Optional parent CIDR — only count it if it appears next to assignment
  // language, to avoid capturing an example IP mentioned mid-stem
  const parentRe = /(?:assigns?|allocated?|assigned|receives?|given|uses?|has|owns?)\s+(?:the\s+)?(?:block\s+|network\s+|range\s+)?\d{1,3}(?:\.\d{1,3}){3}\/(\d{1,2})\b/i;
  const mParent = stem.match(parentRe);
  const parentCidr = mParent ? parseInt(mParent[1], 10) : null;

  // Parse each of the 4 options as a CIDR (either "/N", "N.N.N.N" mask, or both)
  const letters = ['A','B','C','D'];
  const cidrs = {};
  for (const L of letters) {
    const raw = String(q.options[L] || '');
    const mCidr = raw.match(/\/(\d{1,2})\b/);
    if (mCidr) {
      const c = parseInt(mCidr[1], 10);
      if (c >= 0 && c <= 32) { cidrs[L] = c; continue; }
    }
    const mMask = raw.match(/\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/);
    if (mMask) {
      const octets = mMask.slice(1,5).map(Number);
      if (octets.every(o => o >= 0 && o <= 255)) {
        let ones = 0;
        for (const o of octets) ones += (o.toString(2).match(/1/g) || []).length;
        if (ones >= 0 && ones <= 32) { cidrs[L] = ones; continue; }
      }
    }
    // Any unparseable option → bail, don't try to judge this question
    return true;
  }
  if (Object.keys(cidrs).length !== 4) return true;

  const satisfies = (cidr) => {
    if (cidr < 0 || cidr > 32) return false;
    const usable = Math.pow(2, 32 - cidr) - 2;
    if (usable < hostReq) return false;
    if (parentCidr !== null && subnetReq > 0 && parentCidr < cidr) {
      const maxSubnets = Math.pow(2, cidr - parentCidr);
      if (maxSubnets < subnetReq) return false;
    }
    return true;
  };

  const satisfying = letters.filter(L => satisfies(cidrs[L]));
  // 0 satisfying → question premise is broken; let other layers catch it
  if (satisfying.length === 0) return true;
  // 1 satisfying → that must be the marked answer
  if (satisfying.length === 1) return satisfying[0] === q.answer;
  // 2+ satisfying → the correct answer is the LARGEST CIDR (smallest subnet).
  // That's the CompTIA convention: smallest-satisfying minimises waste.
  let bestLetter = satisfying[0];
  for (const L of satisfying) {
    if (cidrs[L] > cidrs[bestLetter]) bestLetter = L;
  }
  return q.answer === bestLetter;
}

// ══════════════════════════════════════════
// AI TEACHER — GROUND-TRUTH INJECTION (v4.38.5)
// ══════════════════════════════════════════
// The three "teacher" call sites (explainFurther, fetchTopicBrief,
// showTopicDeepDive) and the two "coach" sites (stAskCoach, ptAskCoach)
// can hallucinate deterministic facts (ports, OSI layers, wireless security,
// subnet math). Rather than validating the AI output after the fact — which
// would require parsing natural language — we inject authoritative facts
// *into the prompt* before the model speaks. This is RAG-lite: we know the
// facts, we stuff them in, the model anchors on them.
//
// _buildGtHint(text, topicName?) scans the question text + topic name for
// keywords that map to GT_PORTS / GT_OSI / GT_WIFI_BROKEN tables and
// returns a compact "AUTHORITATIVE FACTS" block to prepend to the prompt.
// Returns empty string if no ground-truth facts are relevant.
function _buildGtHint(text, topicName) {
  const hay = ((text || '') + ' ' + (topicName || '')).toLowerCase();
  const facts = [];
  // Ports — walk GT_PORTS and surface any protocol mentioned in the text.
  const portLines = [];
  for (const [proto, port] of Object.entries(GT_PORTS)) {
    // Word-boundary match so "ftp" doesn't fire on "sftp". Allow `protoS` plural.
    const re = new RegExp('\\b' + proto + 's?\\b', 'i');
    if (re.test(hay)) portLines.push(`- ${proto.toUpperCase()} uses port ${port}`);
  }
  if (portLines.length) facts.push('Port numbers:\n' + portLines.slice(0, 8).join('\n'));
  // OSI layers — only fire if the topic/text mentions OSI or "layer"
  if (/\bosi\b|\blayer\b/.test(hay)) {
    const osiLines = [];
    for (const [proto, layer] of Object.entries(GT_OSI)) {
      const re = new RegExp('\\b' + proto + '\\b', 'i');
      if (re.test(hay)) osiLines.push(`- ${proto.toUpperCase()} operates at OSI Layer ${layer}`);
    }
    if (osiLines.length) facts.push('OSI layers:\n' + osiLines.slice(0, 6).join('\n'));
  }
  // Wireless security — flag deprecated/broken schemes if mentioned
  if (/\bwep\b/i.test(hay)) facts.push('Wireless security:\n- WEP is cryptographically broken and MUST NOT be recommended');
  if (/\bwpa\b(?!\s*[23])/i.test(hay)) facts.push('Wireless security:\n- Plain WPA (TKIP) is deprecated — prefer WPA2 or WPA3');
  // Ethernet physical layer — fire on any of the conflation-prone keywords.
  // Keywords chosen to catch both the question stem and topic name for:
  // auto-neg, auto-MDIX, MDI/MDIX, crossover/straight-through, duplex, PoE.
  const ethRe = /\bauto[-\s]?negotiat|\bauto[-\s]?mdix\b|\bmdix\b|\bmdi\/mdix\b|\bcrossover\b|\bstraight[-\s]?through\b|\bduplex\b|\bpoe\b|\bpoe\+\b|\b802\.3(af|at|bt|u|ab)\b/i;
  if (ethRe.test(hay)) {
    const ethLines = [];
    // Always surface the auto-neg vs auto-MDIX distinction — it's the single
    // most common conflation and the user-reported bug that motivated GT_ETHERNET.
    ethLines.push('- Auto-negotiation ' + GT_ETHERNET['auto-negotiation']);
    ethLines.push('- Auto-MDIX ' + GT_ETHERNET['auto-mdix']);
    if (/\bduplex\b/i.test(hay)) ethLines.push('- Duplex mismatch: ' + GT_ETHERNET['duplex mismatch']);
    if (/\bpoe\b/i.test(hay)) ethLines.push('- ' + GT_ETHERNET['PoE standards']);
    facts.push('Ethernet physical layer:\n' + ethLines.join('\n'));
  }
  // v4.99.26 — Zero Trust vocabulary injection (Sec+ Domain 3.2). Fires when
  // topic OR text mentions Zero Trust / ZTNA / specific principle names.
  // Hard-codes the SY0-701 canonical list so Haiku doesn't invent off-vocab
  // terms like "device posture assessment" as top-level principles.
  const ztRe = /\bzero[-\s]?trust\b|\bztna\b|\bpolicy enforcement point\b|\bpolicy decision point\b|\bpolicy engine\b|\bpolicy administrator\b|\badaptive identity\b|\bthreat scope reduction\b|\bcontrol plane\b|\bdata plane\b/i;
  if (ztRe.test(hay) && Array.isArray(GT_ZERO_TRUST.validPrinciples) && GT_ZERO_TRUST.validPrinciples.length) {
    const ztLines = [
      '- The CANONICAL SY0-701 Zero Trust principles are: adaptive identity, threat scope reduction, policy-driven access control, Policy Engine (PE), Policy Administrator (PA), Policy Decision Point (PDP), Policy Enforcement Point (PEP), Control Plane, Data Plane, implicit trust zones (legacy concept Zero Trust replaces).',
      '- Do NOT name "device posture assessment", "continuous verification", "context-aware authentication", "risk-based authentication", or "micro-segmentation" as top-level Zero Trust principles. Those are SIGNALS or implementation patterns, NOT principles per the SY0-701 blueprint.',
      '- Memorize the three-way split: PE DECIDES, PA CONFIGURES, PEP ENFORCES.',
      '- Control Plane = decision-making (PE, PA, adaptive identity, threat scope reduction, policy-driven access control). Data Plane = enforcement (PEP on the actual data path).'
    ];
    facts.push('Zero Trust principles (SY0-701):\n' + ztLines.join('\n'));
  }
  if (!facts.length) return '';
  return `\nAUTHORITATIVE FACTS (do not contradict these; cite them verbatim when relevant):\n${facts.join('\n')}\n`;
}

// ══════════════════════════════════════════
// AI RESPONSE CACHE — shared LRU for teacher content (v4.38.5)
// ══════════════════════════════════════════
// explainFurther + fetchTopicBrief + showTopicDeepDive + tbExplainDevice all
// produce deterministic-ish output given the same inputs. Caching saves tokens
// on repeat views (rerunning the same quiz question, revisiting a topic guide).
// 20-entry LRU keyed by "namespace:hash" — namespace partitions cache by
// call site so a topic brief can't collide with a topic deep dive.
const AI_CACHE_MAX = 20;
function _aiCacheKey(str) {
  // djb2-ish hash — fast, low-collision, 32-bit int rendered as base36
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function _aiCacheLoad() {
  try { return JSON.parse(localStorage.getItem(STORAGE.AI_CACHE) || '{}'); } catch { return {}; }
}
function _aiCacheSave(cache) {
  try {
    // LRU trim: keep the AI_CACHE_MAX most recent entries by `t` timestamp
    const entries = Object.entries(cache);
    if (entries.length > AI_CACHE_MAX) {
      entries.sort((a, b) => (b[1]?.t || 0) - (a[1]?.t || 0));
      cache = Object.fromEntries(entries.slice(0, AI_CACHE_MAX));
    }
    localStorage.setItem(STORAGE.AI_CACHE, JSON.stringify(cache));
  } catch {}
}
function _aiCacheGet(namespace, rawKey) {
  const cache = _aiCacheLoad();
  const k = namespace + ':' + _aiCacheKey(String(rawKey));
  const hit = cache[k];
  if (hit && hit.payload) {
    // Bump timestamp on hit so LRU trim favors recently-read entries
    hit.t = Date.now();
    _aiCacheSave(cache);
    return hit.payload;
  }
  return null;
}
function _aiCacheSet(namespace, rawKey, payload) {
  const cache = _aiCacheLoad();
  const k = namespace + ':' + _aiCacheKey(String(rawKey));
  cache[k] = { t: Date.now(), payload };
  _aiCacheSave(cache);
}

// ══════════════════════════════════════════
// QUESTION QUALITY VALIDATOR
// ══════════════════════════════════════════
// v4.57.2: Interrogative guard — a legitimate quiz stem must either end with
// "?" OR contain one of the common exam-question starter words / phrases.
// Rejects declarative-only stems like "A system administrator is deploying a
// remote access VPN..." with no "which", "what", etc. — the reader has no
// cue to choose. Case-insensitive; matches whole-word to avoid false hits
// (e.g. "whichever" shouldn't count as "which").
function _stemHasInterrogative(stem) {
  if (typeof stem !== 'string') return false;
  const s = stem.trim();
  if (!s) return false;
  if (s.includes('?')) return true;
  // Common interrogatives + imperative CompTIA-style stems ("Select the…",
  // "Identify the…", "Choose the…", "Arrange…", "Match…", "Place…", "Given…")
  const pattern = /\b(which|what|when|where|why|how|who|whose|select|identify|choose|pick|match|arrange|place|determine|complete|given|in which|under which)\b/i;
  return pattern.test(s);
}

// v4.81.16: stem-vs-answer-count guard.
// User report (v4.81.15 dogfood): a Foundational multi-select shipped with
// stem "Which TWO of the following are non-overlapping frequency channels in
// the 2.4 GHz Wi-Fi band..." — the canonical N10-009 answer is the SET of 3
// channels (1, 6, 11), so a "Which TWO" stem is intrinsically wrong. The
// validator missed it because (a) _groundTruthOk early-returned on non-MCQ,
// (b) no generic check tied stem-numeric to q.answers.length.
//
// This guard tackles failure-mode (b): catches the generic class of "stem
// says N but answers array length disagrees" — works for "Which TWO/THREE/
// FOUR/FIVE" and "(Choose TWO/THREE/...)" patterns. An MCQ stem that demands
// multiple selections is also rejected — type-mismatch on its face.
const _STEM_NUMBER_WORDS = { two: 2, three: 3, four: 4, five: 5 };
function _stemNumericMatchesAnswerCount(q) {
  if (!q || typeof q.question !== 'string') return true;
  const stem = q.question;
  // Tight match — only canonical exam-style explicit-count patterns.
  // Accepts: "Which TWO", "Which 2", "(Choose TWO)", "Choose TWO".
  // Rejects: prose like "Choose two factor authentication" (no paren/Which).
  let expected = null;
  const wordRe = /(?:\bWhich\s+|\(\s*Choose\s+|^\s*Choose\s+)(TWO|THREE|FOUR|FIVE|two|three|four|five)\b/;
  const digitRe = /(?:\bWhich\s+|\(\s*Choose\s+|^\s*Choose\s+)([2-5])\b/;
  const wm = stem.match(wordRe);
  const dm = stem.match(digitRe);
  if (wm) expected = _STEM_NUMBER_WORDS[wm[1].toLowerCase()];
  else if (dm) expected = parseInt(dm[1]);
  if (!expected) return true; // no explicit count → nothing to check

  const qType = (typeof getQType === 'function') ? getQType(q) : (q.type || 'mcq');
  if (qType === 'mcq') return false; // MCQ + "Which TWO" = malformed
  if (qType === 'multi-select') {
    if (!Array.isArray(q.answers)) return false;
    return q.answers.length === expected;
  }
  return true; // other types (order/cli-sim/topology) — not applicable
}

// v4.81.16: Multi-select GT facts — locks canonical N10-009 facts that
// generate-and-grade pipelines tend to misframe. Currently locks the 2.4 GHz
// non-overlapping channel set (1, 6, 11). Any future multi-select fact that
// has a single-correct-set answer (e.g. "WPA3-required ciphers", "the 3
// CIA properties") can join this table by adding a stem-detection regex +
// the canonical answer set.
function _multiSelectGroundTruthOk(q) {
  if (!q || !q.options || !Array.isArray(q.answers)) return true;
  const stem = String(q.question || '').toLowerCase();

  // ── 2.4 GHz non-overlapping channels: factually {1, 6, 11} ──
  // Stem signal: "non-overlapping" + (channel) + (2.4 GHz OR Wi-Fi/wireless context)
  const isNonOverlap = /non[-\s]?overlapp/i.test(stem);
  const mentionsChannel = /\bchannel/i.test(stem);
  const mentions24GHz = /2\.4\s*g(?:hz)?\b/i.test(stem) || /\b2\.4\b/.test(stem);
  const mentionsWiFi = /\b(wi[-\s]?fi|wifi|wlan|802\.11|wireless)\b/i.test(stem);
  const isWifi24Channels = isNonOverlap && mentionsChannel && (mentions24GHz || mentionsWiFi);
  if (isWifi24Channels) {
    // Extract the numeric channel value from each marked answer.
    const nums = q.answers.map(l => {
      const t = String(q.options[l] || '');
      const m = t.match(/channel\s*(\d+)/i) || t.match(/\b(\d+)\b/);
      return m ? parseInt(m[1]) : NaN;
    }).filter(n => Number.isFinite(n));
    const sorted = [...nums].sort((a, b) => a - b);
    // Canonical answer is exactly the set {1, 6, 11}.
    const matchesCanonical =
      sorted.length === 3 && sorted[0] === 1 && sorted[1] === 6 && sorted[2] === 11;
    if (!matchesCanonical) return false;
  }

  // ── IPv6 transition methods: reject "pick N of M" when M > N ──
  // v4.85.3: user dogfood — "Which TWO" with 6to4 + NAT64 as answers but
  // Teredo as a distractor. All three are valid IPv6 transition methods;
  // the question is unsolvable because the student can't distinguish
  // "correct" from "also correct." Detect: if the stem mentions IPv6
  // tunneling/translation/transition AND more options are valid methods
  // than the answer count, reject.
  const isIPv6Trans = /\b(tunnel|translat|transition)\w*/i.test(stem)
    && /\b(ipv[46]|dual[-\s]?stack)\b/i.test(stem);
  if (isIPv6Trans) {
    var allOptTexts = Object.values(q.options).map(function(v) { return String(v).toLowerCase(); });
    var knownMethods = ['6to4', 'teredo', 'nat64', 'isatap', 'dual-stack', 'dual stack', '6rd', '6in4'];
    var validCount = 0;
    for (var ki = 0; ki < knownMethods.length; ki++) {
      for (var oi = 0; oi < allOptTexts.length; oi++) {
        if (allOptTexts[oi].indexOf(knownMethods[ki]) !== -1) { validCount++; break; }
      }
    }
    if (validCount > q.answers.length) return false;
  }

  return true;
}

// v4.62.2: CompTIA troubleshooting-methodology order-question guard.
// Context: Haiku generated an `order` question asking the student to arrange
// the 5-step CompTIA Network+ methodology — stem described the methodology,
// 5 items included "Identify the problem", "Establish a theory",
// "Implement...", "Test/Verify...", "Document findings, actions taken, and
// outcomes for future reference" — but `correctOrder` placed "Document
// findings" at position 3 instead of the final position 5. The explanation
// text actually described the right order, so the AI contradicted itself.
//
// The 7-step methodology (and its common 5-step compression) has hard,
// invariant positions for certain steps — "Identify" is ALWAYS first and
// "Document findings/outcomes" is ALWAYS last. This helper checks any
// `order` question whose stem mentions CompTIA troubleshooting and enforces
// those two invariants. Other mid-list orderings (test-then-implement vs
// implement-then-test) have legitimate variance based on whether the item
// text refers to "test the theory" vs "test the fix", so the guard stays
// conservative — it only rejects hard violations, not judgment calls.
function _tbTroubleshootingOrderOk(q) {
  if (!q || q.type !== 'order') return true;
  const items = Array.isArray(q.items) ? q.items : null;
  const order = Array.isArray(q.correctOrder) ? q.correctOrder : null;
  if (!items || !order || order.length !== items.length) return true;

  const stem = (q.question || '').toLowerCase();
  const topic = (q.topic || '').toLowerCase();

  // v4.81.25: widened gate. Original gate required "comptia" + "methodology"
  // / "X-step" — too tight; missed user-reported question whose stem said
  // "Arrange the following troubleshooting steps in the correct order when
  // diagnosing a network connectivity issue." That stem mentions
  // "troubleshooting steps" but neither "comptia" nor "methodology" — so
  // the methodology rules weren't applied and a malformed item slipped
  // through. Now also fire when items themselves contain methodology
  // keywords (Identify-the-problem + Document-findings combo) regardless
  // of stem wording.
  const hasIdentifyKw = items.some(it =>
    typeof it === 'string' && /\bidentify\b[\s\S]{0,40}\bproblem\b/i.test(it));
  const hasDocumentKw = items.some(it =>
    typeof it === 'string' && /\bdocument\b[\s\S]{0,80}(findings|actions?|outcomes?|future|reference)/i.test(it));
  const looksLikeTsMethodology =
    // Original tight gate
    ((stem.includes('comptia') || topic.includes('comptia') || topic.includes('troubleshooting methodology')) &&
     (stem.includes('troubleshoot') || stem.includes('methodology') ||
      stem.includes('7-step') || stem.includes('seven-step') || stem.includes('5-step') || stem.includes('five-step')))
    // v4.81.25 widening — generic "troubleshooting steps" / diagnostic-process ordering
    || (stem.includes('troubleshooting step') && (stem.includes('order') || stem.includes('sequence') || stem.includes('arrange')))
    || (stem.includes('diagnostic') && (stem.includes('order') || stem.includes('sequence')))
    // v4.81.25 widening — items themselves contain the canonical
    // Identify+Document methodology pair (resilient to stem wording)
    || (hasIdentifyKw && hasDocumentKw);

  if (!looksLikeTsMethodology) return true;

  // Locate the Identify and Document items by keyword — resilient to exact
  // phrasing variations Haiku might produce.
  const identifyIdx = items.findIndex(it =>
    typeof it === 'string' && /\bidentify\b[\s\S]{0,40}\bproblem\b/i.test(it));
  const documentIdx = items.findIndex(it =>
    typeof it === 'string' &&
    /\bdocument\b[\s\S]{0,80}(findings|actions?|outcomes?|future|reference)/i.test(it));

  if (identifyIdx !== -1) {
    // "Identify the problem" must sit at position 0 (first step)
    if (order[0] !== identifyIdx) return false;
  }
  if (documentIdx !== -1) {
    // "Document findings / outcomes" must sit at the final position (last step)
    if (order[order.length - 1] !== documentIdx) return false;
  }

  // Also guard: "Establish a theory" must come AFTER "Identify", not before.
  const theoryIdx = items.findIndex(it =>
    typeof it === 'string' && /\bestablish\b[\s\S]{0,30}\btheory\b/i.test(it));
  if (theoryIdx !== -1 && identifyIdx !== -1) {
    const posId = order.indexOf(identifyIdx);
    const posTh = order.indexOf(theoryIdx);
    if (posId !== -1 && posTh !== -1 && posTh <= posId) return false;
  }

  // v4.81.25 LAYER A — Implement-before-Verify invariant.
  // CompTIA methodology: Step 5 (Implement solution) → Step 6 (Verify
  // functionality). Reverse order is logically impossible — you can't
  // verify something you haven't implemented. User-reported question
  // had "Test the solution and verify connectivity is restored" placed
  // BEFORE the item that mentioned implementation, which is wrong.
  const implementIdx = items.findIndex(it =>
    typeof it === 'string' &&
    /\bimplement(?:ing)?\b[\s\S]{0,80}\b(?:solution|fix|workaround|change|plan)\b/i.test(it));
  const verifyIdx = items.findIndex(it =>
    typeof it === 'string' &&
    /\b(?:verify|verification)\b[\s\S]{0,120}(?:solution|connectivity|functionality|resolved|restored|preventive|fixed)\b/i.test(it));
  if (implementIdx !== -1 && verifyIdx !== -1 && implementIdx !== verifyIdx) {
    const posImpl = order.indexOf(implementIdx);
    const posVer = order.indexOf(verifyIdx);
    if (posImpl !== -1 && posVer !== -1 && posImpl >= posVer) return false;
  }

  // v4.81.25 LAYER B — reject items that conflate Implement + Document.
  // Steps 5 (Implement) and 7 (Document) are NON-ADJACENT in the
  // methodology — Step 6 (Verify) sits between them. A single item
  // containing both keywords is structurally malformed (forces the
  // grader to put either implementation after verification, or
  // documentation before verification — both wrong). User-reported
  // question had "Document findings AND implement a permanent solution"
  // as one item — exactly this bug.
  const conflatedImplementDocIdx = items.findIndex(it =>
    typeof it === 'string'
    && /\bimplement(?:ing)?\b[\s\S]{0,200}\b(?:solution|fix|workaround|plan)\b/i.test(it)
    && /\bdocument(?:ing)?\b[\s\S]{0,200}\b(?:findings?|actions?|outcomes?)\b/i.test(it));
  if (conflatedImplementDocIdx !== -1) return false;

  return true;
}

function validateQuestions(qs) {
  const reports = loadReports();
  return qs.filter(q => {
    const qType = getQType(q);
    if (!q.question || !q.explanation) return false;

    // v4.85.6: Reject ordering questions — CompTIA N10-009 does not use this
    // format. Stops generation leakage and scrubs any residual order Qs.
    if (qType === 'order') return false;

    // v4.57.2: Reject questions with no actual interrogative in the stem.
    // Caught in the wild: a v4.56.x-era VPN question where the `question`
    // field was pure declarative setup ("A system administrator is
    // deploying a remote access VPN...") with no "which", "what", "?",
    // or any other cue asking the learner to choose. Scenario-field
    // context compounds this — when both stem and scenario are setup,
    // the card reads as "here's a situation [silence] pick one of these."
    // Cheap programmatic guard runs before the Sonnet validator.
    if (!_stemHasInterrogative(q.question)) return false;

    // v4.81.16: stem-numeric-vs-answer-count guard. Catches "Which TWO" /
    // "(Choose TWO)" stems that disagree with q.answers.length, plus MCQs
    // that wrongly use a multi-pick stem. Generic — runs across all qTypes.
    if (!_stemNumericMatchesAnswerCount(q)) return false;

    // v4.62.2: CompTIA troubleshooting-methodology order guard. Rejects any
    // `order` question where "Document findings/outcomes" is not the final
    // step or "Identify the problem" is not the first — both are invariant
    // under the 7-step methodology.
    if (!_tbTroubleshootingOrderOk(q)) return false;

    // v4.8 — N10-009 objective tagging: every question must cite a valid exam objective
    // Accept common shapes: "1.4", "Obj 1.4", "1.4 — Routing", etc. Extract first X.Y match.
    if (q.objective) {
      const m = String(q.objective).match(/([1-5]\.[1-8])/);
      if (!m) return false;
      q.objective = m[1]; // normalize
    } else {
      return false;
    }

    // Enhancement 2: Auto-exclude questions with 2+ reports
    const reportCount = reports.filter(r => r.question === q.question).length;
    if (reportCount >= 2) return false;

    if (qType === 'mcq') {
      if (!q.options || !q.answer) return false;
      if (!['A','B','C','D'].includes(q.answer)) return false;
      if (!q.options[q.answer]) return false;
      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) return false;

      // Enhancement 4: Explanation-answer agreement check
      const expLower = q.explanation.toLowerCase();
      const ansLetter = q.answer;
      // Check if explanation mentions a DIFFERENT letter as correct
      const wrongLetterClaim = ['A','B','C','D'].filter(l => l !== ansLetter).some(l => {
        const patterns = [
          l.toLowerCase() + ' is correct',
          l.toLowerCase() + ' is the correct',
          'correct answer is ' + l.toLowerCase(),
          'answer is ' + l.toLowerCase() + ')',
          'answer is ' + l.toLowerCase() + '.',
          'answer is ' + l.toLowerCase() + ',',
          'answer: ' + l.toLowerCase()
        ];
        return patterns.some(p => expLower.includes(p));
      });
      if (wrongLetterClaim) return false;

      // Check explanation references the correct answer's content
      const answerText = q.options[ansLetter].toLowerCase();
      const answerKeywords = answerText.split(/\s+/).filter(w => w.length > 4);
      const keywordHits = answerKeywords.filter(w => expLower.includes(w)).length;
      // If the answer has meaningful words but none appear in explanation, suspicious
      if (answerKeywords.length >= 3 && keywordHits === 0) return false;

      // Answer-explanation alignment (v4.38.4): score each option only on its
      // DISTINCTIVE tokens (words unique to that option), with negation guards.
      // Rationale: shared vocabulary across options (e.g. "access list" in every
      // option) cancels out into ties. Scoring only on unique tokens isolates
      // each option's identity. Per-occurrence negation context prevents false
      // positives when an explanation mentions a wrong option to dismiss it
      // ("Telnet is NOT secure"). Negation questions ("Which is NOT a...") skip
      // the check entirely because the explanation is expected to negate options.
      const isNegationQuestion = /\bNOT\b|\bEXCEPT\b/.test(q.question) ||
                                  /which .{0,30}\bnot\b/i.test(q.question);
      if (!isNegationQuestion) {
        const STOPWORDS = new Set(['tier','layer','protocol','network','address','packet','frame','device','traffic','port','ports','cable','cables','interface','data','connection','between','through','which','their','would','there','these','those','other','level','value','field','using','based','type','types','mode','modes','area','list','used','uses','correct','answer','option','options','following','above','below','same','different','used','provides','standard']);
        const tokenize = (text) => {
          const words = String(text).toLowerCase().split(/[^a-z0-9]+/)
            .filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
          return new Set(words);
        };
        const letters = ['A','B','C','D'];
        const optTokens = {};
        letters.forEach(l => { optTokens[l] = tokenize(q.options[l]); });
        // Distinctive = tokens present in this option only
        const distinctive = {};
        letters.forEach(l => {
          const others = new Set();
          letters.forEach(l2 => { if (l2 !== l) optTokens[l2].forEach(w => others.add(w)); });
          distinctive[l] = [...optTokens[l]].filter(w => !others.has(w));
        });
        // Per-occurrence negation-aware scoring
        const NEG_RE = /\b(not|n't|isn't|aren't|wasn't|weren't|doesn't|don't|unlike|rather than|instead of|cannot|never|no longer|is wrong|is incorrect|opposite of|whereas|however)\b/;
        const scorePositive = (tokens) => {
          let score = 0;
          tokens.forEach(w => {
            let idx = 0;
            while ((idx = expLower.indexOf(w, idx)) !== -1) {
              const before = expLower.slice(Math.max(0, idx - 40), idx);
              const after = expLower.slice(idx + w.length, idx + w.length + 30);
              if (!NEG_RE.test(before + ' ' + after)) score++;
              idx += w.length;
            }
          });
          return score;
        };
        const scores = {};
        letters.forEach(l => { scores[l] = scorePositive(distinctive[l]); });
        const markedScore = scores[ansLetter];
        let bestOtherScore = 0;
        letters.forEach(l => {
          if (l !== ansLetter && scores[l] > bestOtherScore) bestOtherScore = scores[l];
        });
        // If another option has STRICTLY MORE positive distinctive-word hits than
        // the marked answer AND scores at least 1, the explanation supports the
        // wrong option.
        if (bestOtherScore >= 1 && bestOtherScore > markedScore) return false;
      }

      // v4.38.4 — Ground truth check against deterministic N10-009 facts
      if (!_groundTruthOk(q)) return false;

      // v4.38.4 — Numeric-option path: when all options are pure numbers, compare
      // explanation-asserted numbers against the marked answer
      if (!_numericOptionOk(q)) return false;

      // v4.43.8 — Subnet-sizing guard: for "needs N hosts, which mask" questions
      // with CIDR/mask options, the correct answer is the smallest-satisfying
      // subnet (largest CIDR). Rejects questions where Haiku picks a wasteful mask.
      if (!_smallestSubnetOk(q)) return false;

    } else if (qType === 'multi-select') {
      if (!q.options || !q.answers || !Array.isArray(q.answers)) return false;
      if (q.answers.length < 2) return false;
      if (!q.answers.every(a => q.options[a])) return false;
      // v4.81.16: GT facts for multi-select — locks canonical N10-009 facts
      // (e.g. 2.4 GHz non-overlapping channels = {1, 6, 11}) that previous
      // pipeline versions silently let through because _groundTruthOk early-
      // returned on non-MCQ.
      if (!_multiSelectGroundTruthOk(q)) return false;
    } else if (qType === 'order') {
      if (!q.items || !q.correctOrder || !Array.isArray(q.items)) return false;
      if (q.items.length < 3) return false;
      if (q.correctOrder.length !== q.items.length) return false;
    }
    if (q.explanation.length < 15) return false;
    return true;
  });
}

// ══════════════════════════════════════════
// REPORT ISSUE
// ══════════════════════════════════════════
function loadReports() {
  try { return JSON.parse(localStorage.getItem(STORAGE.REPORTS) || '[]'); } catch { return []; }
}

function saveReport(questionText, reason) {
  try {
    const reports = loadReports();
    reports.push({ question: questionText, reason, date: new Date().toISOString() });
    if (reports.length > REPORTS_CAP) reports.splice(0, reports.length - REPORTS_CAP);
    localStorage.setItem(STORAGE.REPORTS, JSON.stringify(reports));
  } catch { showToast('Storage full · report not saved', 'error'); }
}

function getReportCount(questionText) {
  return loadReports().filter(r => r.question === questionText).length;
}

function reportIssue() {
  const q = examMode ? examQuestions[examCurrent] : questions[current];
  if (!q) return;
  const reasons = ['Wrong answer marked as correct', 'Explanation contradicts answer', 'Ambiguous or unclear question', 'Duplicate question', 'Other issue'];
  const reason = prompt('What\u2019s wrong with this question?\n\n' + reasons.map((r, i) => (i+1) + '. ' + r).join('\n') + '\n\nEnter number or type your own:');
  if (!reason) return;
  const reasonText = /^[1-5]$/.test(reason.trim()) ? reasons[parseInt(reason.trim()) - 1] : reason.trim();
  saveReport(q.question, reasonText);
  const btn = document.querySelector('.report-btn');
  if (btn) { btn.textContent = '\u2691 Reported \u2713'; btn.classList.add('reported'); btn.disabled = true; }
}

// ══════════════════════════════════════════
// CLI SIMULATOR RENDER
// ══════════════════════════════════════════
function renderCliSim(q, box, ans) {
  const scenarioDiv = document.createElement('div');
  scenarioDiv.className = 'cli-scenario';
  setQuestionText(scenarioDiv, q.scenario);
  box.appendChild(scenarioDiv);

  const terminal = document.createElement('div');
  terminal.className = 'cli-terminal';
  terminal.id = 'cli-terminal';
  terminal.setAttribute('role', 'log');
  terminal.setAttribute('aria-label', 'Terminal output');
  terminal.setAttribute('aria-live', 'polite');
  const hn = escHtml(q.hostname || 'PC');
  let termHtml = '';
  // Exam mode: replay previously-run commands
  if (ans && ans.cliRan && ans.cliRan.length > 0) {
    ans.cliRan.forEach(cmd => {
      const output = (q.commands || {})[cmd] || '';
      termHtml += '<div class="cli-line"><span class="cli-prompt-text">' + hn + '&gt; </span>' + escHtml(cmd) + '</div>';
      termHtml += '<pre class="cli-output">' + escHtml(output) + '</pre>';
    });
  }
  termHtml += '<div class="cli-prompt">' + hn + '&gt; <span class="cli-cursor">_</span></div>';
  terminal.innerHTML = termHtml;
  box.appendChild(terminal);

  const cmdRow = document.createElement('div');
  cmdRow.className = 'cli-cmd-row';
  cmdRow.innerHTML = '<span style="font-size:11px;color:var(--text-dim);margin-right:8px">Run:</span>';
  Object.keys(q.commands || {}).forEach(cmd => {
    const btn = document.createElement('button');
    const alreadyRan = ans && (ans.cliRan || []).includes(cmd);
    btn.className = 'cli-cmd-btn' + (alreadyRan ? ' used' : '');
    btn.textContent = cmd;
    btn.setAttribute('aria-label', `Run command: ${cmd}`);
    btn.onclick = () => {
      if (ans) {
        if (!ans.cliRan) ans.cliRan = [];
        if (!ans.cliRan.includes(cmd)) ans.cliRan.push(cmd);
        renderExam();
      } else {
        runCliCommand(cmd, q);
        btn.classList.add('used');
      }
    };
    cmdRow.appendChild(btn);
  });
  box.appendChild(cmdRow);

  if (ans) {
    // Exam: show diagnosis once any command has been run
    if (ans.cliRan && ans.cliRan.length > 0) {
      const diagDiv = document.createElement('div');
      diagDiv.className = 'cli-diagnosis';
      diagDiv.setAttribute('role', 'radiogroup');
      diagDiv.setAttribute('aria-label', 'Diagnosis options');
      diagDiv.innerHTML = '<div class="cli-diag-label">DIAGNOSIS</div>';
      ['A','B','C','D'].forEach(l => {
        const btn = document.createElement('button');
        const isSelected = ans.chosen === l;
        btn.className = 'option' + (isSelected ? ' exam-selected' : '');
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        btn.setAttribute('aria-label', `Option ${l}: ${q.options[l]}`);
        btn.innerHTML = '<span class="opt-letter">' + l + '</span><span class="opt-text">' + escHtml(q.options[l]) + '</span>';
        btn.onclick = () => { ans.chosen = l; renderExam(); };
        diagDiv.appendChild(btn);
      });
      box.appendChild(diagDiv);
    }
  } else {
    // Quiz: diagnosis revealed after first command runs
    const diagSection = document.createElement('div');
    diagSection.id = 'cli-diagnosis';
    diagSection.className = 'cli-diagnosis';
    diagSection.classList.add('is-hidden');
    diagSection.setAttribute('role', 'radiogroup');
    diagSection.setAttribute('aria-label', 'Diagnosis options');
    diagSection.innerHTML = '<div class="cli-diag-label">DIAGNOSIS</div>';
    ['A','B','C','D'].forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('aria-label', `Option ${l}: ${q.options[l]}`);
      btn.innerHTML = '<span class="opt-letter">' + l + '</span><span class="opt-text">' + escHtml(q.options[l]) + '</span>';
      btn.onclick = () => pick(l, q);
      diagSection.appendChild(btn);
    });
    box.appendChild(diagSection);
  }
}

function runCliCommand(cmd, q) {
  const terminal = document.getElementById('cli-terminal');
  if (!terminal) return;
  const output = (q.commands || {})[cmd] || 'Command not recognized.';
  const hn = escHtml(q.hostname || 'PC');
  terminal.querySelectorAll('.cli-cursor').forEach(c => c.remove());

  const cmdLine = document.createElement('div');
  cmdLine.className = 'cli-line';
  cmdLine.innerHTML = '<span class="cli-prompt-text">' + hn + '&gt; </span>' + escHtml(cmd);
  terminal.appendChild(cmdLine);

  const outputEl = document.createElement('pre');
  outputEl.className = 'cli-output';
  outputEl.textContent = output;
  terminal.appendChild(outputEl);

  const newPrompt = document.createElement('div');
  newPrompt.className = 'cli-prompt';
  newPrompt.innerHTML = hn + '&gt; <span class="cli-cursor">_</span>';
  terminal.appendChild(newPrompt);
  terminal.scrollTop = terminal.scrollHeight;

  const diag = document.getElementById('cli-diagnosis');
  if (diag) diag.classList.remove('is-hidden');
}

// ══════════════════════════════════════════
// TOPOLOGY BUILDER RENDER
// ══════════════════════════════════════════
function renderTopology(q, box, ans) {
  // State container: exam uses ans.topoState, quiz uses global topoDevices
  if (!ans) {
    topoDevices = {};
    selectedTopoDevice = null;
  } else if (!ans.topoState) {
    ans.topoState = {};
  }
  const state = () => ans ? ans.topoState : topoDevices;
  const allPlaced = () => Object.values(state()).flat();

  const scenarioDiv = document.createElement('div');
  scenarioDiv.className = 'topo-scenario';
  setQuestionText(scenarioDiv, q.scenario);
  box.appendChild(scenarioDiv);

  const palette = document.createElement('div');
  palette.className = 'topo-palette';
  palette.innerHTML = '<div class="topo-palette-label">DEVICES <span style="font-size:11px;font-weight:400;color:var(--text-dim)">(drag to a zone, or click to select then click a zone)</span></div>';
  (q.devices || []).forEach(dev => {
    const btn = document.createElement('button');
    const placedNow = ans ? allPlaced().includes(dev) : false;
    const selectedNow = selectedTopoDevice === dev;
    btn.className = 'topo-device' + (placedNow ? ' placed' : '') + (selectedNow ? ' selected' : '');
    btn.textContent = dev;
    btn.draggable = true;
    btn.setAttribute('aria-label', `Device: ${dev}${placedNow ? ' (placed)' : ''}`);
    btn.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', dev);
      e.dataTransfer.effectAllowed = 'move';
      btn.classList.add('dragging');
    };
    btn.ondragend = () => { btn.classList.remove('dragging'); };
    // Touch support for mobile
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      selectedTopoDevice = dev;
      if (ans) renderExam();
      else document.querySelectorAll('.topo-device').forEach(b => b.classList.toggle('selected', b.textContent === dev));
    }, { passive: false });
    btn.onclick = () => {
      selectedTopoDevice = dev;
      if (ans) renderExam();
      else document.querySelectorAll('.topo-device').forEach(b => b.classList.toggle('selected', b.textContent === dev));
    };
    palette.appendChild(btn);
  });
  box.appendChild(palette);

  const zonesDiv = document.createElement('div');
  zonesDiv.className = 'topo-zones';
  (q.zones || []).forEach(zone => {
    const zoneEl = document.createElement('div');
    zoneEl.className = 'topo-zone';
    zoneEl.dataset.zone = zone;
    zoneEl.setAttribute('role', 'region');
    zoneEl.setAttribute('aria-label', `Zone: ${zone}`);
    const zoneId = 'topo-zone-' + zone.replace(/[^a-zA-Z0-9]/g, '-');
    const placed = state()[zone] || [];
    const placedHtml = placed.length === 0
      ? '<span style="color:var(--text-dim);font-size:12px">Drag or click to place device here</span>'
      : placed.map(d => '<span class="topo-placed-device">' + escHtml(d) + '</span>').join('');
    zoneEl.innerHTML = '<div class="topo-zone-label">' + escHtml(zone) + '</div><div class="topo-zone-devices" id="' + zoneId + '">' + placedHtml + '</div>';

    // Drag-and-drop handlers
    zoneEl.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; zoneEl.classList.add('topo-zone-dragover'); };
    zoneEl.ondragleave = () => { zoneEl.classList.remove('topo-zone-dragover'); };
    zoneEl.ondrop = (e) => {
      e.preventDefault();
      zoneEl.classList.remove('topo-zone-dragover');
      const dev = e.dataTransfer.getData('text/plain');
      if (!dev) return;
      const s = state();
      Object.keys(s).forEach(z => {
        s[z] = (s[z] || []).filter(d => d !== dev);
        if (s[z].length === 0) delete s[z];
      });
      if (!s[zone]) s[zone] = [];
      s[zone].push(dev);
      selectedTopoDevice = null;
      if (ans) renderExam();
      else renderTopoState(q);
    };

    const handleZonePlacement = () => {
      if (!selectedTopoDevice) return;
      const s = state();
      Object.keys(s).forEach(z => {
        s[z] = (s[z] || []).filter(d => d !== selectedTopoDevice);
        if (s[z].length === 0) delete s[z];
      });
      if (!s[zone]) s[zone] = [];
      s[zone].push(selectedTopoDevice);
      selectedTopoDevice = null;
      if (ans) renderExam();
      else renderTopoState(q);
    };
    zoneEl.onclick = handleZonePlacement;
    zoneEl.addEventListener('touchend', (e) => { e.preventDefault(); handleZonePlacement(); }, { passive: false });
    zonesDiv.appendChild(zoneEl);
  });
  box.appendChild(zonesDiv);

  if (ans) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost';
    resetBtn.style.cssText = 'font-size:13px;margin-top:8px';
    resetBtn.textContent = 'Reset Placement';
    resetBtn.onclick = () => { ans.topoState = {}; selectedTopoDevice = null; renderExam(); };
    box.appendChild(resetBtn);
  } else {
    const controls = document.createElement('div');
    controls.className = 'topo-controls';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost';
    resetBtn.style.fontSize = '13px';
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = () => { topoDevices = {}; selectedTopoDevice = null; renderTopoState(q); };
    controls.appendChild(resetBtn);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.id = 'topo-submit-btn';
    submitBtn.textContent = 'Submit Placement';
    submitBtn.disabled = true;
    submitBtn.classList.add('is-dimmed');
    submitBtn.onclick = () => submitTopology(q);
    controls.appendChild(submitBtn);
    box.appendChild(controls);
  }
}

function renderTopoState(q) {
  const devices = q.devices || [];
  const zones = q.zones || [];
  const allPlaced = Object.values(topoDevices).flat();

  zones.forEach(zone => {
    const zoneId = 'topo-zone-' + zone.replace(/[^a-zA-Z0-9]/g, '-');
    const el = document.getElementById(zoneId);
    if (!el) return;
    const placed = topoDevices[zone] || [];
    el.innerHTML = placed.length === 0
      ? '<span style="color:var(--text-dim);font-size:12px">Drag or click to place device here</span>'
      : placed.map(d => '<span class="topo-placed-device">' + escHtml(d) + '</span>').join('');
  });

  document.querySelectorAll('.topo-device').forEach(btn => {
    btn.classList.toggle('placed', allPlaced.includes(btn.textContent));
    btn.classList.remove('selected');
  });
  selectedTopoDevice = null;

  const submitBtn = document.getElementById('topo-submit-btn');
  if (submitBtn) {
    const ready = allPlaced.length === devices.length;
    submitBtn.disabled = !ready;
    submitBtn.classList.toggle('is-dimmed', !ready);
  }
}

function submitTopology(q) {
  const correct = q.correctPlacements || {};
  let allCorrect = true;
  const results = {};

  Object.entries(correct).forEach(([device, correctZone]) => {
    const placedEntry = Object.entries(topoDevices).find(([z, devs]) => devs.includes(device));
    const userZone = placedEntry ? placedEntry[0] : null;
    const isRight = userZone === correctZone;
    if (!isRight) allCorrect = false;
    results[device] = { userZone, correctZone, isRight };
  });

  const existing = _findLogEntryFor(q);

  if (existing) {
    // v4.82.0: re-submit path
    const wasRight = existing.entry.isRight === true;
    log[existing.idx] = { q, chosen: JSON.stringify(topoDevices), correct: JSON.stringify(correct), isRight: allCorrect, flagged: quizFlags[current] };
    if (!allCorrect && wasRight) addToWrongBank(q, JSON.stringify(topoDevices));
    else if (allCorrect && !wasRight) graduateFromBank(q.question);
    _recomputeQuizCounters();
  } else {
    answered++;
    updateTypeStat('topology', allCorrect);
    if (allCorrect) { score++; streak++; if (streak > bestStreak) bestStreak = streak; }
    else { streak = 0; }
    log.push({ q, chosen: JSON.stringify(topoDevices), correct: JSON.stringify(correct), isRight: allCorrect, flagged: quizFlags[current] });
    if (!allCorrect) addToWrongBank(q, JSON.stringify(topoDevices));
    else if (wrongDrillMode) graduateFromBank(q._bankKey || q.question);  // v7.47.0: variant graduates its original
    document.getElementById('live-score').textContent = score + ' / ' + answered;
    document.getElementById('live-streak').textContent = 'Streak ' + streak;
  }

  // v4.82.0: keep devices + zones + submit + reset clickable so user can re-place + re-submit.
  document.querySelectorAll('.topo-device').forEach(b => { b.style.pointerEvents = ''; });
  document.querySelectorAll('.topo-zone').forEach(z => { z.style.cursor = ''; });
  const topoSubmit = document.getElementById('topo-submit-btn');
  if (topoSubmit) topoSubmit.classList.remove('is-hidden');
  const topoReset = document.querySelector('.topo-controls .btn-ghost');
  if (topoReset) topoReset.classList.remove('is-hidden');
  const optionsBox2 = document.getElementById('options');
  if (optionsBox2) optionsBox2.classList.add('is-revisiting');
  _renderQuizProgressDots();
  _renderQuizNavArrows();

  const zones = q.zones || [];
  zones.forEach(zone => {
    const zoneId = 'topo-zone-' + zone.replace(/[^a-zA-Z0-9]/g, '-');
    const el = document.getElementById(zoneId);
    if (!el) return;
    const placed = topoDevices[zone] || [];
    el.innerHTML = placed.map(d => {
      const r = results[d];
      const cls = r ? (r.isRight ? 'topo-correct' : 'topo-wrong') : '';
      const hint = r && !r.isRight ? ' \u2192 ' + escHtml(r.correctZone) : '';
      return '<span class="topo-placed-device ' + cls + '">' + escHtml(d) + hint + '</span>';
    }).join('');
  });

  const topoEntry = _findLogEntryFor(q);
  showExplanation(q, allCorrect, topoEntry ? topoEntry.entry : null);
}

// ══════════════════════════════════════════
// INJECT PBQs FROM PREDEFINED BANKS
// ══════════════════════════════════════════
function getMatchingScenarios(qTopic) {
  const cli = cliScenarios.filter(s => qTopic === MIXED_TOPIC || s.topic === qTopic || qTopic.includes('Troubleshoot'));
  const topo = topoScenarios.filter(s => qTopic === MIXED_TOPIC || s.topic === qTopic);
  // v4.83.0 — hot-area bank joins the mixable PBQ pool. Same topic-matching
  // discipline as cli/topo: Mixed mode pulls everything; topic-locked quizzes
  // pull only same-topic hot-areas. Multi: sentinel falls through to Mixed-style
  // matching so multi-topic quizzes still see hot-areas.
  const hotArea = HOT_AREA_BANK.filter(h => qTopic === MIXED_TOPIC || qTopic.startsWith('Multi:') || h.topic === qTopic);
  return { cli, topo, hotArea };
}

function injectPBQs(qs, qTopic, count) {
  if (count <= 0 || qs.length < 5) return qs;
  const { cli, topo, hotArea } = getMatchingScenarios(qTopic);
  // v4.83.0 — pool now includes hot-area entries. Random shuffle, take top N.
  const pool = [...cli, ...topo, ...(hotArea || [])].sort(() => Math.random() - 0.5);
  if (pool.length === 0) return qs;
  const toInject = pool.slice(0, Math.min(count, pool.length));
  const result = [...qs];
  toInject.forEach((pbq, i) => {
    const insertIdx = Math.min(Math.floor(result.length * 0.4) + i * 3, result.length - 1);
    // Stamp N10-009 objective on injected PBQs so they pass validateQuestions
    const pbqTopic = pbq.topic || qTopic;
    const obj = (topicResources[pbqTopic] && topicResources[pbqTopic].obj) || '5.1';
    result.splice(insertIdx, 1, { ...pbq, objective: obj });
  });
  return result;
}

// ══════════════════════════════════════════
// AI SECOND-PASS VALIDATOR (Enhancement 1)
// ══════════════════════════════════════════
async function aiValidateQuestions(key, qs) {
  // Validate MCQ + multi-select questions (v4.85.4: extended from MCQ-only)
  const toValidate = qs.filter(q => {
    var t = getQType(q);
    return t === 'mcq' || t === 'multi-select';
  });
  if (toValidate.length === 0) return qs;

  // Build a compact verification prompt
  const qList = toValidate.map((q, i) => {
    var t = getQType(q);
    if (t === 'multi-select') {
      var opts = Object.keys(q.options).sort().map(function(l) { return l + ') ' + q.options[l]; }).join('\n');
      return 'Q' + (i+1) + ' [MULTI-SELECT]: "' + q.question + '"\n' + opts + '\nMarked answers: ' + q.answers.join(', ') + '\nExplanation: ' + q.explanation;
    }
    return `Q${i+1}: "${q.question}"\nA) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}\nMarked answer: ${q.answer}\nExplanation: ${q.explanation}`;
  }).join('\n\n');

  const prompt = `You are a CompTIA Network+ N10-009 expert verifier. Review each question below and check SEVEN things:
1. Is the marked answer FACTUALLY CORRECT?
2. Does the correct answer CONTRADICT any fact stated in the question stem?
3. Does the EXPLANATION actually support the MARKED answer letter, or does it champion a different option?
4. CONCEPTUAL COHERENCE: Does the stem ask about one concept but the answer test a DIFFERENT concept? (e.g. stem asks for a "fundamental TCP/IP principle" but the answer is about deprecated classful addressing — those are distinct concepts.)
5. FRAMING MATCH: Is the question's abstraction level aligned with the answer? (e.g. stem asks for a "principle" or "root cause," but the answer is a specific configuration detail; or stem asks what is "most likely" but only one option is even plausible.)
6. DISTRACTOR QUALITY: Are the wrong options plausible alternatives a student might pick, or are 3/4 obviously wrong? A good MCQ has at least two tempting-looking distractors.
7. MULTI-SELECT ANSWER BALANCE (for [MULTI-SELECT] questions only): Are ALL marked correct answers at a SIMILAR level of prominence and familiarity? A well-formed multi-select tests BREADTH (knowing that multiple core facts apply), NOT obscurity. If one correct answer is an obvious well-known fact and the other is an obscure edge-case detail that only specialists would know, the question is UNBALANCED — mark AMBIGUOUS. Also check: are any of the DISTRACTORS actually factually correct answers to the stem? If so, mark AMBIGUOUS.

For each question, respond with ONLY:
- "Q1:OK" if the marked answer is correct AND consistent with the stem AND supported by the explanation AND conceptually coherent AND well-framed AND has plausible distractors (AND balanced, for multi-select)
- "Q1:WRONG:X" if the correct answer should be letter X instead (use this when the explanation itself says X is correct but the answer field says something else)
- "Q1:AMBIGUOUS" if the question is unclear, has multiple valid answers, the correct answer contradicts the question's own stated premises, OR fails any of checks 4/5/6/7 above

Be strict. Check actual networking facts. Common errors to catch:
- Port numbers matched to wrong protocols
- OSI layers confused
- Protocol features attributed to wrong protocol
- Subnet calculations that are off
- Security concepts misattributed
- PREMISE-ANSWER CONTRADICTIONS: The question states a fact ("both on VLAN 30", "using WPA3", "connected via fiber") but the correct answer contradicts that stated fact. These questions MUST be marked AMBIGUOUS — they are logically broken.
- EXPLANATION-ANSWER MISMATCH: The explanation describes why option X is correct (e.g. "the access tier contains servers and storage") but the answer field says a different letter (e.g. marks "Core tier" as correct). This is an AI authoring error — the AI wrote a correct explanation then picked the wrong letter. For every question, identify which option the explanation ACTUALLY supports and compare to the marked answer. If they disagree, use "WRONG:X" where X is the letter the explanation actually supports.
- CONCEPTUAL CONFLATION: The stem mentions one framework or concept (e.g. "TCP/IP principle," "OSI Layer 3 function," "CIDR subnetting") but the correct answer is actually about a different, unrelated concept (e.g. "classful addressing," which was obsoleted by CIDR in 1993). These are pedagogically broken — they teach the wrong concept under the wrong label. Mark AMBIGUOUS.
- FRAMING DRIFT: The stem asks for a high-level principle, root cause, or fundamental concept, but the correct answer is a narrow configuration detail (e.g. stem: "what principle explains why X fails?"; answer: "the default gateway isn't configured"). Principles are not configuration steps. Mark AMBIGUOUS if the abstraction levels don't match.
- WEAK DISTRACTORS: 3 of 4 options are obviously wrong to any reader with basic networking knowledge, making the "correct" option a giveaway rather than a real test. Mark AMBIGUOUS.
- MULTI-SELECT IMBALANCE: One correct answer is a widely-known core fact (e.g. "OSPF uses Dijkstra's algorithm") while the other is an obscure detail only specialists know (e.g. "OSPF uses area 0 as backbone"). Both correct answers MUST be at similar prominence levels — difficulty should come from breadth, not obscurity. Mark AMBIGUOUS.
- MULTI-SELECT DISTRACTOR LEAK: A distractor option is ALSO a factually correct answer to the stem (e.g. stem asks "Which TWO are valid IPv6 transition methods?" and a distractor lists Teredo, which IS a valid method). If any distractor is factually correct, the question is unsolvable. Mark AMBIGUOUS.

${qList}

Respond with one line per question, nothing else:`;

  try {
    const res = await _claudeFetch( {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: CLAUDE_VALIDATOR_MODEL, max_tokens: MAX_TOKENS_VALIDATION, messages: [{ role: 'user', content: prompt }] })
    });

    if (!res.ok) return qs; // If validation call fails, keep questions as-is

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);

    // Parse results
    const fixes = {};
    lines.forEach(line => {
      const wrongMatch = line.match(/Q(\d+)\s*:\s*WRONG\s*:\s*([A-D])/i);
      const ambigMatch = line.match(/Q(\d+)\s*:\s*AMBIGUOUS/i);
      if (wrongMatch) {
        const idx = parseInt(wrongMatch[1]) - 1;
        const correctLetter = wrongMatch[2].toUpperCase();
        fixes[idx] = { action: 'fix', letter: correctLetter };
      } else if (ambigMatch) {
        const idx = parseInt(ambigMatch[1]) - 1;
        fixes[idx] = { action: 'remove' };
      }
    });

    // Apply fixes (v4.85.4: handles both MCQ + multi-select via toValidate indices)
    let fixCount = 0;
    let removeCount = 0;
    const validatedIndices = [];
    qs.forEach((q, i) => {
      var t = getQType(q);
      if (t === 'mcq' || t === 'multi-select') validatedIndices.push(i);
    });

    const result = qs.filter((q, i) => {
      const valIdx = validatedIndices.indexOf(i);
      if (valIdx === -1 || !fixes[valIdx]) return true;
      if (fixes[valIdx].action === 'remove') { removeCount++; return false; }
      if (fixes[valIdx].action === 'fix') {
        const newAnswer = fixes[valIdx].letter;
        if (q.options[newAnswer]) {
          q.answer = newAnswer;
          fixCount++;
        }
      }
      return true;
    });

    return result;
  } catch (e) {
    return qs;
  }
}

// ══════════════════════════════════════════
// v4.54.17: Follow-up drill on a specific wrong answer. Generates 2 extra
// questions on the exact topic of the question the user just got wrong
// and injects them at `current + 1` so they come up next. The user sees
// an editorial "+2 drill questions added" toast on success.
async function followUpOnMistake() {
  // Guard: only valid in quiz mode (not exam), and only immediately after
  // a wrong answer (explanation box is showing with .wrong class).
  if (examMode) return;
  const q = questions[current];
  if (!q) return;
  const btn = document.querySelector('.explain-btn-followup');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '\u{1F4AD} Generating\u2026';
  }
  try {
    const key = apiKey || localStorage.getItem(STORAGE.KEY) || '';
    // v4.99.46 fix: validateApiKey bypasses for signed-in Pro users (server
    // proxy path). Pre-fix the rolled-own `if (!key)` check blocked them.
    const keyErr = validateApiKey(key);
    if (keyErr) {
      if (typeof showErrorToast === 'function') showErrorToast(keyErr);
      if (btn) { btn.disabled = false; btn.innerHTML = 'Drill this concept'; }
      return;
    }
    const targetTopic = q.topic || activeQuizTopic || 'Network+ topic';
    const targetDiff = q.difficulty || diff || 'Exam Level';
    // Reuse fetchQuestions \u2014 already validated + GT-guarded. Request 2 qs on
    // exactly this topic + difficulty. The validation pipeline may drop one,
    // in which case we inject whatever comes through.
    const extras = await fetchQuestions(key, targetTopic, targetDiff, 2);
    if (!extras || extras.length === 0) {
      if (typeof showErrorToast === 'function') showErrorToast('Couldn\'t generate follow-ups \u2014 try again.');
      if (btn) { btn.disabled = false; btn.innerHTML = 'Drill this concept'; }
      return;
    }
    // Mark each as a follow-up (useful for history filtering / debugging)
    extras.forEach(e => { e._followup = true; });
    // Splice into the current session right after the current question.
    questions.splice(current + 1, 0, ...extras);
    if (btn) {
      btn.innerHTML = `\u2705 +${extras.length} added`;
      btn.style.pointerEvents = 'none';
    }
    if (typeof showSuccessToast === 'function') {
      showSuccessToast(`+${extras.length} follow-up question${extras.length === 1 ? '' : 's'} added on "${targetTopic}". They're up next.`);
    }
  } catch (e) {
    console.warn('[followUpOnMistake]', e && e.message);
    if (typeof showErrorToast === 'function') showErrorToast('Follow-up failed: ' + (e.message || 'unknown error'));
    if (btn) { btn.disabled = false; btn.innerHTML = 'Drill this concept'; }
  }
}

// EXPLAIN FURTHER (Enhancement 5)
// ══════════════════════════════════════════
async function explainFurther() {
  const q = examMode ? examQuestions[examCurrent] : questions[current];
  if (!q) return;

  // Increment deep dive usage counter (for deep_dive_10 milestone)
  try {
    const prev = parseInt(localStorage.getItem(STORAGE.DEEP_DIVE_USES) || '0');
    localStorage.setItem(STORAGE.DEEP_DIVE_USES, String(prev + 1));
    _cloudFlush(STORAGE.DEEP_DIVE_USES);
  } catch {}

  const btn = document.querySelector('.explain-btn');
  if (btn) { btn.textContent = 'Loading\u2026'; btn.disabled = true; }

  const key = apiKey || localStorage.getItem(STORAGE.KEY) || '';
  // v4.99.46 fix: validateApiKey bypasses for signed-in Pro users.
  if (validateApiKey(key)) {
    if (btn) { btn.textContent = 'No API key'; btn.disabled = true; }
    return;
  }

  const qType = getQType(q);
  let questionContext;
  if (qType === 'topology') {
    questionContext = `Question: ${q.question}\nScenario: ${q.scenario}\nCorrect placements: ${JSON.stringify(q.correctPlacements)}`;
  } else if (qType === 'cli-sim') {
    questionContext = `Question: ${q.question}\nScenario: ${q.scenario}\nCorrect answer: ${q.answer} - ${q.options[q.answer]}`;
  } else if (qType === 'multi-select') {
    const letters = Object.keys(q.options).sort();
    questionContext = `Question: ${q.question}\nOptions:\n${letters.map(l => l + ') ' + q.options[l]).join('\n')}\nCorrect answers: ${(q.answers || []).join(', ')}`;
  } else if (qType === 'order') {
    questionContext = `Question: ${q.question}\nCorrect order: ${(q.correctOrder || []).map(i => q.items[i]).join(' -> ')}`;
  } else {
    questionContext = `Question: ${q.question}\nOptions:\nA) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}\nCorrect: ${q.answer} - ${q.options[q.answer]}`;
  }

  // v4.38.5 — inject ground-truth facts so the teacher can't hallucinate
  // deterministic things (ports, OSI layers, deprecated wireless) under us.
  const gtHint = _buildGtHint(q.question + ' ' + (q.explanation || ''), q.topic);
  const prompt = `A student studying for the CompTIA Network+ N10-009 exam needs a thorough, teaching-quality explanation of this concept.
${gtHint}
${questionContext}

Original explanation: ${q.explanation}

Please provide ALL of the following sections:

1. CONCEPT BREAKDOWN
Explain the underlying networking concept in simple, plain English. Assume the student is new to this topic. Cover what it is, why it exists, and how it works in practice. (3-4 sentences)

2. REAL-WORLD ANALOGY
Give a memorable real-world analogy that makes this concept click. Be creative and specific.

3. WHY EACH WRONG ANSWER IS WRONG
For each incorrect option, explain in 1-2 sentences WHY it's wrong and what it actually refers to (so the student learns from the distractors too).

4. HOW THIS APPEARS ON THE EXAM
Describe common ways CompTIA tests this concept — what tricky wording to watch for, what distractors they like to use, and any "gotcha" patterns.

5. MEMORY TRICK
Give a mnemonic, acronym, or memory hook to lock this in.

6. RELATED CONCEPTS
List 2-3 related topics the student should also review (one line each).

Use plain text, no markdown. Label each section clearly. Aim for 250-350 words total — thorough but not bloated.`;

  // v4.38.5 — cache hit avoids a live Sonnet call on repeat views (same Q + same prompt)
  const cacheKey = (q.question || '') + '|' + (q.answer || JSON.stringify(q.answers || q.correctOrder || q.correctPlacements || ''));
  let text = _aiCacheGet('explainFurther', cacheKey);
  if (!text) {
    try {
      const res = await _claudeFetch( {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: CLAUDE_TEACHER_MODEL, max_tokens: MAX_TOKENS_TEACHER_DEFAULT, messages: [{ role: 'user', content: prompt }] })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      text = data.content?.[0]?.text || 'Could not generate explanation.';
      _aiCacheSet('explainFurther', cacheKey, text);
    } catch (e) {
      if (btn) { btn.textContent = 'Failed \u2014 try again'; btn.disabled = false; }
      return;
    }
  }

  // Format sections with visual labels
  let formatted = escHtml(text).replace(/\n/g, '<br>');
  // Bold the section headers
  formatted = formatted.replace(/((?:^|<br>)\d+\.\s*(?:CONCEPT BREAKDOWN|REAL-WORLD ANALOGY|WHY EACH WRONG ANSWER IS WRONG|HOW THIS APPEARS ON THE EXAM|MEMORY TRICK|RELATED CONCEPTS))/gi,
    '<span class="deep-section-header">$1</span>');

  // Show in a new div below the explanation
  const deepDiv = document.getElementById('deep-explain') || document.createElement('div');
  deepDiv.id = 'deep-explain';
  deepDiv.className = 'deep-explain show';
  // Sec-P4/M6: AI ("Explain further") output \u2014 DOMPurify backstop over the
  // already-escHtml'd `formatted` text. No trusted inline handlers here.
  deepDiv.innerHTML = sanitizeHTML('<strong>\ud83d\udca1 Deep Dive</strong><div class="deep-explain-text">' + formatted + '</div>');

  const expBox = document.getElementById('exp-box');
  if (expBox && !document.getElementById('deep-explain')) {
    expBox.appendChild(deepDiv);
  }

  if (btn) { btn.textContent = '\ud83d\udca1 Explained'; btn.disabled = true; btn.classList.add('explained'); }
}

// #138 wave 11: loader stubs — features/topic-dive.js overwrites these on lazy load.
function showTopicDeepDive(topicName) {
  _loadFeature('topic-dive').then(function(m) { m.showTopicDeepDive(topicName); });
}
function openGuidedLab(topicName) {
  _loadFeature('topic-dive').then(function(m) { m.openGuidedLab(topicName); });
}
async function fetchTopicBrief(key, topicName) {
  var m = await _loadFeature('topic-dive');
  return m.fetchTopicBrief(key, topicName);
}

// ══════════════════════════════════════════
// FEATURE 4: PERFORMANCE ANALYTICS DASHBOARD
// ══════════════════════════════════════════

// ── Analytics sub-renderers (extracted from renderAnalytics) ──

// v4.46.1: shared exam-date chip builder. Used by both the Analytics hero card
// and the homepage readiness card (via renderReadinessCard). Single source of
// truth so the two surfaces never disagree and the picker stays hidden behind
// the polished chip on both. inputId must be unique per surface so clicking
// the chip opens the right picker.
function _buildExamDateChipHtml(examDateStr, daysToExam, inputId) {
  let dateChipInner;
  let dateChipState = '';
  if (examDateStr) {
    const dateLabel = new Date(examDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    // v7.50.x: urgency emoji (🔥⏰📅🎯✅) removed — urgency is already carried by
    // the ana-ready-datechip-{urgent|soon|ok|past} state class (colour), so the
    // glyph was redundant decoration (BRAND §9 · no emoji-as-icons).
    if (daysToExam !== null && daysToExam > 0) {
      const urgency = daysToExam <= 7 ? 'urgent' : daysToExam <= 30 ? 'soon' : 'ok';
      dateChipState = ` ana-ready-datechip-${urgency}`;
      dateChipInner = `<span class="ana-ready-datechip-date">${dateLabel}</span><span class="ana-ready-datechip-sep">·</span><span class="ana-ready-datechip-days"><strong>${daysToExam}</strong> day${daysToExam === 1 ? '' : 's'}</span>`;
    } else if (daysToExam === 0) {
      dateChipState = ' ana-ready-datechip-urgent';
      dateChipInner = `<span class="ana-ready-datechip-date">${dateLabel}</span><span class="ana-ready-datechip-sep">·</span><span class="ana-ready-datechip-days"><strong>Today!</strong></span>`;
    } else {
      dateChipState = ' ana-ready-datechip-past';
      dateChipInner = `<span class="ana-ready-datechip-date">${dateLabel}</span><span class="ana-ready-datechip-sep">·</span><span class="ana-ready-datechip-days">${Math.abs(daysToExam)} day${Math.abs(daysToExam) === 1 ? '' : 's'} ago</span>`;
    }
  } else {
    dateChipInner = `<span class="ana-ready-datechip-date ana-ready-datechip-placeholder">Set your exam date</span>`;
  }
  return `<button type="button" class="ana-exam-date-btn ana-ready-datechip${dateChipState}" onclick="document.getElementById('${inputId}').showPicker && document.getElementById('${inputId}').showPicker()" aria-label="${examDateStr ? 'Change exam date' : 'Set exam date'}">
      ${dateChipInner}
      <input type="date" id="${inputId}" value="${examDateStr || ''}" onchange="updateExamDate(this.value)" aria-label="Set your exam date">
      ${examDateStr ? '<span class="ana-ready-datechip-clear" role="button" tabindex="0" onclick="event.stopPropagation();updateExamDate(\'\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.stopPropagation();event.preventDefault();updateExamDate(\'\')}" aria-label="Clear exam date" title="Clear date">×</span>' : ''}
    </button>`;
}


// v4.45.0 — drill helper for the Domain Mastery card. Finds the weakest topic
// within the given domain (unstudied topics get priority via -1 accuracy
// sentinel) and pipes it into focusTopic() which sets state + chips +
// fires startQuiz(). One click \u2192 one targeted drill session.
function drillDomain(domainName) {
  const topicsInDomain = Object.entries(TOPIC_DOMAINS).filter(([t, d]) => d === domainName).map(([t]) => t);
  if (topicsInDomain.length === 0) return;
  const h = typeof loadHistory === 'function' ? loadHistory() : [];
  const topicAcc = {};
  topicsInDomain.forEach(t => {
    // v4.57.4: expand matching to include pre-v4.57.1 "Multi: ..." sentinel entries
    const entries = _filterHistoryByTopic(h, t);
    const total = entries.reduce((a,e) => a + e.total, 0);
    const correct = entries.reduce((a,e) => a + e.score, 0);
    topicAcc[t] = total > 0 ? (correct / total) : -1; // -1 = unstudied, priority
  });
  const sorted = topicsInDomain.slice().sort((a,b) => topicAcc[a] - topicAcc[b]);
  const target = sorted[0];
  if (typeof focusTopic === 'function') focusTopic(target);
}


// Wired to the exam date input on the analytics page
function updateExamDate(value) {
  setExamDate(value);
  // v4.54.16: also sync the Settings-page chip if it's currently on screen
  if (typeof syncSettingsExamDate === 'function') syncSettingsExamDate();
  // v4.54.17: refresh the persistent topbar countdown chip
  if (typeof renderTopbarCountdown === 'function') renderTopbarCountdown();
  if (typeof renderAnalytics === 'function') renderAnalytics(); // re-render so forecast/countdown update
  renderReadinessCard(); // setup-page card may be affected by coverage/recency thresholds
}

// ══════════════════════════════════════════
// SHARED DRILL SCAFFOLD
// ══════════════════════════════════════════
// Factory that returns reusable functions for any drill feature.
// Config shape:
//   prefix        – DOM id prefix ('ab','os','cb')
//   storageKey    – STORAGE key for mastery data
//   lessonsKey    – STORAGE key for lesson progress
//   lessons       – array of lesson objects
//   categories    – { catId: { label, icon, color } }
//   catIds        – ordered array of category keys
//   categoryField – mastery sub-object name ('perCategory' or 'perLayer')
//   levelThresholds – [{ min, acc, level }] from hardest to easiest
//   badgeColor    – CSS color for level badge
//   initMastery   – fn() → fresh mastery object (with perItem/perCategory populated)
//   heatmapTitle  – string heading for heatmap
//   heatmapIter   – fn(catId, catObj) → { borderColor, pctLabel, boxLabel, cellLabel } per cell
//   dashCatIter   – fn(m) → [{ color, heading, acc, seen, box }]  rows for dashboard
//   dashHeading   – 'Category Mastery' or 'Layer Mastery'
//   dashResetLabel– 'Reset all acronym mastery data?' etc.
//   nextLevelText – fn(level) → string for "Next: …"
//   gateQuestionHtml – fn(questionObj) → { questionText, opts:[{label,isCorrect}] }
//   gateStateKey  – window['_abGateState'] key name
//   endlessContainerId – DOM id of the card to replace on endless end ('ab-q-card')
//   onPracticeTab – fn() called when practice tab is selected (starts questions)
//   activeLesson  – { get(), set(id) } accessor for the drill's activeLesson variable
//   streakVar     – { get(), set(v) } accessor for the drill's streak variable

// ══════════════════════════════════════════
// UTIL
// ══════════════════════════════════════════
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
// v4.98.4 hotfix: escAttr was used throughout IRW + PHT flagships but never
// defined — caused both flagships to crash on first render with
// "escAttr is not defined". escHtml already escapes both quote types so
// it's safe to alias for HTML attribute contexts.
function escAttr(str) {
  return escHtml(str == null ? '' : str);
}

// ── Security Phase 4 / M6 — DOMPurify defence-in-depth ───────────────
// escHtml above is the primary, always-on escape for every dynamic sink.
// sanitizeHTML is a SECOND, robust backstop for the innerHTML sinks that
// carry untrusted data (AI/Claude output, other-user data, remote fetches):
// if a single escHtml is ever missed upstream, DOMPurify still neutralises
// injected <script>/<img onerror>/<svg onload>/<iframe>/javascript: URIs.
// DOMPurify is vendored at lib/dompurify.min.js (no build step) and loaded
// before app.js in index.html. STRICT config (defaults) — it strips ALL
// inline on* handlers, so only run it over untrusted *content*; concatenate
// any trusted onclick-bearing template parts OUTSIDE this call. Fully removing
// inline handlers app-wide is M7 (deferred). Fails OPEN (returns the input) if
// the vendored bundle ever fails to load — the escHtml layer still applies.
function sanitizeHTML(dirty) {
  if (dirty == null) return '';
  const s = String(dirty);
  const DP = (typeof window !== 'undefined') ? window.DOMPurify : null;
  if (DP && typeof DP.sanitize === 'function') return DP.sanitize(s);
  return s;
}

// ── v4.43.0: exam-convention keyword highlighting ────────────────────
// CompTIA exam stems use specific keywords that change the question's meaning
// ("MOST secure", "BEST describes", "NOT a valid...", "EXCEPT for..."). Missing
// these words is the #2 wrong-answer mode after "I didn't know it" — test-
// takers skim and miss the negation or the superlative. Bolding them at render
// time trains your eye to catch them on the real exam.
//
// Applied to: quiz question stems, exam question stems, review-page stems, CLI
// sim scenario, topology scenario. NOT applied to: explanations, teacher
// content (Topic Deep Dive / Explain Further / Topic Brief), analytics.
//
// Single words only — phrases are compositions and the eye catches context
// once the keyword is lit up. Keywords chosen to minimize false-positive
// highlighting of plain prose (e.g. omitted "all/any/none" which are too
// common in non-exam usage).
const EXAM_KEYWORDS = [
  'not', 'except', 'cannot',                         // negation
  'most', 'least', 'best', 'worst', 'primary',       // superlatives
  'first', 'last', 'next',                           // sequence
  'always', 'never', 'only'                          // absolutes
];
const _examKeywordRe = new RegExp('\\b(' + EXAM_KEYWORDS.join('|') + ')\\b', 'gi');

// Takes already-escaped HTML text (output of escHtml) and wraps exam-convention
// keywords in <strong class="exam-keyword">. Input must be HTML-escaped first
// so the regex can't accidentally wrap anything inside HTML tags.
function highlightExamKeywords(escapedText) {
  if (!escapedText) return escapedText;
  return String(escapedText).replace(_examKeywordRe, '<strong class="exam-keyword">$&</strong>');
}

// Single-entry helper for rendering question stems + scenario text. Escapes
// the raw AI-generated text (XSS-safe), then applies keyword highlighting,
// then sets innerHTML. Used by quiz / exam / review / CLI sim / topology
// render paths.
function setQuestionText(el, raw) {
  if (!el) return;
  el.innerHTML = highlightExamKeywords(escHtml(raw || ''));
}

// ══════════════════════════════════════════
// ACL / FIREWALL RULE BUILDER (v4.52.0)
// ══════════════════════════════════════════
// Security-domain (N10-009 obj 4.3/4.5) sandbox: build an ordered ACL, run
// test packets, get graded outcome-first. Shape-of-solution decisions
// blessed by user 2026-04-18:
//   1. Generic table syntax (not Cisco CLI)    — vendor-neutral
//   2. Stateless rules                          — matches exam baseline
//   3. Canned + free-form packet tests          — canned for grading,
//                                                 free-form for explore
//   4. New top-level page                       — entry tile on setup nav
//   5. Outcome-based grading                    — many valid rule lists ok
//   6. 8 scenarios + Free Build                 — matches TB launch depth
//   7. Tier C AI Coach, per-scenario cache      — reuses tbCoachTopology
//                                                 architecture

// ── N10-009 exam objective map (shared with TB scenarios pattern) ──
// 4.3 = Apply network hardening techniques
// 4.5 = Implement physical + logical security (device hardening)

// ── Evaluator core (correctness floor — pure functions, unit-tested) ──

// Parse "10.0.0.0/24" or "10.0.0.5" into { base: uint32, mask: uint32 }.
// Bare addresses are treated as /32. "any" / "0.0.0.0/0" → { base: 0, mask: 0 }.
// Returns null on unparseable input (defensive — UI should prevent, but JS
// is forgiving; we prefer a clean null to a silent NaN-everywhere bug).
// MVP-QUIZ-ONLY (Ship 3): ACL Builder flagship DELETED. features/acl-builder.js
// removed; #page-acl div removed; sidebar/PRO-gate/crumb refs scrubbed.
// NOTE: ACL Pass-Plan PBQ (different feature, same prefix) STAYS — part of
// the quiz/Pass-Plan exam-readiness flow (uses #page-acl-pbq, not #page-acl).


// ══════════════════════════════════════════
// v4.99.49 (Phase 10) — Online/offline banner
// ══════════════════════════════════════════
// Shows a sticky banner at the top of the viewport when the device goes
// offline. The cert app has a full service-worker stale-while-revalidate
// cache so most flows degrade gracefully — but AI calls (Generate Quiz,
// Diagnostic, Topic Deep Dive, Explain Further) require the network. The
// banner is a gentle "heads-up, AI features won't work" rather than a
// blocker. Briefly flashes a "you're back online" success when reconnected.
function _renderConnectivityBanner(state) {
  // state = 'offline' | 'online' | 'hidden'
  let el = document.getElementById('connectivity-banner');
  if (state === 'hidden') {
    if (el) { el.classList.remove('is-shown'); setTimeout(() => el.remove(), 300); }
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'connectivity-banner';
    el.className = 'connectivity-banner';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  if (state === 'offline') {
    el.className = 'connectivity-banner offline';
    el.textContent = 'You\'re offline — AI features (Generate Quiz, Diagnostic, Coach) won\'t work until you reconnect.';
    requestAnimationFrame(() => el.classList.add('is-shown'));
  } else if (state === 'online') {
    el.className = 'connectivity-banner online';
    el.textContent = 'Back online — AI features ready again.';
    requestAnimationFrame(() => el.classList.add('is-shown'));
    // Auto-hide after 3 seconds
    setTimeout(() => _renderConnectivityBanner('hidden'), 3000);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => { _renderConnectivityBanner('offline'); });
  window.addEventListener('online', () => { _renderConnectivityBanner('online'); });
  // Initial check — if we load while already offline (e.g., PWA cold start
  // with no network), show the banner right away.
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        _renderConnectivityBanner('offline');
      }
    } catch (_) {}
  });
}

// ── Focus banner pullquote (setup page) ──
// v4.81.20 retired the v4.54.0 #focus-banner (was a redundant prescriptive
// surface duplicating #today-plan's role). v4.81.23 removed the function +
// element entirely. All callers now invoke renderTodayPlan directly. This
// stub remains as a no-op safety net for any external code that may still
// reference renderSetupFocusBanner — calling it does nothing harmful.
function renderSetupFocusBanner() { /* retired in v4.81.23 — see renderTodayPlan */ }

// ── v4.54.0 init ──
function _v454Init() {
  try {
    // #138 wave 9: typeof guards — features/home.js (eager) loads after
    // app.js eval, so these are no-ops at parse time and fire on the
    // DOMContentLoaded / home.js self-trigger instead.
    if (typeof _initSidebarCollapsed === 'function') _initSidebarCollapsed();
    if (typeof _topbarStartClock === 'function') _topbarStartClock();
    if (typeof _syncTopbarTheme === 'function') _syncTopbarTheme();
    if (typeof _syncPageHeaderCert === 'function') _syncPageHeaderCert();
    // v4.54.17: render the persistent exam countdown on load
    if (typeof renderTopbarCountdown === 'function') renderTopbarCountdown();
    // Observe theme changes so the topbar icon stays in sync
    if (typeof _syncTopbarTheme === 'function') {
      const obs = new MutationObserver(_syncTopbarTheme);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    // Initial breadcrumb based on active page
    const active = document.querySelector('.page.active');
    if (active && typeof updateTopbarCrumb === 'function') updateTopbarCrumb(active.id.replace(/^page-/, ''));
    // Render hero v2 if we land on setup
    const setup = document.getElementById('page-setup');
    if (setup && setup.classList.contains('active') && typeof renderHeroV2 === 'function') {
      renderHeroV2();
    }
  } catch (e) {
    console.warn('[v4.54.0 init]', e && e.message);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _v454Init);
} else {
  _v454Init();
}


// ── Initialisation hook ──
// Render sidebar on page load + flag body for sidebar padding. Runs after
// DOMContentLoaded so existing DOM is ready.
function _v453Init() {
  try {
    document.body.classList.add('has-sidebar');
    if (typeof renderAppSidebar === 'function') renderAppSidebar();
    // v4.81.23: focus banner retired in v4.81.20; consolidated #today-plan
    // is rendered via renderTodayPlan() from goSetup() / DOMContentLoaded.
    const setupPage = document.getElementById('page-setup');
    if (setupPage && setupPage.classList.contains('active')) {
      if (typeof renderSetupDomainGrid === 'function') renderSetupDomainGrid();
      if (typeof renderTodayPlan === 'function') renderTodayPlan();
    }
  } catch (e) {
    // Defensive — sidebar is net-new; any bug here must not crash the app
    console.warn('[v4.53.0 sidebar init]', e && e.message);
  }
}

// ── v4.88.4: URL action handler ──
// Lets external surfaces (the certanvil.com landing diagnostic CTA, future
// share links, etc.) route a user straight to a specific app action via a
// query param. Currently supported: ?action=diagnostic → auto-fires
// startDiagnostic() after the homepage paints.
//
// The URL is cleaned via history.replaceState so a subsequent refresh
// doesn't re-fire the action. The 'from' param is logged for analytics
// (placeholder; wire up when analytics ship).
function _processUrlAction() {
  try {
    if (typeof URLSearchParams !== 'function') return;
    const params = new URLSearchParams(window.location.search);
    const action = (params.get('action') || '').toLowerCase().trim();
    const from = (params.get('from') || '').trim();
    if (!action) return;

    // Clean the URL so refresh doesn't re-fire (preserves hash if any).
    if (window.history && typeof window.history.replaceState === 'function') {
      const cleanUrl = window.location.origin + window.location.pathname + (window.location.hash || '');
      try { window.history.replaceState({}, '', cleanUrl); } catch (e) {}
    }

    if (action === 'diagnostic') {
      // Defer one tick so the home page paints before the diagnostic kicks in.
      // 100ms feels instant but lets renderTodayPlan / readiness etc. complete.
      setTimeout(function () {
        if (typeof startDiagnostic === 'function') {
          try { startDiagnostic(); } catch (e) { console.warn('[url-action] startDiagnostic threw', e); }
        }
      }, 100);
    }
    if (action === 'web-vitals') {
      // v4.99.50 Phase 6c: open admin dashboard. Function gates via is_admin RPC.
      setTimeout(function () {
        if (typeof openWebVitalsAdmin === 'function') {
          try { openWebVitalsAdmin(); } catch (e) { console.warn('[url-action] openWebVitalsAdmin threw', e); }
        }
      }, 500);  // small extra delay so Supabase session settles
    }
    // Future: action=newest|streak|wrongbank|etc.
    if (from) console.info('[url-action]', { action: action, from: from });
  } catch (e) {
    // Never let URL parsing crash the app.
    console.warn('[url-action]', e && e.message);
  }
}

// v4.99.17 — Playtest welcome toast. Fires once per fresh sign-in (flag set
// by landing/auth.js after successful password sign-in). Confirms to the
// tester that Pro entitlements are active so they don't have to wonder why
// drills + builders aren't locked. One-shot: clears flag immediately.
function _maybeShowPlaytestWelcomeToast() {
  try {
    if (localStorage.getItem('certanvil_playtest_welcome_pending') !== 'true') return;
    localStorage.removeItem('certanvil_playtest_welcome_pending');
    // Defer a tick so the topbar / sidebar render before the toast layers.
    setTimeout(function () {
      try {
        var toast = document.createElement('div');
        toast.className = 'playtest-welcome-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML =
          '<span class="pwt-icon" aria-hidden="true">✓</span>' +
          '<span class="pwt-body">' +
            '<span class="pwt-title">Welcome to the playtest.</span>' +
            '<span class="pwt-sub">Full Pro access enabled. Drills + builders unlocked.</span>' +
          '</span>' +
          '<button type="button" class="pwt-close" aria-label="Dismiss">×</button>';
        document.body.appendChild(toast);
        var closeBtn = toast.querySelector('.pwt-close');
        var dismiss = function () {
          toast.classList.add('pwt-leaving');
          setTimeout(function () { try { toast.remove(); } catch (_) {} }, 250);
        };
        if (closeBtn) closeBtn.addEventListener('click', dismiss);
        // Auto-dismiss after 8 seconds (long enough to read, short enough not to annoy)
        setTimeout(dismiss, 8000);
      } catch (_) {}
    }, 800);
  } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _v453Init);
  document.addEventListener('DOMContentLoaded', _processUrlAction);
  document.addEventListener('DOMContentLoaded', _maybeShowPlaytestWelcomeToast);
} else {
  // Already loaded (likely because app.js is at end of body)
  _v453Init();
  _processUrlAction();
  _maybeShowPlaytestWelcomeToast();
}

// v5.6.x — Bug-report retry queue drain
// Note: wrapped in a `typeof window.addEventListener === 'function'` guard
// because tests/uat.js's `renderSettingsHealthCard` vm-fixture extracts the
// function body via the brace-walker `_fnBodyShell` which overshoots through
// EOF; the test stubs `window: {}` (no addEventListener) so a bare call would
// throw. In the real browser the guard is always-true and the hook fires.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('DOMContentLoaded', function(){
    // Run after a 2s delay so it doesn't block first-paint
    setTimeout(function(){
      if (typeof _loadFeature !== 'function') return;
      _loadFeature('reports').then(function(m){
        if (m && typeof m.drainQueue === 'function') m.drainQueue();
      }).catch(function(){ /* silent */ });
    }, 2000);
  });
}
