# Explore

This document describes how the Explore section of Ambire Wallet works, where its listings come from, what happens when a user opens one, and what Ambire does and does not do as part of it.

## Summary

Ambire Wallet is a self-custodial wallet. Explore is a **web browser with a directory of bookmarks to public websites**. Every listing is a link to an independent third-party website that is publicly available on the internet and reachable from any other browser with the same URL.

Ambire does not host, distribute, package, install, update or execute third-party software. Opening a listing does not download anything to the device, no code is delivered by Ambire, no games are listed, and nothing is sold, unlocked or purchased inside Explore. A listing is a link, not an application, and not an endorsement.

## What the Explore screen contains

| Section                      | What it is                                                                                                                            | Shown                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Search bar                   | Accepts a search term or any URL. Offers a web search, "open this URL", matching listings and matching tokens                         | Always                              |
| Explore apps                 | The featured listings (a short, hand-picked set). The `>` arrow opens the full list, browsable and filterable by network and category | Always                              |
| Trending                     | Market data for crypto assets: name, price, 24h change. Not software, see below                                                       | When the data is available          |
| Recent, Connected, Favorites | The user's own history: sites visited, sites they granted a connection to, sites they starred                                         | Only when the user has such entries |
| $WALLET Staking              | A native screen of the wallet itself, not a third-party website                                                                       | Always                              |

The featured set and the full list are two views of the same set of entries; both are covered by the index Ambire publishes with each release (see "Where the listings come from").

## What happens when a user opens a listing

| Build                     | Behaviour                                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| Mobile app (iOS, Android) | The website is loaded in an in-app browser (a system WebView) inside the wallet |
| Browser extension         | The website is opened in a normal tab of the user's own browser                 |

In both cases the site runs as an ordinary web page under its own origin, served by its own operator. The wallet injects an EIP-1193 provider (`window.ethereum`), the same interface every browser wallet exposes, so the page can _ask_ the wallet for a connection or a signature. It cannot obtain either without the user explicitly approving it in the wallet's own UI.

The in-app browser restricts what a page may navigate to:

| Scheme                                    | Handling                                             |
| ----------------------------------------- | ---------------------------------------------------- |
| `https:`, `about:`, `blob:`               | Allowed                                              |
| `wc:`, `metamask:`, `ethereum:`           | Handed to the operating system as a wallet deep link |
| `javascript:`, `data:`, `tel:`, `mailto:` | Blocked                                              |
| anything else                             | Blocked by default                                   |

Plain `http:` is not allowed. The bridge between the page and the wallet is origin-checked and token-guarded, so one site cannot act on behalf of another.

## Where the listings come from

| Source                                                                                                                             | What it contributes                                                                                    | When it is refreshed                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| A list shipped inside the app binary ([`dapps.ts`](https://github.com/AmbireTech/ambire-common/blob/v2/src/consts/dapps/dapps.ts)) | The hand-picked entries, including the featured ones                                                   | With an app release                                |
| The public [DefiLlama](https://defillama.com) protocol directory (`https://api.llama.fi/protocols` and `/v2/chains`)               | The long tail of known DeFi protocol websites, after filtering                                         | Once per app version, on first run of that version |
| The user                                                                                                                           | Sites the user opens or connects to are kept under Recent, Connected and Favorites, on the device only | As the user browses                                |

Because the DefiLlama fetch runs only when the installed app version changes, **the set of listings is effectively pinned to an app release**: an index produced for a given version stays accurate for that version.

## Curation

Entries coming from the public directory are filtered before they are listed:

- Whole categories are excluded, currently centralised exchanges and developer tooling.
- An explicit exclusion list drops individual protocols; a second list drops entries that became stale (renamed, merged, shut down, moved domain).
- Non-EVM-only protocols are dropped, as the wallet cannot interact with them.
- Entries with no supported network, or with a total value locked below a threshold, are dropped unless they are hand-picked, hand-listed by domain, or a DEX aggregator.
- Entries that resolve to the same domain are de-duplicated.

Hand-picked entries, entries the user added, and entries the user is connected to are never filtered out by these rules.

## Safety checks

Every listing's domain is checked against Ambire's scam and phishing service (`https://cena.ambire.com/api/v3/scamchecker`), and the result is re-checked as the lists change:

| Status               | Meaning                                                                                                       | Effect                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BLACKLISTED`        | The domain is in a phishing database                                                                          | Removed from Explore; if the site is reached anyway, the browser marks it as unsafe and every connection or signing request from it carries a warning |
| `SUSPICIOUS_HOSTING` | The site is hosted on a shared user-content platform that legitimate protocols do not use as a primary domain | Listed, but a warning banner is shown before signing anything                                                                                         |
| `VERIFIED`           | Neither of the above                                                                                          | Listed normally; a milder notice still appears for sites Ambire does not list in Explore                                                              |

Because this check is served from Ambire's backend, a domain that turns malicious can be blocked and taken out of Explore on every installed copy of the app **without an app update**.

A site loaded as an iframe inside a page on a suspicious domain inherits the warning, since the top-level origin is reported by the browser and cannot be forged by the page.

## Connections and permissions

A listed site starts with no access to anything. To interact with the wallet it must request a connection, which the user approves explicitly and can scope to specific accounts. Every subsequent action - a signature, a transaction - is a separate request that is shown in the wallet's own UI, in human-readable form, and signed on the device with a key that never leaves it.

The user can review connected sites, disconnect one or all of them, restrict which accounts a site sees, and remove entries from Recent and Favorites at any time.

## Trending tokens

The Trending section lists market data for crypto assets: name, price and 24h change, served by Ambire's price service (`https://cena.ambire.com`). Tapping an entry opens a native screen inside the wallet with that asset's data; the only outbound link there is a reference link to the asset's public CoinGecko page. No third-party software is opened or run, and these entries are therefore not part of the app index.

## What Ambire does not do

- Does not host, distribute, install, update or execute any third-party software, in any packaged or downloadable form.
- Does not list games, and does not run any streaming, emulated or embedded game software.
- Does not sell anything, take a fee, or process a payment in Explore. Ambire has no commercial relationship with a site by virtue of listing it.
- Does not take custody of, or gain control over, user funds at any point.
- Does not act as a counterparty to anything a user does on a listed site.
- Does not endorse a listed site or vouch for its content; a listing is a bookmark to a public website.

## Reporting and removal

A listing can be reported through the Ambire help centre at https://help.ambire.com/en. Domains found to be malicious are added to the scam and phishing service and disappear from Explore on all installs without an app update; other removals ship with the next release.

## Where the code lives

Business logic sits in the [`ambire-common`](https://github.com/AmbireTech/ambire-common) submodule; the user interface sits in this repository.

| Concern                         | Path                                          |
| ------------------------------- | --------------------------------------------- |
| Controller (listings, sessions) | `src/ambire-common/src/controllers/dapps/`    |
| Hand-picked list, filter rules  | `src/ambire-common/src/consts/dapps/dapps.ts` |
| Listing helpers (ids, sorting)  | `src/ambire-common/src/libs/dapps/`           |
| Scam and phishing checks        | `src/ambire-common/src/controllers/phishing/` |
| Shared UI                       | `src/common/modules/explore/`                 |
| Mobile screens                  | `src/mobile/modules/explore/`                 |
| Mobile in-app browser           | `src/mobile/modules/webview/`                 |
| Extension screens               | `src/web/modules/explore/`                    |
