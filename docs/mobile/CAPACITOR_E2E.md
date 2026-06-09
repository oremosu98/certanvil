# CertAnvil iOS E2E — Capacitor wrap (Phase 6)

Wraps the clickable E2E shell (`mockups/cert-ios-app.html` + the `cert-ios-*` /
`onboarding-*` mockups) as a Capacitor **WKWebView** app so it runs on the iOS
Simulator / a device — the "app on a phone" feel and the App Store bridge.

**Status:** scaffold complete (toolchain-independent part). The native build needs
**full Xcode + CocoaPods**, which weren't installed when this was set up. Once those
are present it's two commands.

---

## What's already wired (committed)
- `@capacitor/{core,cli,ios}` (all **v7**, lockstep) in `devDependencies`.
- `capacitor.config.json` — `appId: com.certanvil.e2e`, `appName: CertAnvil E2E`,
  `webDir: capacitor-www`.
- **webDir assembly** — `npm run ios:www` copies `mockups/` → `capacitor-www/` and
  copies the shell to `capacitor-www/index.html` (Capacitor always loads
  `index.html`). Everything in the shell is sibling-relative (`e2e/shell.js` + bare
  `*.html`), so the copy "just works". `capacitor-www/` is git-ignored (build artifact).
  Verified: the assembled bundle boots (window.E2E present, screens render).
- npm scripts: `ios:www`, `ios:add`, `ios:sync`, `ios:open`, `ios:run`.

## Prerequisites (operator — one-time)
1. **Xcode** (App Store, multi-GB). Then:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept
   ```
2. **CocoaPods**:
   ```bash
   sudo gem install cocoapods      # no Homebrew on this machine
   ```
3. First Simulator runtime downloads on first launch (Xcode ▸ Settings ▸ Platforms).

## Finish the wrap (after prerequisites)
```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd ".claude/worktrees/cert-ios-e2e"

npm run ios:add     # assembles capacitor-www, then `cap add ios` (runs pod install)
npm run ios:run     # assembles + `cap sync ios` + launches on the Simulator
# or: npm run ios:open  → open in Xcode and Run (⌘R) to pick a device
```
`cap add ios` generates the native `ios/` project. Decide whether to commit it
(Capacitor convention is yes); it's currently untracked, not force-ignored.

## Re-syncing after a mockup/shell change
```bash
npm run ios:sync    # re-copies webDir + `cap sync ios`
```

## ⚠️ Fidelity on WKWebView (the open tension — do this early)
WKWebView (what Capacitor uses) renders fonts / antialiasing / scroll-momentum /
tap-highlight differently from Mobile Safari, so a layout pixel-identical in one may
not be in the other. The Phase 5 fidelity harness
(`tests/e2e/cert-ios-fidelity.spec.js`) currently runs against **Chromium**. To catch
WKWebView deltas screen-by-screen:
- Run the app on the Simulator and eyeball each screen × both themes against the
  Chromium baselines first.
- For an automated WKWebView gate, drive Mobile-Safari/WebKit via the existing
  `webkit` / `mobile-safari` Playwright projects, or Appium against the Simulator —
  treat as a follow-up; don't block the first Simulator run on it.

## Notes
- **Demo HUD ships in this build** — it's a dummy/demo wrap, not a store submission.
  Strip `#hud` from `mockups/cert-ios-app.html` (or hide via Capacitor config) before
  any real distribution.
- **No StoreKit / Apple-auth** — paywall is UI-only (parked alongside Stripe), per D6.
- Bundle id `com.certanvil.e2e` is a demo placeholder — change before any real
  provisioning profile / App Store record.
