# Crash analytics

Ambire sends anonymous crash reports to a self-hosted Sentry, so we can find and fix bugs without asking anyone to reproduce them.

Our goal is to send only the data that's useful for debugging, and nothing that could compromise the user's security or privacy.

Debug data is stripped at multiple points before it's sent, and we don't rely on a single safeguard: there are several independent layers of protection, both in our code and in our Sentry config (both shared in details below), preventing secrets from ever reaching our database.

## Where it runs

| Surface | Reports | Code |
| --- | --- | --- |
| Extension UI (popup, side panel, tab) | Yes | [`instrument.ts`](../../../web/utils/instrument.ts) |
| Extension background | Yes | [`background.ts`](../../../web/extension-services/background/background.ts) |
| Ambire Rewards | Yes, separate project | [`instrument.ts`](../../../legends/instrument.ts) |
| Mobile app (JS and native crashes) | Yes, separate project | [`CrashAnalytics.ts`](./CrashAnalytics.ts) |
| Explorer | No | |

`sendDefaultPii: false` is set everywhere, so Sentry does not attach IP addresses or request headers.

## What is stripped before a report leaves your device

[`sentryDataScrubbing.ts`](./sentryDataScrubbing.ts) runs over the whole report. It works on a copy, so nothing in the app itself changes.

**By shape**

- Any 64-character hex value becomes `[REDACTED_PRIVATE_KEY]`, labeled or not.
- Any run of 12 to 24 words that are all in the BIP-39 wordlist becomes `[REDACTED_SEED_PHRASE]`. Labeled or not, capitalized or not, and also when it sits in the middle of a longer sentence.

**By field name**

Any value under a field name containing one of these is replaced with `[REDACTED]`, whatever it holds (`SENSITIVE_KEY_SUBSTRINGS`):

```
pass  pwd  secret  mnemonic  seed  privatekey  privkey  entropy
```

**If stripping itself fails**

The report can no longer be trusted, so it is thrown away. We send a short `[SCRUBBING_FAILED]` marker carrying only the internal error, never the original report.

## Mobile app

The app reports to its own Sentry project, `mobile`. The same stripping and noise filtering as the extension run on every JS report, through the shared [`processCrashReportEvent.ts`](./processCrashReportEvent.ts).

**What's kept out on purpose**

- Tap breadcrumbs, which would carry the text of what was tapped, like seed words or balances.
- Screenshots, the view hierarchy and accessibility identifiers.
- Tracing, profiling, replay and Sentry logs.
- Sessions, which would report every app start, not only crashes.

**Where a report came from** is in its `content` tag.

| Tag | Source |
| --- | --- |
| `ui` | `captureException` and `captureMessage` from screens and hooks |
| `controllers` | Controller errors, failed actions and controller host failures |
| `webview` | The WebView worker, its errors and its process being killed |
| `unhandled` | Anything that reached the global error handlers. Filter by `stack.filename` to split controllers from UI. |

The `otaVersion` tag says which OTA update the app was running, or `default` for the bundle the store build shipped with.

**Turning it off.** The setting is read when the app starts, before Sentry starts, so with it off nothing is sent, native crashes included. Turning it off while the app runs stops JS reports right away. Turning it back on applies from the next launch, and a toast tells the user so.

**Readable stack traces.** Release builds upload their JS source maps and native debug symbols when `SENTRY_AUTH_TOKEN` is set, and CI requires it. Android does it in `android/app/build.gradle`. Each OTA update uploads its own source map in [`publish-ota.sh`](../../../../scripts/publish-ota.sh), because the map has to match the exact bundle. Sentry matches them by the debug ID the bundle and its map share, under the release `mobile-<platform>@<app version>`.

## Our Sentry scrubbing rules

Set at organization level, so they cover every project. A second pass, in case anything gets past the code above.

| Action | Applies to | Field |
| --- | --- | --- |
| Mask | Anything | `privateKey`, `private_key` |
| Mask | Anything | `seedPhrase`, `seed_phrase` |
| Mask | Anything | `recoveryPhrase`, `recovery_phrase` |
| Mask | Anything | `mnemonic` |
| Mask | Anything | `secretKey` |
| Mask | Anything | `walletKey` |
| Mask | `\b0x[a-fA-F0-9]{64}\b\|\b[a-fA-F0-9]{64}\b` | All fields |
| Mask | `\b(?:[a-z]{3,12}\s+){11,23}[a-z]{3,12}\b` | All fields |
| Remove | Anything | `extra.action` |

## Tests

[`sentryDataScrubbing.test.ts`](./sentryDataScrubbing.test.ts) covers every rule above.

```sh
yarn test src/common/config/analytics/sentryDataScrubbing.test.ts
```
