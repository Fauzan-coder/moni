# Validation — 24 October 2026

Completed:

- TypeScript strict type check.
- Thirty tests, including six account checks, twelve journal/ledger checks and palette text-contrast checks: UPI validation; integer amounts/dates; duplicate candidates; cross-ID reference deduplication; notification false positives; malformed restore rejection; concurrent revision convergence; tombstones/recovery; sample labeling.
- Web production export.
- Android production JavaScript/Hermes export.
- Android prebuild, including SQLCipher configuration and discovery of the local Kotlin Expo module.
- Expo dependency compatibility check, using the installed SDK's bundled version map.
- Browser visual inspection of the colorful matte dashboard at desktop and 400px phone width. The compact Settings layout was also inspected at both widths: 12px mobile page margins, 16px card padding, 12px section gaps, and two desktop columns.
- Browser Settings verified to show “No accounts yet” after the account-default fix.
- New-user account list is empty, arbitrary user labels are accepted and normalized, restored accounts are discovered, deleted samples cannot leak seeded banks, and notification suggestions leave the account unselected.
- Browser transaction creation, immediate dashboard totals, activity listing, editor prefill, deletion confirmation and return of totals to zero. The synthetic `Preview check` entry was deleted through the app and remains only in that preview's recoverable revision history.
- Browser lending flow: created a tracking-only loan, recorded a partial repayment, verified the remaining balance and per-person running ledger, saved a linked financial note, then deleted both temporary records. No active synthetic loan/note remains.
- Loan tests verify repayment undo, cascading deletion and restoration, concurrent overpayment review, cash-flow exclusion from earnings/spending, mixed lent/borrowed person ledgers and schema-2/legacy restore.
- Console inspection: no JavaScript runtime errors. A missing preview favicon was observed; a brand icon/favicon was subsequently configured. Slow-font-loading notices appeared during first load; fonts are bundled locally.

The custom Android Kotlin module and Expo Modules Core compile successfully (`:moni-android:compileDebugKotlin`, Gradle 9, Java 21 host / Java 17 toolchain). The native UPI chooser, notification listener and encrypted review queue passed compilation. Standalone ARM64 release APK packaging passed with Gradle 9. The preview APK uses the generated development signing key and requires a publisher release key for distribution. Device behavior and Google OAuth are not yet verified.

Still require a real signed Android build and device:

- Scan a real UPI QR, verify amount/payee and chooser with several installed UPI apps, return without authorizing a payment if testing only. Check cancellation, pending state and process-death recovery.
- Verify SQLCipher storage and Keystore behavior after restart. Never uninstall a real-data build without an export or verified Drive copy.
- Configure the publisher's OAuth clients/signing fingerprints, then verify native Google sign-in, permission denial, token refresh, offline queue, two-device conflicts, manual sync and background scheduling.
- Check notification access disclosure, denied/revoked permissions, supported package alerts and false positives on target Android/OEM versions. Package filters have not been validated against current live bank alerts.
- Test native JSON sharing and restore through Android's document picker.
- Check reduced-motion/accessibility preferences and screen readers on target devices. Transitions are short; full reduced-motion adaptation is not implemented.

This is an implementation ready for Android integration testing, not a claim of store-readiness or guaranteed transaction detection.

## 25 October date-entry fix

- Normalizes unpadded year-month-day form entries before validating or saving; backup document validation remains strict.
- Added two regression tests for the reported date, leap years, impossible dates and optional blanks.
- Added native Android DatePickerDialog to transaction, loan, due-date and repayment fields; cancellation keeps the current value.
- Disabled unavailable Google sign-in button; publisher OAuth setup is still required.
- TypeScript and all 30 tests pass. Calendar runtime behavior still needs phone verification.
- Updated ARM64 APK build passed, including native calendar module compilation; APK signing verification passed with the same preview certificate.

## Google OAuth configuration — 25 October

- Added the supplied public Web OAuth client ID through ignored local `.env`. No client secret used.
- TypeScript and ARM64 APK build passed. Verified client ID in the packaged Hermes bundle and verified the APK signature remains the preview certificate.
- Real Google sign-in and Drive sync still require device testing and correct Cloud Android OAuth client, Drive API and test-user configuration.

## Drive 403 diagnostics — 25 October

- Parses Google Drive and RPC error reasons into specific remedies for disabled API, missing scope, domain policy, quota and rate limits. Unknown raw server messages/tokens are not shown.
- TypeScript and all 33 tests pass, including three Drive error regression tests. The reported device 403 still requires the detailed reason or Cloud configuration verification; no claim of a confirmed root cause.
