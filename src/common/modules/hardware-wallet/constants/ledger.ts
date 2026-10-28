/**
 * Identifies Ambire to the Ledger Clear Signing Registry. Shared by the web
 * (WebHID) and mobile (RN BLE/HID) Ledger `ContextModuleBuilder`s.
 *
 * Intentionally empty until we get a real token: an empty token omits the
 * `X-Ledger-Client-Origin` header, which Ledger's servers accept. An invalid
 * one (we used to send 'ambire') is rejected with 401, so no token or contract
 * metadata reaches the device and even plain ERC-20 sends and approvals end up
 * blind-signed.
 *
 * TODO: A real token is issued through Ledger's partner program enrollment,
 * which we're chasing FOR MONTHS, see https://developers.ledger.com/docs/clear-signing/for-wallets
 */
export const LEDGER_ORIGIN_TOKEN = ''
