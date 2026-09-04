# Crash analytics

Ambire sends anonymous crash reports to a self-hosted Sentry, so we can find and fix bugs without asking anyone to reproduce them.

Crash reports can accidentally pick up things a wallet must never send out: a private key, a seed phrase, a password. This document lists everything we do to stop that, in the code and in our Sentry settings.

## Where it runs

| Surface | Reports | Code |
| --- | --- | --- |
| Extension UI (popup, side panel, tab) | Yes | [`instrument.ts`](../../../web/utils/instrument.ts) |
| Extension background | Yes | [`background.ts`](../../../web/extension-services/background/background.ts) |
| Ambire Rewards | Yes, separate project | [`instrument.ts`](../../../legends/instrument.ts) |
| Mobile app | No | [stubs](./CrashAnalytics.ts) |
| Explorer | No | |

`sendDefaultPii: false` is set everywhere, so Sentry does not attach IP addresses or request headers.

## What is stripped before a report leaves your browser

[`sentryDataScrubbing.ts`](./sentryDataScrubbing.ts) runs over the whole report. It works on a copy, so nothing in the app itself changes.

**By shape**

- Any 64-character hex value becomes `[REDACTED_PRIVATE_KEY]`, labeled or not.
- Any run of 12 to 24 words that are all in the BIP-39 wordlist becomes `[REDACTED_SEED_PHRASE]`. Labeled or not, capitalized or not, and also when it sits in the middle of a longer sentence.

**By field name**

A password has no recognizable shape, so its field name is the only signal. Any value under a field name containing one of these is replaced with `[REDACTED]`, whatever it holds:

```
pass  pwd  secret  mnemonic  seed  privatekey  privkey  entropy
```

**If stripping itself fails**

The report can no longer be trusted, so it is thrown away. We send a short `[SCRUBBING_FAILED]` marker carrying only the internal error, never the original report.

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

The two patterns are the same private key and seed phrase shapes as above. 

## Tests

[`sentryDataScrubbing.test.ts`](./sentryDataScrubbing.test.ts) covers every rule above.

```sh
yarn test src/common/config/analytics/sentryDataScrubbing.test.ts
```
