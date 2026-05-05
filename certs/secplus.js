// ══════════════════════════════════════════════════════════════════════════
// CompTIA Security+ SY0-701 cert pack (v4.86.0 Phase 1A engine refactor)
// ══════════════════════════════════════════════════════════════════════════
// Loaded into window.CERT_PACKS.secplus at app boot. Active when the URL
// host starts with 'secplus-' OR when localStorage 'nplus_dev_cert' is
// 'secplus' (dev override).
//
// Phase 1A (this ship): cert metadata + empty content stubs. Pack is
// loaded but inert until Network+ stays the default cert. Spinning up
// secplus-quiz-sable.vercel.app comes in Phase 2 (Week 3).
//
// Phase 2 — Week 3 (target v4.87.0):
//   - Populate Security+ blueprint topics (~30 topics across 5 domains)
//   - Domain weights from current SY0-701 blueprint (sourced at build time
//     to avoid stale weights in this stub)
//   - Per-cert prompts (security threat actors, mitigations, frameworks)
//   - Audit + carry-over ~60-100 Network+ exemplars that genuinely apply
//     (firewalls, ACLs, crypto, network attacks, IDS/IPS, port security,
//     wireless security, VPN concepts) with topics retagged for Security+
//   - Begin authoring net-new Security+ exemplars
//
// AUDIENCE: builder only. Private — for the user studying for SY0-701 on
// 2026-07-29. Customers stay on the Network+ deploy. Access control is
// URL obscurity only (no Vercel Pro, no in-app password) per the
// cert_saas_pivot_plan.md decision.
//
// LEGAL: same discipline as Network+ — content sourced from public CompTIA
// blueprint + RFC/IEEE/NIST/vendor docs. Zero ingestion of paid-bank
// content. See CLAUDE.md.

window.CERT_PACKS = window.CERT_PACKS || {};
window.CERT_PACKS.secplus = {
  meta: {
    id: 'secplus',
    name: 'CompTIA Security+',
    code: 'SY0-701',
    blueprintUrl: 'https://www.comptia.org/certifications/security',
    examPassScore: 750,        // Security+ scaled-score pass threshold (CompTIA official)
    examMaxScore: 900,         // scaled-score ceiling
    examQuestionCount: 90,     // full exam length (same as Network+)
    examTimeSeconds: 5400,     // 90-minute timer
  },

  // Empty stubs — populated in Phase 2 (Week 3 target v4.87.0).
  retentionGapConcepts: [],
};
