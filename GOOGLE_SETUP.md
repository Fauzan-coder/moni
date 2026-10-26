# Google Drive setup for your build

Users connect through Settings after the publisher completes this once. No Firebase or backend is required.

1. Open https://console.cloud.google.com/ and create/select a project named Moni.
2. APIs & Services → Library → Google Drive API → Enable.
3. Google Auth Platform → Get started: app name Moni, your support/contact email, External audience. Under Audience, keep Testing and add the Google emails that will use the preview as Test users.
4. Data Access → Add or remove scopes → add `https://www.googleapis.com/auth/drive.appdata`. Save.
5. Generate your Android project with `npx expo prebuild --platform android`, then run `cd android && ./gradlew signingReport` to obtain your build certificate SHA-1. For a signed APK, `apksigner verify --print-certs path/to/app.apk` gives its actual signing fingerprint. Clients → Create client → Android. Use package `in.moni.expenses` (or your customized package) and **your own** signing certificate SHA-1.

6. Clients → Create client → Web application. Name: Moni sign-in. Browser origins and redirect URIs are not required by this native SDK flow. Copy the Client ID ending in `.apps.googleusercontent.com`.
7. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to it. Never share or embed a client secret.
8. Rebuild the Android APK, install as an update without uninstalling, and use Settings → Connect Google Drive. Select an allowed test account, grant private app storage, and verify last sync.

Development signing certificates are not production identities. Register the production/Google Play signing certificate when distributing a release. Menu labels may change in Google Cloud Console. Native Google sign-in needs a device with compatible Google Play services.

The unconfigured APK cannot sign in just by creating Cloud clients: the Web Client ID must be included in a new build. All local features continue working without it.

References: https://react-native-google-signin.github.io/docs/setting-up/get-config-file?firebase-or-not=cloud-console and https://developers.google.com/workspace/guides/configure-oauth-consent
