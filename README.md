# ZoneTalk — Expo React Native

This is the Expo / React Native port of the original ZoneTalk Vite web app.
Same features (auth, DMs, groups, zone radar, live map, 24h self-deleting
messages, images/files/voice notes, text-to-speech) rebuilt with native
components instead of the DOM.

## Setup

```bash
npm install
npx expo run:android
# or
npx expo run:ios
# then on later runs
npm start
```

This project now defaults to a development build workflow instead of Expo Go.
Use `npm start` to connect Metro to the installed development client.

If you want the old Expo Go flow for quick smoke tests, run:

```bash
npm run start:go
```

## What changed vs. the web version

| Web (Vite/DOM)                         | Expo / React Native                              |
|-----------------------------------------|----------------------------------------------------|
| `div`/`button`/Tailwind classes         | `View`/`TouchableOpacity`/`StyleSheet`             |
| `react-router` split-pane (mobile/desktop) | `@react-navigation` stack (Home → Chat → Map)   |
| `localStorage` / `sessionStorage`       | `@react-native-async-storage/async-storage`        |
| `navigator.geolocation`                 | `expo-location`                                    |
| `react-leaflet` / Leaflet               | `react-native-maps`                                |
| `<input type="file">` for photo         | `expo-image-picker`                                |
| `<input type="file">` for attachments   | `expo-document-picker` + `expo-file-system`        |
| `MediaRecorder` for voice notes         | `expo-av` (`Audio.Recording` / `Audio.Sound`)      |
| `speechSynthesis`                       | `expo-speech`                                      |
| Firebase Web SDK                        | Same Firebase JS SDK, with `initializeAuth` +      |
|                                          | `getReactNativePersistence(AsyncStorage)`          |

## Notes / things to double check before shipping

- **Google Sign-In** used `signInWithPopup` on web, which doesn't exist on
  native. It's stubbed out (`auth.js`) with a friendly error. To wire it up
  for real, add `expo-auth-session` + `@react-native-google-signin` and
  exchange the native credential with `signInWithCredential`.
- **react-native-maps on Android** needs a Google Maps API key — set it in
  `app.json` under `expo.android.config.googleMaps.apiKey`. iOS uses Apple
  Maps by default and needs no key.
- **Firestore rules**: this reuses the same Firebase project config as the
  web app (`src/lib/firebase.js`). Make sure your Firestore security rules
  allow the mobile app's auth users the same read/write access.
- Voice notes and file attachments are stored as base64 data URIs, same
  approach as the original web app — fine for demo use, but for production
  you'll likely want to upload to Firebase Storage instead of embedding
  base64 blobs in Firestore/AsyncStorage.
- Run `npx expo install` once to make sure native module versions match
  your installed Expo SDK exactly (versions in `package.json` target Expo
  SDK 52 — adjust if you're on a different SDK).
