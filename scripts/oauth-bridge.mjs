/**
 * Makes `localhost:3000` on an attached Android device point at the backend on this machine,
 * so Google's OAuth redirect can actually be loaded by the device's browser.
 *
 * Why this exists: Google only accepts `https://…`, `http://localhost` or `http://127.0.0.1`
 * as a redirect URI, and rejects a LAN IP outright. So `OAUTH_PUBLIC_URL` has to be
 * `http://localhost:3000` — but on a phone, `localhost` is the phone, which is why the
 * browser shows ERR_CONNECTION_REFUSED after consent. `adb reverse` closes that gap.
 *
 * The alternative, for a device that is not on USB (or for iOS), is an https tunnel —
 * see memory/08-environment.md.
 *
 * Usage: npm run oauth:bridge
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const API_PORT = process.env.PORT ?? '3000';

/** adb is not on PATH in a default Android Studio install on Windows, so look for it. */
function resolveAdb() {
  const candidates = [];
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
    process.env.HOME ? join(process.env.HOME, 'Library', 'Android', 'sdk') : null,
    process.env.HOME ? join(process.env.HOME, 'Android', 'Sdk') : null,
  ].filter(Boolean);

  for (const root of sdkRoots) {
    for (const binary of ['adb.exe', 'adb']) {
      candidates.push(join(root, 'platform-tools', binary));
    }
  }

  const found = candidates.find((candidate) => existsSync(candidate));
  // Falling back to the bare name covers the case where adb *is* on PATH.
  return found ?? 'adb';
}

const adb = resolveAdb();

function adbRun(args) {
  return execFileSync(adb, args, { encoding: 'utf8' });
}

try {
  const devices = adbRun(['devices'])
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.endsWith('device'));

  if (devices.length === 0) {
    console.error('No Android device or emulator is attached.');
    console.error('Connect the phone by USB with debugging enabled, or start an emulator.');
    console.error('For a Wi-Fi-only phone or an iPhone, use an https tunnel instead —');
    console.error('see memory/08-environment.md, "Google sign-in — env vars and the localhost trap".');
    process.exit(1);
  }

  adbRun(['reverse', `tcp:${API_PORT}`, `tcp:${API_PORT}`]);
  console.log(`Bridged device localhost:${API_PORT} -> this machine's port ${API_PORT}.`);
  console.log('Google sign-in will now complete on the device. Re-run after a reconnect.');
} catch (error) {
  console.error(`Could not run adb (${adb}).`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
