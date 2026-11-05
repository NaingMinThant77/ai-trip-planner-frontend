# AI Trip Planner — Frontend

Mobile app (iOS / Android / web) for planning trips with an AI assistant, built with Expo and React Native.

## Screens

Design mockups for the main flows:

| AI Agent chat | Home & Add trip | Family trip sharing |
| --- | --- | --- |
| ![AI Agent chat](docs/screenshots/ai-agent-chat.png) | ![Home and add trip](docs/screenshots/home-and-add-trip.png) | ![Family trip sharing](docs/screenshots/family-trip-share.png) |

## Tech stack

- **Expo SDK 57**, React Native 0.86, React 19
- **expo-router** — file-based routing
- **TanStack React Query** + **Axios** — data fetching
- **socket.io-client** — real-time messaging
- **react-native-maps**, **expo-image**, **expo-image-picker**, **expo-secure-store**, Reanimated

## Project structure

```
src/
  app/         Routes (expo-router)
    (auth)/        Sign in / sign up
    (onboarding)/  First-run onboarding
    (tabs)/        Main tab screens
    trip/, destination/, chat/, agent.tsx, explore.tsx,
    new-trip.tsx, edit-trip.tsx, account.tsx, travel-profile.tsx
  api/         API client and endpoints
  components/  Shared UI components
  context/     React context providers (e.g. auth)
  hooks/       Custom hooks
  lib/         Utilities
  types/       TypeScript types
  theme.ts     Design tokens
scripts/       oauth-bridge.mjs, reset-project.js
assets/        Images and fonts
```

## Getting started

### Prerequisites

- Node.js 20+ and npm
- The [backend](../backend/README.md) running locally
- Expo Go, an Android emulator, or an iOS simulator

### Setup

```bash
npm install
```

Create `frontend/.env`:

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000/api
```

Use your machine's LAN IP for a physical device (not `localhost`). For an Android emulator use `http://10.0.2.2:3000/api`.

### Run

```bash
npm start            # Expo Go
npm run android
npm run ios
npm run web
npm run start:dev-build   # development build (dev client)
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo (Expo Go) |
| `npm run android` / `ios` / `web` | Start on a specific platform |
| `npm run start:dev-build` | Start with a dev client |
| `npm run lint` | Lint with `expo lint` |
| `npm run oauth:bridge` | `adb reverse tcp:3000 tcp:3000` for Google sign-in on Android |
| `npm run reset-project` | Reset to a blank Expo starter (destructive) |

## Google sign-in

The app uses the URL scheme `aitripplanner://`. The backend handles the OAuth code flow and redirects back to the app.

- **Android (USB/emulator):** run `npm run oauth:bridge` so the device's `localhost:3000` reaches the backend.
- **iPhone / other devices:** use an https tunnel for the backend and point `EXPO_PUBLIC_API_URL` at `<tunnel>/api`.

See the [backend README](../backend/README.md#google-sign-in-on-a-device) for the full setup.
