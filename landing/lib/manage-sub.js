// ══════════════════════════════════════════════════════════════════════════
// CertAnvil — Manage subscription page logic (/manage-subscription)
// ══════════════════════════════════════════════════════════════════════════
// Loaded after lib/supabase-umd.min.js + lib/supabase.js + auth.js.
//
// STATIC UI LIFT (account-pages lift phase 2): there is no Stripe yet, so
// this page only READS the profile and renders the honest current state —
// Free tier, or Pro-via-admin. The plan switch is inert and the CTA stays
// disabled with the same "coming soon" semantics as #btn-upgrade on
// /account. When Stripe (Phase G) ships, this file wires the switch + CTA
// to the billing portal; the UI contract is already in place.
// ══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var supabase = window.certanvilSupabase;
  if (!supabase) {
    console.warn('[certanvil-managesub] Supabase client missing — page disabled');
    return;
  }

  var elLoading = document.getElementById('ms-loading');
  var elAnonGate = document.getElementById('ms-anon-gate');
  var elContent = document.getElementById('ms-content');
  var elPlanTag = document.getElementById('ms-plan-tag');
  var elPlanName = document.getElementById('ms-plan-name');
  var elPlanPrice = document.getElementById('ms-plan-price');
  var elPlanRows = document.getElementById('ms-plan-rows');
  var elCalloutText = document.getElementById('ms-callout-text');
  var elManageLabel = document.getElementById('ms-manage-label');

  function row(k, v, mono) {
    return '<div class="ms-pn-row"><span class="ms-pn-k">' + k + '</span>'
      + '<span class="ms-pn-v' + (mono ? ' mono' : '') + '">' + v + '</span></div>';
  }

  function renderFree(memberSince) {
    if (elPlanTag) { elPlanTag.textContent = 'Free'; elPlanTag.removeAttribute('hidden'); }
    if (elPlanName) elPlanName.textContent = 'Free';
    if (elPlanPrice) elPlanPrice.innerHTML = '<b>$0</b> / forever';
    if (elPlanRows) elPlanRows.innerHTML =
      row('Member since', memberSince, true)
      + row('Certs', '1 unlocked')
      + row('Daily questions', 'Capped on Free');
    if (elCalloutText) elCalloutText.innerHTML =
      'Pro unlocks <b>every cert</b>, removes the daily question cap, and adds cross-cert analytics. Your progress comes with you.';
    if (elManageLabel) elManageLabel.textContent = 'Go Pro';
  }

  function renderAdminPro(memberSince) {
    if (elPlanTag) { elPlanTag.textContent = 'Pro'; elPlanTag.removeAttribute('hidden'); }
    if (elPlanName) elPlanName.textContent = 'Pro';
    if (elPlanPrice) elPlanPrice.innerHTML = '<b>All certs</b> · owner access';
    if (elPlanRows) elPlanRows.innerHTML =
      row('Member since', memberSince, true)
      + row('Certs', 'All unlocked')
      + row('Billing', 'Owner account · no charge');
    if (elCalloutText) elCalloutText.innerHTML =
      'You have <b>owner access</b> — every cert and feature is unlocked. The plans below show what subscribers will see at launch.';
    if (elManageLabel) elManageLabel.textContent = 'Billing not required';
  }

  function init() {
    supabase.auth.getSession().then(function (r) {
      var session = r && r.data ? r.data.session : null;
      if (!session || !session.user) {
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elAnonGate) elAnonGate.removeAttribute('hidden');
        return;
      }
      var user = session.user;
      var memberSince = user.created_at ? String(user.created_at).slice(0, 10) : '—';

      supabase.from('profiles').select('role').eq('id', user.id).single().then(function (pr) {
        var role = (pr.data && pr.data.role) || 'user';
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elContent) elContent.removeAttribute('hidden');
        if (role === 'admin') renderAdminPro(memberSince);
        else renderFree(memberSince);
      }).catch(function (err) {
        console.error('[certanvil-managesub] profile fetch failed', err);
        if (elLoading) elLoading.setAttribute('hidden', '');
        if (elContent) elContent.removeAttribute('hidden');
        renderFree(memberSince);
      });
    }).catch(function (err) {
      console.error('[certanvil-managesub] getSession failed', err);
      if (elLoading) elLoading.setAttribute('hidden', '');
      if (elAnonGate) elAnonGate.removeAttribute('hidden');
    });
  }

  init();
})();
