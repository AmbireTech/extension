/**
 * Identifies Ambire to the Ledger Clear Signing Registry. Shared by the web
 * (WebHID) and mobile (RN BLE/HID) Ledger `ContextModuleBuilder`s.
 *
 * TODO: 'ambire' is not a valid token, so it does not enable the metadata
 * fetching it is meant for (it causes no side effects either). A real token is
 * issued through Ledger's partner program enrollment, which we're chasing
 * FOR MONTHS, see https://developers.ledger.com/docs/clear-signing/for-wallets
 */
export const LEDGER_ORIGIN_TOKEN = 'ambire'
