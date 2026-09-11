# Swap & Bridge

This document describes how the Swap & Bridge feature of Ambire Wallet works, which third-party services it talks to, and what Ambire does and does not do as part of a swap.

## Summary

Ambire Wallet is a self-custodial wallet. Swap & Bridge is a **user interface** on top of independent third-party aggregators. Ambire does not operate an exchange, does not hold an order book, does not match or execute orders, and never takes custody of user funds.

Every transaction is built on the user's device, signed locally with a private key that never leaves the device, and broadcast by the user to a public blockchain. Ambire is not a counterparty to the trade.

## How a swap works

1. The user picks a source token, a destination token and an amount in the app.
2. The app requests quotes **in parallel** from every enabled provider (see below) and shows the returned routes. No funds move at this point.
3. The user selects a route. The provider returns unsigned transaction data.
4. The app builds the transaction locally, shows a human-readable preview, and asks the user to sign it with their own key.
5. The signed transaction is broadcast to the public blockchain. Settlement happens on-chain, between the user's account and the relevant public smart contracts.
6. The app polls the provider's public status endpoint to display progress.

Steps 3–5 are identical to any other transaction the wallet signs. The provider supplies routing data; it never receives or holds the user's funds, and neither does Ambire.

## Third-party service providers

Three aggregators are registered as quote providers. They are queried in parallel and the user chooses among the returned routes.

### LI.FI

Operated by LI.FI Service GmbH (Berlin, Germany).

- Base URL: `https://li.quest/v1`
- Documentation: https://docs.li.fi/
- API reference: https://docs.li.fi/api-reference/introduction
- Terms: https://li.fi/legal/terms-and-conditions

### Socket / Bungee

Operated by Socket Technologies Limited.

- Base URL: `https://dedicated-backend.socket.tech`
- Documentation: https://docs.socket.tech/
- API reference: https://docs.socket.tech/api-reference/swap/get-quotes
- OpenAPI specification: https://docs.socket.tech/openapi.json
- Terms: https://docs.socket.tech/about/tou

### Uniswap Trading API

Operated by Uniswap Labs.

- Base URL: `https://trade-api.gateway.uniswap.org/v1`
- Documentation: https://developers.uniswap.org/docs/trading/overview
- API reference: https://developers.uniswap.org/docs/api-reference
- Terms: https://uniswap.org/terms-of-service

### Across (status lookups only)

Uniswap settles some cross-chain routes through Across Protocol (operated by Risk Labs). Ambire calls a single read-only Across endpoint to report the progress of such a transfer back to the user. Across is **not** a quote provider and returns no routes.

- Endpoint used: `https://app.across.to/api/deposit/status` (read-only)
- Documentation: https://docs.across.to/
- API reference: https://docs.across.to/api-reference
- Terms: https://across.to/terms-of-service

Ambire holds an integrator API key with each of the three quote providers. The keys identify the integration for rate limiting and fee attribution; they grant Ambire no control over user funds or over the underlying protocols.

### Provider selection

From v6.20.0 the user can turn each provider on or off individually, from the settings on the Swap & Bridge screen. A disabled provider is no longer queried for quotes or for its supported chains. The preference is stored locally on the device and persists across sessions.

## Interface fee

Ambire charges an interface fee on swaps, disclosed in the app before the user confirms the transaction. The fee is a parameter passed to the provider's quote request; the provider's own smart contract routes it on-chain to an Ambire fee-collector address as part of the user's transaction. Ambire never receives, holds, or forwards the swapped funds themselves.

Up to v6.20.x the fee is a flat 0.5%. From v6.21.0 it is tiered by the amount of stkWALLET the account holds:

| stkWALLET held | Fee   |
| -------------- | ----- |
| Up to 33,000   | 0.50% |
| 33,000+        | 0.40% |
| 100,000+       | 0.25% |
| 700,000+       | 0%    |

Defined in [`fee.ts`](https://github.com/AmbireTech/ambire-common/blob/v2/src/libs/swapAndBridge/fee.ts). The applicable fee is always shown before signing.

Some routes are fee exempt, with no fee charged at all, when:

- the swap wraps or unwraps a network's native token on the same chain - ETH to WETH and back, and the equivalent on other networks;
- the source token is on a fee-exempt list, currently stETH on Ethereum;
- the route runs on a chain where fee collection is not set up.

## What Ambire does not do

- Does not take custody of, or gain control over, user funds at any point.
- Does not operate an exchange, order book, or matching engine.
- Does not act as a counterparty to any trade.
- Does not perform identity verification (KYC) - see the published [Terms of Service and Privacy Policy](https://www.ambire.com/Ambire%20ToS%20and%20PP%20%2826%20November%202021%29.pdf).
- Does not issue, mint, or sell any token through this feature.

## Where the code lives

Business logic sits in the [`ambire-common`](https://github.com/AmbireTech/ambire-common) submodule; the user interface sits in this repository.

| Concern                      | Path                                               |
| ---------------------------- | -------------------------------------------------- |
| Controller (state, flow)     | `src/ambire-common/src/controllers/swapAndBridge/` |
| Quote/route logic, fee tiers | `src/ambire-common/src/libs/swapAndBridge/`        |
| Parallel provider execution  | `src/ambire-common/src/services/swapIntegrators/`  |
| LI.FI client                 | `src/ambire-common/src/services/lifi/`             |
| Socket / Bungee client       | `src/ambire-common/src/services/socketv3/`         |
| Uniswap client               | `src/ambire-common/src/services/uniswap/`          |
| Across status client         | `src/ambire-common/src/services/across/`           |
| Shared UI                    | `src/common/modules/swap-and-bridge/`              |
| Mobile screen                | `src/mobile/modules/swap-and-bridge/`              |
| Extension screen             | `src/web/modules/swap-and-bridge/`                 |
