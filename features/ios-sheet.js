/* Lift B3b1 (v8.188.0): the phone bottom sheets, shared by the exam and Sim Lab.
 * Loaded eagerly (defer) because features/exam.js and features/sim-lab.js are lazy.
 *  - iosSheet({title, body, go, stay}) -> Promise<boolean>: the confirm sheet (#exam-sheet), moved
 *    unchanged from B2's _examSheet. Resolves true for go, false for stay (Stay, the scrim, Escape).
 *  - iosEnlarge(node, title): a full-height sheet (#isl-enlarge) holding a copy of a passive
 *    Sim Lab reference so a diagram can be read at size. Only one sheet is open at a time. */
(function () {
  'use strict';

  var _open = null;   // close(val) of the open confirm sheet
  function iosSheet(o) {
    var sheet = document.getElementById('exam-sheet'), scrim = document.getElementById('exam-sheet-scrim');
    if (!sheet || !scrim) return Promise.resolve(false);
    if (_open) return Promise.resolve(false);
    if (window.iosEnlarge && window.iosEnlarge.close) window.iosEnlarge.close();
    return new Promise(function (resolve) {
      var back = document.activeElement;
      var stay = sheet.querySelector('.ix-sheet-stay'), go = sheet.querySelector('.ix-sheet-go');
      document.getElementById('exam-sheet-title').textContent = o.title;
      sheet.querySelector('.ix-sheet-body').textContent = o.body;
      stay.textContent = o.stay; go.textContent = o.go;
      function close(val) {
        if (_open !== close) return;
        _open = null;
        window.removeEventListener('keydown', onKey, true);
        sheet.classList.remove('open'); scrim.classList.remove('open');
        setTimeout(function () { if (!sheet.classList.contains('open')) { sheet.hidden = true; scrim.hidden = true; } }, 200);   // BRAND §6: sheet out 200ms
        if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (_) {}
        resolve(val);
      }
      // Keys belong to the sheet while it is open: nothing reaches the screen underneath
      // (in the exam A-E would change the answer, F the flag, Escape would close the End dialog too).
      function onKey(e) {
        e.stopImmediatePropagation();
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
        else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === stay ? go : stay).focus({ preventScroll: true }); }
        else if (document.activeElement !== stay && document.activeElement !== go) e.preventDefault();
      }
      _open = close;
      stay.onclick = function () { close(false); };
      go.onclick = function () { close(true); };
      scrim.onclick = function () { close(false); };
      window.addEventListener('keydown', onKey, true);   // window capture: ahead of the page's own key handlers
      sheet.hidden = false; scrim.hidden = false;
      void sheet.offsetHeight;   // commit the closed state so the slide-in runs
      sheet.classList.add('open'); scrim.classList.add('open');
      stay.focus({ preventScroll: true });
    });
  }
  // Closes an open confirm sheet as "stay". Called when the screen under it goes away
  // (an exam submit, a Sim Lab round ending), so a sheet never outlives its question.
  iosSheet.dismiss = function () { if (_open) _open(false); if (window.iosEnlarge && window.iosEnlarge.close) window.iosEnlarge.close(); };   // both sheets go with their screen
  iosSheet.isOpen = function () { return !!_open; };
  window.iosSheet = iosSheet;

  var _enl = null;   // { close } while the enlarge sheet is open
  function iosEnlarge(node, title) {
    var sheet = document.getElementById('isl-enlarge'), scrim = document.getElementById('isl-enlarge-scrim');
    if (!sheet || !scrim || !node) return;
    iosSheet.dismiss();
    if (_enl) _enl.close();
    var body = sheet.querySelector('.isl-es-body'), head = sheet.querySelector('.isl-es-head');
    var closeBtn = sheet.querySelector('.isl-es-close');
    var copy = node.cloneNode(true);
    copy.removeAttribute('id');
    [].forEach.call(copy.querySelectorAll('[id]'), function (el) { el.removeAttribute('id'); });
    // Sim Lab diagrams are styled under their page (#page-sim-lab X, #page-exam .exam-pbq X), so the
    // sheet opens inside that page and, in the exam, the copy sits in an .exam-pbq wrapper.
    var pg = node.closest && node.closest('.page');
    if (pg && sheet.parentNode !== pg) { pg.appendChild(scrim); pg.appendChild(sheet); }
    if (node.closest && node.closest('.exam-pbq')) { var w = document.createElement('div'); w.className = 'exam-pbq'; w.appendChild(copy); copy = w; }
    body.innerHTML = '';
    body.appendChild(copy);
    body.scrollTop = 0; body.scrollLeft = 0;
    document.getElementById('isl-enlarge-title').textContent = title || '';
    var back = document.activeElement, y0 = null;
    function close() {
      if (!_enl || _enl.close !== close) return;
      _enl = null;
      window.removeEventListener('keydown', onKey, true);
      head.removeEventListener('touchstart', onStart);
      head.removeEventListener('touchend', onEnd);
      sheet.classList.remove('open'); scrim.classList.remove('open');
      setTimeout(function () { if (!sheet.classList.contains('open')) { sheet.hidden = true; scrim.hidden = true; body.innerHTML = ''; } }, 200);
      if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (_) {}
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(); } }
    function onStart(e) { y0 = e.touches && e.touches[0] ? e.touches[0].clientY : null; }
    function onEnd(e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (y0 != null && t && t.clientY - y0 > 80) close();
      y0 = null;
    }
    _enl = { close: close };
    closeBtn.onclick = close;
    scrim.onclick = close;
    window.addEventListener('keydown', onKey, true);
    head.addEventListener('touchstart', onStart, { passive: true });
    head.addEventListener('touchend', onEnd);
    sheet.hidden = false; scrim.hidden = false;
    void sheet.offsetHeight;
    sheet.classList.add('open'); scrim.classList.add('open');
    closeBtn.focus({ preventScroll: true });
  }
  iosEnlarge.close = function () { if (_enl) _enl.close(); };
  window.iosEnlarge = iosEnlarge;
})();
