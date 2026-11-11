# Wayfarer — Frontend (AI Trip Planner)

Mobile app for planning trips with an AI assistant, built with Expo and React Native.

## Download

**[Download the Android APK](https://expo.dev/accounts/naingminthant/projects/ai-trip-planner/builds/cd0e70dc-10fb-42d0-8aa9-cbad1aac9614)** — open the link on an Android device , install the `.apk`, and allow installs from unknown sources if prompted.

## Features

- **AI assistant** — chat with an AI agent to plan a trip, then save its suggestion as a trip in one tap
- **Trips** — create and edit trips, with itinerary, bookings, packing list and photos per trip
- **Explore** — browse destinations and view destination details
- **Sharing** — share a trip with family and friends, manage members and chat with them in real time
- **Accounts** — email sign in / sign up, Google sign-in, profile and travel profile

## Screenshots

Screens from the app running on Android.

### Launch and onboarding

<table>
  <tr>
    <td align="center"><img src="docs/app_images/1-app_icon.jpg" width="200" alt="App icon"><br><sub>App icon</sub></td>
    <td align="center"><img src="docs/app_images/2-SplashScreen.jpg" width="200" alt="Splash screen"><br><sub>Splash screen</sub></td>
    <td align="center"><img src="docs/app_images/3-onBoardingPage.jpg" width="200" alt="Onboarding"><br><sub>Onboarding</sub></td>
  </tr>
</table>

### Sign in and sign up

<table>
  <tr>
    <td align="center"><img src="docs/app_images/4-signIn.jpg" width="200" alt="Sign in"><br><sub>Sign in</sub></td>
    <td align="center"><img src="docs/app_images/5-signUp.jpg" width="200" alt="Sign up"><br><sub>Sign up</sub></td>
  </tr>
</table>

### Home and Explore

<table>
  <tr>
    <td align="center"><img src="docs/app_images/6-homePage-1.jpg" width="200" alt="Home, top"><br><sub>Home (1)</sub></td>
    <td align="center"><img src="docs/app_images/7-homePage-2.jpg" width="200" alt="Home, scrolled"><br><sub>Home (2)</sub></td>
    <td align="center"><img src="docs/app_images/8-Explore.jpg" width="200" alt="Explore"><br><sub>Explore</sub></td>
    <td align="center"><img src="docs/app_images/9-ExploreDetail.jpg" width="200" alt="Explore detail"><br><sub>Explore detail</sub></td>
  </tr>
</table>

### My trips and trip form

<table>
  <tr>
    <td align="center"><img src="docs/app_images/10-MyTrip.jpg" width="200" alt="My trips"><br><sub>My trips</sub></td>
    <td align="center"><img src="docs/app_images/11-TripForm-1.jpg" width="200" alt="Trip form, step 1"><br><sub>Trip form (1)</sub></td>
    <td align="center"><img src="docs/app_images/12-TripForm-2.jpg" width="200" alt="Trip form, step 2"><br><sub>Trip form (2)</sub></td>
  </tr>
</table>

### Trip detail

<table>
  <tr>
    <td align="center"><img src="docs/app_images/22-TripDetail_Itineary.jpg" width="200" alt="Trip detail, itinerary"><br><sub>Itinerary</sub></td>
    <td align="center"><img src="docs/app_images/23-TripDetail-Bookings.jpg" width="200" alt="Trip detail, bookings"><br><sub>Bookings</sub></td>
    <td align="center"><img src="docs/app_images/24-TripDetail-Packings.jpg" width="200" alt="Trip detail, packing list"><br><sub>Packing list</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/app_images/25-TripDetail-Photos.jpg" width="200" alt="Trip detail, photos"><br><sub>Photos</sub></td>
    <td align="center"><img src="docs/app_images/26-TripDetail-Share.jpg" width="200" alt="Trip detail, share"><br><sub>Share</sub></td>
    <td></td>
  </tr>
</table>

### AI assistant

<table>
  <tr>
    <td align="center"><img src="docs/app_images/18-AIAssistantPage.jpg" width="200" alt="AI assistant"><br><sub>AI assistant</sub></td>
    <td align="center"><img src="docs/app_images/19-AIConversation.jpg" width="200" alt="AI conversation"><br><sub>Conversation</sub></td>
    <td align="center"><img src="docs/app_images/20-AIResponseWithSaveTrip.jpg" width="200" alt="AI response with save trip"><br><sub>Response with Save trip</sub></td>
    <td align="center"><img src="docs/app_images/21-SaveTripFromAIResponse.jpg" width="200" alt="Saving a trip from the AI response"><br><sub>Saving the trip</sub></td>
  </tr>
</table>

### Shared trips and members

<table>
  <tr>
    <td align="center"><img src="docs/app_images/13-SharedTrip.jpg" width="200" alt="Shared trips"><br><sub>Shared trips</sub></td>
    <td align="center"><img src="docs/app_images/14-Members.jpg" width="200" alt="Members"><br><sub>Members</sub></td>
    <td align="center"><img src="docs/app_images/15-MemberChatDetail.jpg" width="200" alt="Member chat"><br><sub>Member chat</sub></td>
  </tr>
</table>

### Profile and account

<table>
  <tr>
    <td align="center"><img src="docs/app_images/16-Profile.jpg" width="200" alt="Profile"><br><sub>Profile</sub></td>
    <td align="center"><img src="docs/app_images/17-AccountDetail.jpg" width="200" alt="Account detail"><br><sub>Account detail</sub></td>
  </tr>
</table>

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

The app uses the URL scheme `wayfarer://`. The backend handles the OAuth code flow and redirects back to the app.

- **Android (USB/emulator):** run `npm run oauth:bridge` so the device's `localhost:3000` reaches the backend.
- **iPhone / other devices:** use an https tunnel for the backend and point `EXPO_PUBLIC_API_URL` at `<tunnel>/api`.

- **Release builds (APK):** the backend's `OAUTH_PUBLIC_URL` must be the deployed https URL, and `OAUTH_ALLOWED_REDIRECTS` must be `wayfarer://`. The scheme in `app.json` must match.

See the [backend README](../backend/README.md#google-sign-in-on-a-device) for the full setup.

## Building an APK

Builds run in Expo's cloud (EAS) from the committed git repo.

1. Set `EXPO_PUBLIC_API_URL` in `eas.json` (`build.preview.env`) to `https://<service>.onrender.com/api`. `.env` is not read by cloud builds, and the value is baked into the app.
2. Commit your changes.
3. Build:
   ```bash
   npx eas-cli login
   npx eas-cli build -p android --profile preview   # installable .apk
   ```
4. `--profile production` builds an `.aab` for Google Play.

Any change to `src/` needs a new build; backend changes do not. Native Android map tiles need a Google Maps API key in `app.json` (`android.config.googleMaps.apiKey`).
