# Contribute to Moni

Moni is an open source, local-first Android money tracker. Contributions of all sizes are welcome: bug reports, documentation, accessibility improvements, translations, tests, design refinements and code.

## Getting started

1. Fork the repository and clone your fork.
2. Install Node 22+, run `npm ci`, then `npm run web` for the browser preview.
3. Create a branch for one focused change. Use the explicit sample tour or invented data, never real financial records.
4. For native features, follow the Android setup in README.md. Expo Go cannot run the custom native module.
5. Run `npm run typecheck` and `npm test`. Run `npm run build:web` when changing browser-compatible code. Test Android changes on a device and state what you tested.
6. Open a pull request explaining the problem, the resulting behavior, validation, and any limitations. Add screenshots for visual changes using only demo data.

Please discuss major changes in an issue before starting. Small fixes can go straight to a pull request. Contributions are accepted under the repository's MIT license; retain applicable third-party notices.

## Where help is welcome

- Real-device UPI chooser, cancellation and process-recovery testing.
- Conservative notification parsing with synthetic fixtures for supported apps. Never include OTPs, account numbers or real notification text in issues or tests.
- Google Drive conflict, reconnect and offline/background-sync testing.
- Android accessibility, font scaling, reduced motion, keyboard and small-screen polish.
- Clearer onboarding, documentation, and localization for people in India.
- Rendering large ledgers efficiently while preserving accurate balances.

## Financial-data rules

Never ask for or store UPI PINs, passwords or payment credentials. Do not add analytics, a backend, broad SMS access or new sensitive permissions without discussing the need. Keep manual/offline use available, require review of detected transactions, and do not claim every payment is detected or verified.

Never commit `.env`, OAuth secrets, signing keys, databases, backups, personal account information or screenshots containing private data. An OAuth Web Client ID is public by design, but each builder should supply their own local configuration.

## Reporting bugs

Use GitHub Issues. Include app/Android version, steps, expected and actual behavior, and a redacted or demo-data screenshot. Do not attach production databases or financial backups. For vulnerabilities, see SECURITY.md instead of opening a public issue with sensitive details.
